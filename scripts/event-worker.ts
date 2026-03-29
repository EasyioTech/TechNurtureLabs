/**
 * TECH NURTURE — Platform Event Worker (Production-Grade BullMQ)
 *
 * ARCHITECTURE:
 * - BullMQ guarantees at-least-once delivery with 5 retries + exponential backoff
 * - Each step is independently fault-isolated (separate try/catch)
 * - XP awards are fully idempotent — safe to retry without double-awarding
 * - Shared Redis connection (no per-job connection leaks)
 * - Course completion check uses exactly 2 DB queries (not N+1)
 * - course_progress upsert uses SET not increment to prevent accumulation on retries
 */

import Redis from 'ioredis';
import { PlatformEvent } from '../src/lib/services/event-service';
import { updateDailyChallengeProgress } from '../src/modules/student/actions/challenge-actions';
import { checkAndAwardAchievementsInternal } from '../src/modules/student/actions/achievement-actions';
import {
    awardXP,
    handleStudentEngagement,
    markAchievementCheckNeeded,
    incrementProgressCounter
} from '../src/lib/gamification';
import { Worker, Job } from 'bullmq';
import { db } from '../src/lib/db';
import { redis } from '../src/lib/redis';
import { xpEvents, lessons, lessonProgress, enrollments, courseProgress, auditLogs } from '../src/db/schema';
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Platform Event Worker (BullMQ) Started ---');

// Dedicated BullMQ connection — maxRetriesPerRequest: null is REQUIRED by BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const worker = new Worker('platform_events', async (job: Job) => {
    const start = Date.now();
    console.log(`[EventWorker] Starting job ${job.id} (${job.name}) attempt #${job.attemptsMade + 1}`);
    try {
        await handleEvent(job.data, job.id);
        console.log(`[EventWorker] Completed job ${job.id} in ${Date.now() - start}ms`);
    } catch (e: any) {
        console.error(`[EventWorker] Job ${job.id} FAILED after ${Date.now() - start}ms:`, e.stack);
        throw e; // Re-throw so BullMQ applies retry/backoff
    }
}, {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 1000 } // Safety cap: max 50 jobs/sec
});

worker.on('completed', (job) =>
    console.log(`[EventWorker] ✅ Job ${job.id} (${job.name}) done`)
);
worker.on('failed', (job, err) =>
    console.error(`[EventWorker] ❌ Job ${job?.id} permanently failed:`, err.message)
);

// ─────────────────────────────────────────────────────────────────────────────
// CORE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

