/**
 * TECH NURTURE — Platform Event Worker Service
 * 
 * Consolidates the achievement, XP, and streak logic into the main app process.
 */

import Redis from 'ioredis';
import { PlatformEvent } from '../services/event-service';
import { updateDailyChallengeProgress } from '@/modules/student/actions/challenge-actions';
import { checkAndAwardAchievementsInternal } from '@/modules/student/actions/achievement-actions';
import {
    awardXP,
    handleStudentEngagement,
    markAchievementCheckNeeded,
    incrementProgressCounter
} from '@/lib/gamification';
import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { xpEvents, lessons, lessonProgress, enrollments, courseProgress, auditLogs } from '@/db/schema';
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm';

let worker: Worker | null = null;

export function startEventWorker() {
    if (worker) return; // Already running

    const isRedisDisabled = process.env.DISABLE_REDIS === 'true' || process.env.npm_lifecycle_event === 'build';
    if (isRedisDisabled) {
        console.log('[EventWorker] Skipping worker start (Redis disabled or Build mode)');
        return;
    }

    console.log('--- [Consolidated] Platform Event Worker Starting ---');

    // Dedicated BullMQ connection
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });

    worker = new Worker('platform_events', async (job: Job) => {
        const start = Date.now();
        try {
            await handleEvent(job.data, job.id);
        } catch (e: any) {
            console.error(`[EventWorker] Job ${job.id} FAILED:`, e.stack);
            throw e; 
        }
    }, {
        connection,
        concurrency: 5, // Lowered concurrency for shared process
        limiter: { max: 50, duration: 1000 }
    });

    worker.on('completed', (job) =>
        console.log(`[EventWorker] ✅ Job ${job.id} done`)
    );
    worker.on('failed', (job, err) =>
        console.error(`[EventWorker] ❌ Job ${job?.id} failed:`, err.message)
    );
}

