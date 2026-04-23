import { redis } from './redis';
import { db } from './db';
import { students, schoolAdmins, superAdmins, lessonProgress, quizAttempts, xpEvents } from '@/db/schema';
import { eq, sql, and, isNotNull, count, isNull } from 'drizzle-orm';
import { invalidateStudentDashboardCache } from '@/modules/student/actions';

const STATS_CACHE_TTL = 604800; // 7 days (Prevents infinite keys for inactive users)
const LB_CACHE_TTL = 604800;    // 7 days (Leaderboards are lazy-synced on fetch)

/**
 * Leveling Logic: 
 * We use an exponential curve to prevent XP inflation.
 * Level 1: 0 - 500 XP
 * Level 2: 500 - 1075 XP (+575)
 * Level 3: 1075 - 1736 XP (+661)
 * Formula: XP_to_reach_level_n = 500 * (1.15^(n-1) - 1) / (1.15 - 1)
 */
export const BASE_LEVEL_XP = 500;
export const XP_GROWTH_FACTOR = 1.15;

export function getXpThresholdForLevel(level: number): number {
    if (level <= 1) return 0;
    // Geometric series sum: a(r^n - 1) / (r - 1)
    return Math.floor(BASE_LEVEL_XP * (Math.pow(XP_GROWTH_FACTOR, level - 1) - 1) / (XP_GROWTH_FACTOR - 1));
}

export function calculateLevel(totalXp: number) {
    let level = 1;
    while (totalXp >= getXpThresholdForLevel(level + 1)) {
        level++;
    }
    
    const currentLevelThreshold = getXpThresholdForLevel(level);
    const nextLevelThreshold = getXpThresholdForLevel(level + 1);
    const xpInLevel = totalXp - currentLevelThreshold;
    const xpNeededForNext = nextLevelThreshold - currentLevelThreshold;
    const progress = Math.min(100, Math.floor((xpInLevel / xpNeededForNext) * 100));

    return {
        level,
        xpInLevel,
        xpNeededForNext,
        progress,
        nextLevelThreshold
    };
}

export async function awardXP(
    userId: string,
    xp: number,
    schoolId?: string | null,
    userType: 'student' | 'school_admin' | 'super_admin' = 'student',
    options?: { 
        skipEmit?: boolean, 
        source?: 'lesson_completion' | 'quiz_score' | 'daily_streak' | 'bonus',
        referenceId?: string,
        referenceType?: string,
        description?: string
    },
    externalTx?: any
) {
    try {
        if (!Number.isFinite(xp) || xp <= 0) return { leveledUp: false, newLevel: 1 };

        if (xp > 10000) {
            console.error('[XP Award] Unreasonably large XP amount:', { userId, xp });
            return { leveledUp: false, newLevel: 1 };
        }

        // Only students earn XP in the current schema
        if (userType !== 'student') return { leveledUp: false, newLevel: 1 };

        const runInTransaction = async (tx: any) => {
            // 1. Update Student XP with returning to get precise new value
            const [student] = await tx.update(students)
                .set({
                    cumulative_xp: sql`${students.cumulative_xp} + ${xp}`,
                    updated_at: new Date()
                })
                .where(and(eq(students.id, userId), isNull(students.deleted_at)))
                .returning({ 
                    cumulative_xp: students.cumulative_xp, 
                    school_id: students.school_id 
                });

            if (!student) return null;

            const targetSchoolId = schoolId || student.school_id;

            // 2. Log to XP Ledger (Source of Truth)
            if (targetSchoolId) {
                await tx.insert(xpEvents).values({
                    user_id: userId,
                    school_id: targetSchoolId,
                    source: options?.source || 'bonus',
                    xp_amount: xp,
                    reference_id: options?.referenceId,
                    reference_type: options?.referenceType,
                    description: options?.description,
                    created_at: new Date()
                } as any);
            }

            const newXp = student.cumulative_xp || 0;
            const oldXp = newXp - xp;
            
            const oldLevelData = calculateLevel(oldXp);
            const newLevelData = calculateLevel(newXp);
            const leveledUp = newLevelData.level > oldLevelData.level;

            return {
                leveledUp,
                oldLevel: oldLevelData.level,
                newLevel: newLevelData.level,
                totalXp: newXp,
                schoolId: targetSchoolId
            };
        };

        // SECURITY & ATOMICITY: Use transaction to ensure student total and XP ledger remain in sync
        const result = externalTx ? await runInTransaction(externalTx) : await db.transaction(runInTransaction);

        if (!result) return { leveledUp: false, newLevel: 1 };

        // 3. Sync to Redis for real-time leaderboards
        const pipeline = redis.pipeline();
        pipeline.zincrby('lb:global', xp, userId);
        pipeline.expire('lb:global', LB_CACHE_TTL);

        if (result.schoolId) {
            pipeline.zincrby(`lb:school:${result.schoolId}`, xp, userId);
            pipeline.expire(`lb:school:${result.schoolId}`, LB_CACHE_TTL);
        }

        pipeline.setex(`user:${userId}:achievements_dirty`, 3600, '1');
        pipeline.zremrangebyrank('lb:global', 0, -1001);
        
        if (result.schoolId) {
            pipeline.zremrangebyrank(`lb:school:${result.schoolId}`, 0, -1001);
        }

        await pipeline.exec();

        await invalidateStudentDashboardCache(userId);

        if (!options?.skipEmit) {
            import('./services/event-service')
                .then(({ eventService }) =>
                    eventService.emit('student.xp_gained', {
                        userId,
                        schoolId: result.schoolId ?? undefined,
                        amount: xp,
                        timestamp: Date.now(),
                        leveledUp: result.leveledUp,
                        newLevel: result.newLevel
                    }).catch(() => {})
                )
                .catch(() => {});
        }

        return {
            leveledUp: result.leveledUp,
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
            totalXp: result.totalXp
        };
    } catch (err) {
        console.error("Error awarding XP:", err);
        return { leveledUp: false, newLevel: 1 };
    }
}