async function handleEvent(data: any, jobId?: string) {
    const { type, userId, schoolId, courseId, lessonId, xpAmount, role, quizScore, isPerfect, amount } = data;
    const eventType = type as PlatformEvent;
    console.log(`[EventWorker] Event: ${eventType} | user: ${userId || 'system'}`);

    switch (eventType) {

        // ─────────────────────────────────────────────────────────────────────
        // FULL LESSON COMPLETION PIPELINE
        // Steps are independently isolated. A failure in step N does not
        // cause re-execution of previously successful steps on retry.
        // ─────────────────────────────────────────────────────────────────────
        case 'student.lesson_completed_full': {
            if (!userId || !courseId || !lessonId) {
                console.warn(`[EventWorker] Missing required fields — skipping. userId=${userId} courseId=${courseId} lessonId=${lessonId}`);
                break;
            }

            // ── STEP 1: XP Idempotency Guard ─────────────────────────────────
            // Must run BEFORE any XP logic.
            // Uses idx_xp_user_ref_source index for O(log n) lookup.
            // On retry: if the xpEvent row exists, steps 2+3 are skipped entirely.
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
                if (alreadyAwarded) {
                    console.log(`[EventWorker] IDEMPOTENCY HIT: XP already awarded for lesson ${lessonId} user ${userId}`);
                }
            } catch (err) {
                // Cannot verify — assume already awarded to be safe (avoid double-XP)
                console.error(`[EventWorker] Step 1 (idempotency check) error — skipping XP for safety:`, err);
                alreadyAwarded = true;
            }

            // ── STEP 2: Insert XP Event Log ───────────────────────────────────
            // Skipped if already awarded. If insert fails (e.g. unique constraint
            // from a concurrent job), we mark alreadyAwarded = true so step 3 also skips.
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
                    console.error(`[EventWorker] Step 2 (xpEvents insert) error:`, err?.message);
                    alreadyAwarded = true; // Insert failed — treat as already done
                }
            }

            // ── STEP 3: Award XP (DB + Redis Leaderboard) ────────────────────
            // skipEmit: true prevents emitting 'student.xp_gained' → infinite event loop
            if (!alreadyAwarded) {
                try {
                    const typeMap: Record<string, 'student' | 'school_admin' | 'super_admin'> = {
                        student: 'student',
                        school_admin: 'school_admin',
                        super_admin: 'super_admin'
                    };
                    await awardXP(userId, xpAmount || 0, schoolId, typeMap[role] || 'student', { skipEmit: true });
                } catch (err) {
                    console.error(`[EventWorker] Step 3 (awardXP) error:`, err);
                }
            }

            // ── STEP 4: Course Progress + Completion Check ────────────────────
            // FIX: Uses exactly 2 DB queries. No N+1.
            // FIX: progress_pct update uses SET (not increment) — idempotent on retries.
            // FIX: enrollment filter uses eq(is_active, true) not isNotNull(is_active).
            try {
                // Query 1: Get all lesson IDs for this course
                const allCourseLessons = await db
                    .select({ id: lessons.id })
                    .from(lessons)
                    .where(eq(lessons.course_id, courseId));

                const totalCount = allCourseLessons.length;

                if (totalCount > 0) {
                    // Query 2: Count completed lessons for this user IN THIS COURSE ONLY
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

                    // Upsert course_progress using SET (not +=) so retries are idempotent.
                    // total_xp_earned sums actual xp_earned from the lesson_progress rows
                    // for this course — not accumulated from individual events.
                    await db.execute(sql`
                        INSERT INTO course_progress (
                            id, user_id, course_id, enrollment_id, session_id, school_id,
                            lessons_completed, total_lessons, progress_pct,
                            total_xp_earned, created_at, updated_at
                        )
                        SELECT
                            gen_random_uuid(),
                            ${userId}::uuid,
                            ${courseId}::uuid,
                            e.id,
                            e.session_id,
                            e.school_id,
                            ${completedCount}::integer,
                            ${totalCount}::integer,
                            ${progressPct.toString()}::numeric,
                            COALESCE((
                                SELECT SUM(lp.xp_earned)
                                FROM lesson_progress lp
                                WHERE lp.user_id = ${userId}::uuid
                                  AND lp.lesson_id = ANY(ARRAY[${sql.join(allCourseLessons.map(l => sql`${l.id}::uuid`), sql`, `)}])
                                  AND lp.completed_at IS NOT NULL
                            ), 0),
                            NOW(),
                            NOW()
                        FROM enrollments e
                        WHERE e.user_id = ${userId}::uuid
                          AND e.course_id = ${courseId}::uuid
                          AND e.is_active = true
                        LIMIT 1
                        ON CONFLICT (user_id, course_id, enrollment_id)
                        DO UPDATE SET
                            lessons_completed = EXCLUDED.lessons_completed,
                            total_lessons     = EXCLUDED.total_lessons,
                            progress_pct      = EXCLUDED.progress_pct,
                            total_xp_earned   = EXCLUDED.total_xp_earned,
                            updated_at        = NOW()
                    `);

                    // Mark enrollment completed if ALL lessons are done
                    if (completedCount === totalCount) {
                        await db.update(enrollments)
                            .set({ completed_at: new Date(), updated_at: new Date() })
                            .where(and(
                                eq(enrollments.user_id, userId),
                                eq(enrollments.course_id, courseId),
                                eq(enrollments.is_active, true) // FIX: was isNotNull()
                            ));
                        console.log(`[EventWorker] 🎓 COURSE COMPLETED: user=${userId} course=${courseId}`);
                    }
                }
            } catch (err) {
                // Non-fatal — does NOT re-throw to BullMQ (XP already committed above)
                console.error(`[EventWorker] Step 4 (course progress) error:`, err);
            }

            // ── STEP 5: Redis Progress Counters + Streak ──────────────────────
            // Guarded by alreadyAwarded so counters don't increment twice on retry
            if (!alreadyAwarded && (role === 'student' || !role)) {
                try {
                    await incrementProgressCounter(userId, 'lessons');
                    if (quizScore !== undefined) {
                        await incrementProgressCounter(userId, 'quizzes');
                        if (isPerfect) await incrementProgressCounter(userId, 'perfect_quizzes');
                    }
                    await handleStudentEngagement(userId);
                } catch (err) {
                    console.error(`[EventWorker] Step 5 (counters/engagement) error:`, err);
                }
            }

            // ── STEP 6: Achievements + Daily Challenges ───────────────────────
            // Fully independent of XP flow. Failure here is NOT re-thrown.
            try {
                await markAchievementCheckNeeded(userId);
                await updateDailyChallengeProgress(userId, 'lesson_complete', 1);
                await checkAndAwardAchievementsInternal(userId);
            } catch (err) {
                console.error(`[EventWorker] Step 6 (achievements) error:`, err);
            }

            // ── STEP 7: Audit Trail ───────────────────────────────────────────
            try {
                await db.insert(auditLogs).values({
                    user_id: userId,
                    school_id: schoolId,
                    action: 'create',
                    entity_type: 'lesson_progress',
                    entity_id: lessonId,
                    new_values: {
                        xp_earned: xpAmount,
                        course_id: courseId,
                        idempotency_hit: alreadyAwarded,
                        job_id: jobId
                    },
                    created_at: new Date()
                } as any);
            } catch (err) {
                console.error(`[EventWorker] Step 7 (audit log) error:`, err);
            }

            // ── STEP 8: Cache Invalidation ────────────────────────────────────
            try {
                await redis.del(
                    `cache:student:${userId}:course:${courseId}`,
                    `cache:student:${userId}:dashboard`
                );
            } catch (err) {
                console.error(`[EventWorker] Step 8 (cache invalidation) error:`, err);
            }

            break;
        }

        // ─────────────────────────────────────────────────────────────────────
        // LEGACY EVENT (kept for backward compat with older queued jobs)
        // ─────────────────────────────────────────────────────────────────────
        case 'student.lesson_completed':
            try {
                if (userId) await markAchievementCheckNeeded(userId);
                if (userId) await updateDailyChallengeProgress(userId, 'quiz_complete', 1);
                if (userId) await checkAndAwardAchievementsInternal(userId);
            } catch (err) {
                console.error(`[EventWorker] student.lesson_completed handler error:`, err);
            }
            break;

        // ─────────────────────────────────────────────────────────────────────
        // XP GAINED (from challenges, bonuses, etc.)
        // ─────────────────────────────────────────────────────────────────────
        case 'student.xp_gained':
            try {
                if (userId && amount) {
                    await updateDailyChallengeProgress(userId, 'xp_gain', amount);
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
            } catch (err) {
                console.error(`[EventWorker] student.xp_gained handler error:`, err);
            }
            break;

        // ─────────────────────────────────────────────────────────────────────
        // PERFECT QUIZ
        // ─────────────────────────────────────────────────────────────────────
        case 'student.quiz_perfect':
            try {
                if (userId) {
                    await updateDailyChallengeProgress(userId, 'perfect_quiz', 1);
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
            } catch (err) {
                console.error(`[EventWorker] student.quiz_perfect handler error:`, err);
            }
            break;

        default:
            console.log(`[EventWorker] Unknown event: ${eventType} — ignoring`);
    }
}
