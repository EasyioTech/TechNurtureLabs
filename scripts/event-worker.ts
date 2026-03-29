import Redis from 'ioredis';
import { PlatformEvent } from '../src/lib/services/event-service';
import { updateDailyChallengeProgress } from '../src/modules/student/actions/challenge-actions';
import { checkAndAwardAchievementsInternal } from '../src/modules/student/actions/achievement-actions';
import { awardXP, handleStudentEngagement, markAchievementCheckNeeded, incrementProgressCounter } from '../src/lib/gamification';
import { Worker, Job } from 'bullmq';
import { db } from '../src/lib/db';
import { redis } from '../src/lib/redis';
import { xpEvents, lessons, lessonProgress, enrollments, auditLogs } from '../src/db/schema';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Platform Event Worker (BullMQ) Started ---');

// SCALE BREAKER B: Dedicated Connection for BULLMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const worker = new Worker('platform_events', async (job: Job) => {
    try {
        await handleEvent(job.data, job.id);
    } catch (e: any) {
        console.error(`[EventWorker] Job ${job.id} CRITICAL FAILURE:`, e.stack);
        throw e; // Standard retry mechanism
    }
}, {
    connection,
    concurrency: 10, // Max concurrent jobs per worker thread
    limiter: {
        max: 50, // Rate limit: max 50 jobs per second (safety cap)
        duration: 1000
    }
});

worker.on('completed', (job) => {
    console.log(`[EventWorker] Success: Job ${job.id} (${job.name})`);
});

worker.on('failed', (job, err) => {
    console.error(`[EventWorker] Job ${job?.id} failed after retries:`, err.message);
});

async function handleEvent(data: any, jobId?: string) {
    const { type, userId, schoolId, courseId, lessonId, xpAmount, role, quizScore, isPerfect, amount } = data;
    const eventType = type as PlatformEvent;

    console.log(`[EventWorker] Processing ${eventType} (ID: ${jobId}) for user: ${userId || 'guest'}`);

    switch (eventType) {
        case 'student.lesson_completed_full': {
            if (!userId || !courseId || !lessonId) break;

            // 1. Log XP Event
            if (schoolId) {
                await db.insert(xpEvents).values({
                    user_id: userId,
                    school_id: schoolId,
                    source: 'lesson_completion',
                    xp_amount: xpAmount || 0,
                    reference_type: 'lesson',
                    reference_id: lessonId,
                    created_at: new Date()
                });
            }

            // 2. Course Completion State Machine
            const allCourseLessons = await db.select({ id: lessons.id })
                .from(lessons)
                .where(eq(lessons.course_id, courseId));
            
            const completedCourseLessons = await db.select({ id: lessonProgress.id })
                .from(lessonProgress)
                .where(and(
                    eq(lessonProgress.user_id, userId),
                    isNotNull(lessonProgress.completed_at),
                    inArray(lessonProgress.lesson_id, allCourseLessons.map(l => l.id))
                ));
            
            if (completedCourseLessons.length === allCourseLessons.length) {
                await db.update(enrollments)
                    .set({ completed_at: new Date(), updated_at: new Date() })
                    .where(and(eq(enrollments.user_id, userId), eq(enrollments.course_id, courseId)));
                console.log(`[EventWorker] User ${userId} COMPLETED course ${courseId}`);
            }

            // 3. XP & Engagement Processing (LOOP SAFETY: skipEmit=true)
            const typeMap: any = { student: 'student', school_admin: 'school_admin', super_admin: 'super_admin' };
            await awardXP(userId, xpAmount || 0, schoolId, typeMap[role] || 'student', { skipEmit: true });

            if (role === 'student' || !role) {
                await incrementProgressCounter(userId, 'lessons');
                if (quizScore !== undefined) {
                    await incrementProgressCounter(userId, 'quizzes');
                    if (isPerfect) await incrementProgressCounter(userId, 'perfect_quizzes');
                }
                await handleStudentEngagement(userId);
                
                // Achievement Logic
                await markAchievementCheckNeeded(userId);
                await updateDailyChallengeProgress(userId, 'lesson_complete', 1);
                await checkAndAwardAchievementsInternal(userId);
            }

            // 4. Audit Trail (Scale-Hardened Partition Schema)
            await db.insert(auditLogs).values({
                user_id: userId,
                school_id: schoolId,
                action: 'create',
                entity_type: 'lesson_progress',
                entity_id: lessonId,
                new_values: { xp_earned: xpAmount, course_id: courseId },
                created_at: new Date()
            } as any);

            // 5. Cache Invalidation
            // USING SHARED LIB/REDIS (M-11)
            await redis.del(`cache:student:${userId}:course:${courseId}`);
            break;
        }

        case 'student.lesson_completed':
            if (userId) await markAchievementCheckNeeded(userId);
            if (userId) await updateDailyChallengeProgress(userId, 'quiz_complete', 1);
            if (userId) await checkAndAwardAchievementsInternal(userId);
            break;

        case 'student.xp_gained':
            if (userId && amount) {
                await updateDailyChallengeProgress(userId, 'xp_gain', amount);
                await markAchievementCheckNeeded(userId);
                await checkAndAwardAchievementsInternal(userId);
            }
            break;

        case 'student.quiz_perfect':
            if (userId) {
                await updateDailyChallengeProgress(userId, 'perfect_quiz', 1);
                await markAchievementCheckNeeded(userId);
                await checkAndAwardAchievementsInternal(userId);
            }
            break;

        default:
            console.log(`[EventWorker] Unknown event: ${eventType} - Skipping.`);
    }
}