/**
 * Handles student streak logic and login-based daily challenges.
 * This should be called on login and on lesson/quiz completion.
 */
export async function handleStudentEngagement(userId: string) {
    try {
        const student = await db.query.students.findFirst({
            where: and(eq(students.id, userId), isNull(students.deleted_at)),
            columns: {
                id: true,
                current_streak: true,
                longest_streak: true,
                last_active_at: true
            }
        });

        if (!student) {
            console.warn(`Engagement skip: Student not found or deleted for ID: ${userId}`);
            return;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let newStreak = student.current_streak || 0;
        const lastActiveDate = student.last_active_at ? new Date(student.last_active_at) : null;
        
        if (lastActiveDate) {
            const lastActiveStr = lastActiveDate.toISOString().split('T')[0];
            
            if (todayStr === lastActiveStr) {
                // Already processed today, keep current streak
                if (newStreak === 0) newStreak = 1;
            } else {
                // Check if yesterday was the last active day
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastActiveStr === yesterdayStr) {
                    // Consecutive day!
                    newStreak += 1;
                } else {
                    // Gap detected, reset but count today as day 1
                    newStreak = 1;
                }
            }
        } else {
            // First time activity
            newStreak = 1;
        }

        const longestStreak = Math.max(newStreak, student.longest_streak || 0);

        await db.update(students).set({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_active_at: new Date(),
            updated_at: new Date()
        }).where(eq(students.id, userId));

        // Trigger the "streak" (login) challenge progress
        try {
            const { updateDailyChallengeProgress } = await import('@/modules/student/actions/challenge-actions');
            await updateDailyChallengeProgress(userId, 'streak', 1);
        } catch (e) {
            console.error("Failed to update streak challenge:", e);
        }

        // Mark achievement data as "dirty" to trigger a re-check on next dashboard visit
        await redis.setex(`user:${userId}:achievements_dirty`, 3600, '1');

        // Invalidate dashboard to show new streak
        await invalidateStudentDashboardCache(userId);
    } catch (err: any) {
        console.error("Engagement handling error:", {
            message: err?.message || String(err),
            code: err?.code,
            query: err?.query
        });
    }
}

export async function incrementProgressCounter(userId: string, metric: 'lessons' | 'quizzes' | 'perfect_quizzes') {
    const key = `user:${userId}:stats`;
    try {
        await redis.hincrby(key, metric, 1);
        await redis.expire(key, STATS_CACHE_TTL);
    } catch (e) {
        console.warn('[Gamification] Redis unavailable for counter increment — skipping cache:', (e as Error).message);
    }
}

export async function getProgressCounter(userId: string, metric: 'lessons' | 'quizzes' | 'perfect_quizzes'): Promise<number> {
    const key = `user:${userId}:stats`;
    let val: string | null = null;
    try { val = await redis.hget(key, metric); } catch (_) {}

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
    try {
        const dirty = await redis.get(`user:${userId}:achievements_dirty`);
        return dirty === '1';
    } catch (_) {
        return false; // Redis down — skip achievement check, not critical
    }
}

export async function markAchievementCheckNeeded(userId: string) {
    try {
        await redis.setex(`user:${userId}:achievements_dirty`, 3600, '1');
    } catch (_) { /* non-critical — will re-check on next XP award */ }
}

export async function clearAchievementDirtyBit(userId: string) {
    try {
        await redis.del(`user:${userId}:achievements_dirty`);
    } catch (_) { /* non-critical */ }
}