async function handleEvent(data: any, jobId?: string) {
    const { type, userId, schoolId, courseId, lessonId, xpAmount, role, quizScore, isPerfect, amount } = data;
    const eventType = type as PlatformEvent;

    switch (eventType) {
        case 'student.lesson_completed_full': {
            if (!userId || !courseId || !lessonId) break;

            let alreadyAwarded = false;
            try {
                const existingXpEvent = await db.query.xpEvents.findFirst({
                    where: and(
                        eq(xpEvents.user_id, userId),
                        eq(xpEvents.reference_id, lessonId),
                        eq(xpEvents.source, 'lesson_completion')
                    ),
                    columns: { id: true }
                });
                alreadyAwarded = !!existingXpEvent;
            } catch (err) {
                alreadyAwarded = true;
            }

            if (!alreadyAwarded && schoolId) {
                try {
                    await db.insert(xpEvents).values({
                        user_id: userId,
                        school_id: schoolId,
                        source: 'lesson_completion',
                        xp_amount: xpAmount || 0,
                        reference_type: 'lesson',
                        reference_id: lessonId,
                        created_at: new Date()
                    });
                } catch (err: any) {
                    alreadyAwarded = true;
                }
            }

            if (!alreadyAwarded) {
                try {
                    const typeMap: any = { student: 'student', school_admin: 'school_admin', super_admin: 'super_admin' };
                    await awardXP(userId, xpAmount || 0, schoolId, typeMap[role] || 'student', { skipEmit: true });
                } catch (err) {}
            }

            try {
                const allCourseLessons = await db
                    .select({ id: lessons.id })
                    .from(lessons)
                    .where(eq(lessons.course_id, courseId));

                const totalCount = allCourseLessons.length;
                if (totalCount > 0) {
                    const completedRows = await db
                        .select({ id: lessonProgress.id })
                        .from(lessonProgress)
                        .where(and(
                            eq(lessonProgress.user_id, userId),
                            isNotNull(lessonProgress.completed_at),
                            inArray(lessonProgress.lesson_id, allCourseLessons.map(l => l.id))
                        ));

                    const completedCount = completedRows.length;
                    const progressPct = Math.min(100, Math.round((completedCount / totalCount) * 100));

                    await db.execute(sql`
                        INSERT INTO course_progress (
                            id, user_id, course_id, enrollment_id, session_id, school_id,
                            lessons_completed, total_lessons, progress_pct,
                            total_xp_earned, created_at, updated_at
                        )
                        SELECT
                            gen_random_uuid(), ${userId}::uuid, ${courseId}::uuid, e.id, e.session_id, e.school_id,
                            ${completedCount}::integer, ${totalCount}::integer, ${progressPct.toString()}::numeric,
                            COALESCE((
                                SELECT SUM(lp.xp_earned)
                                FROM lesson_progress lp
                                WHERE lp.user_id = ${userId}::uuid
                                  AND lp.lesson_id = ANY(ARRAY[${sql.join(allCourseLessons.map(l => sql`${l.id}::uuid`), sql`, `)}])
                                  AND lp.completed_at IS NOT NULL
                            ), 0),
                            NOW(), NOW()
                        FROM enrollments e
                        WHERE e.user_id = ${userId}::uuid AND e.course_id = ${courseId}::uuid AND e.is_active = true
                        LIMIT 1
                        ON CONFLICT (user_id, course_id, enrollment_id)
                        DO UPDATE SET
                            lessons_completed = EXCLUDED.lessons_completed,
                            total_lessons     = EXCLUDED.total_lessons,
                            progress_pct      = EXCLUDED.progress_pct,
                            total_xp_earned   = EXCLUDED.total_xp_earned,
                            updated_at        = NOW()
                    `);

                    if (completedCount === totalCount) {
                        await db.update(enrollments)
                            .set({ completed_at: new Date(), updated_at: new Date() })
                            .where(and(eq(enrollments.user_id, userId), eq(enrollments.course_id, courseId), eq(enrollments.is_active, true)));
                    }
                }
            } catch (err) {}

            if (!alreadyAwarded && (role === 'student' || !role)) {
                try {
                    await incrementProgressCounter(userId, 'lessons');
                    if (quizScore !== undefined) {
                        await incrementProgressCounter(userId, 'quizzes');
                        if (isPerfect) await incrementProgressCounter(userId, 'perfect_quizzes');
                    }
                    await handleStudentEngagement(userId);
                } catch (err) {}
            }

            try {
                await markAchievementCheckNeeded(userId);
                await updateDailyChallengeProgress(userId, 'lesson_complete', 1);
                await checkAndAwardAchievementsInternal(userId);
            } catch (err) {}

            try {
                await db.insert(auditLogs).values({
                    user_id: userId, school_id: schoolId, action: 'create', entity_type: 'lesson_progress', entity_id: lessonId,
                    new_values: { xp_earned: xpAmount, course_id: courseId, idempotency_hit: alreadyAwarded, job_id: jobId },
                    created_at: new Date()
                } as any);
            } catch (err) {}

            try {
                await redis.del(`cache:student:${userId}:course:${courseId}`, `cache:student:${userId}:dashboard`);
            } catch (err) {}
            break;
        }

        case 'student.lesson_completed':
            try {
                if (userId) {
                    await markAchievementCheckNeeded(userId);
                    await updateDailyChallengeProgress(userId, 'quiz_complete', 1);
                    await checkAndAwardAchievementsInternal(userId);
                }
            } catch (err) {}
            break;

        case 'student.xp_gained':
            try {
                if (userId && amount) {
                    await updateDailyChallengeProgress(userId, 'xp_gain', amount);
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
            } catch (err) {}
            break;

        case 'student.quiz_perfect':
            try {
                if (userId) {
                    await updateDailyChallengeProgress(userId, 'perfect_quiz', 1);
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
            } catch (err) {}
            break;
    }
}
