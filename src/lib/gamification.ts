import { redis } from './redis';
import { db } from './db';
import { students, schoolAdmins, superAdmins, lessonProgress, quizAttempts } from '@/db/schema';
import { eq, sql, and, isNotNull, count } from 'drizzle-orm';
import { invalidateStudentDashboardCache } from '@/modules/student/actions';

const STATS_CACHE_TTL = 604800; // 7 days (Prevents infinite keys for inactive users)
const LB_CACHE_TTL = 604800;    // 7 days (Leaderboards are lazy-synced on fetch)

/**
 * Robust Gamification Service
 * Handles XP updates, Leaderboards (ZSET), and Progress Counters
 */

export async function awardXP(userId: string, xp: number, schoolId?: string | null, userType: 'student' | 'school_admin' | 'super_admin' = 'student') {
    try {
        // 1. Update database based on user type
        let table: any = students;
        if (userType === 'school_admin') table = schoolAdmins;
        if (userType === 'super_admin') table = superAdmins;

        await db.update(table)
            .set({
                cumulative_xp: sql`cumulative_xp + ${xp}`,
                updated_at: new Date()
            })
            .where(eq(table.id, userId));

        // 2. Update Redis Leaderboards (ZSET)
        const pipeline = redis.pipeline();

        // Update global leaderboard
        pipeline.zincrby('lb:global', xp, userId);
        pipeline.expire('lb:global', LB_CACHE_TTL);

        // Update school leaderboard if available
        if (schoolId) {
            pipeline.zincrby(`lb:school:${schoolId}`, xp, userId);
            pipeline.expire(`lb:school:${schoolId}`, LB_CACHE_TTL);
        }

        // Mark achievement data as "dirty" to trigger a re-check
        pipeline.setex(`user:${userId}:achievements_dirty`, 3600, '1');

        // PRODUCTION GUARD: Prevent unbounded ZSET growth. Trim to top 1000.
        pipeline.zremrangebyrank('lb:global', 0, -1001);
        if (schoolId) {
            pipeline.zremrangebyrank(`lb:school:${schoolId}`, 0, -1001);
        }

        await pipeline.exec();

        // Invalidate Student Dashboard Cache if student gain XP
        if (userType === 'student') {
            await invalidateStudentDashboardCache(userId);
        }
    } catch (err) {
        console.error("Error awarding XP:", err);
    }
}

export async function incrementProgressCounter(userId: string, metric: 'lessons' | 'quizzes' | 'perfect_quizzes') {
    const key = `user:${userId}:stats`;
    await redis.hincrby(key, metric, 1);
    await redis.expire(key, STATS_CACHE_TTL);
}

export async function getProgressCounter(userId: string, metric: 'lessons' | 'quizzes' | 'perfect_quizzes'): Promise<number> {
    const key = `user:${userId}:stats`;
    const val = await redis.hget(key, metric);

    if (val !== null) return parseInt(val, 10);

    // MISSING TTL / INFINITE KEY MITIGATION: Lazy sync from DB
    try {
        let dbCount = 0;
        if (metric === 'lessons') {
            const res = await db.select({ count: count() })
                .from(lessonProgress)
                .where(and(eq(lessonProgress.user_id, userId), isNotNull(lessonProgress.completed_at)));
            dbCount = Number(res[0]?.count) || 0;
        } else if (metric === 'quizzes') {
            const res = await db.select({ count: count() })
                .from(quizAttempts)
                .where(and(eq(quizAttempts.user_id, userId), eq(quizAttempts.passed, true)));
            dbCount = Number(res[0]?.count) || 0;
        } else if (metric === 'perfect_quizzes') {
            const res = await db.select({ count: count() })
                .from(quizAttempts)
                .where(and(
                    eq(quizAttempts.user_id, userId),
                    eq(quizAttempts.passed, true),
                    sql`${quizAttempts.score} = ${quizAttempts.max_score}`
                ));
            dbCount = Number(res[0]?.count) || 0;
        }

        // Cache the result
        await redis.hset(key, metric, dbCount);
        await redis.expire(key, STATS_CACHE_TTL);
        return dbCount;
    } catch (err) {
        console.error("Redundancy fallback failed for counters:", err);
        return 0;
    }
}

export async function isAchievementCheckNeeded(userId: string): Promise<boolean> {
    const dirty = await redis.get(`user:${userId}:achievements_dirty`);
    return dirty === '1';
}

export async function clearAchievementDirtyBit(userId: string) {
    await redis.del(`user:${userId}:achievements_dirty`);
}
