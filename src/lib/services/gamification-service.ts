
// import 'server-only';
import { db } from '../db';
import { students, xpEvents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redis } from '../redis';

/**
 * 🎮 TECH NURTURE GAMIFICATION SERVICE
 * Handles levels, XP calculations, and streaks.
 */

const XP_PER_LEVEL = 500;

export const gamificationService = {
    /**
     * Calculates current level based on total XP
     */
    calculateLevel: (totalXp: number) => {
        return Math.floor(totalXp / XP_PER_LEVEL) + 1;
    },

    /**
     * Efficiently adds XP with Redis buffering to prevent DB locks
     */
    awardXP: async (userId: string, amount: number, schoolId?: string, source: string = 'engagement') => {
        try {
            // 1. Buffer in Redis for real-time UI updates
            const userKey = `student:${userId}:stats`;
            await redis.hincrby(userKey, 'cumulative_xp', amount);
            await redis.expire(userKey, 3600); // 1 hour TTL

            // 2. Persist to DB asynchronously or in this task
            // Note: For now we do immediate persist but we could move to a batch job
            await db.transaction(async (tx) => {
                // Update student total
                await tx.update(students)
                    .set({ 
                        cumulative_xp: sql`${students.cumulative_xp} + ${amount}`,
                        updated_at: new Date()
                    })
                    .where(eq(students.id, userId));

                // Log XP event
                if (schoolId) {
                    await tx.insert(xpEvents).values({
                        user_id: userId,
                        school_id: schoolId,
                        source: source as any,
                        xp_amount: amount,
                        created_at: new Date()
                    });
                }
            });

            return true;
        } catch (err) {
            console.error('[Gamification] XP Award failed:', err);
            return false;
        }
    },

    /**
     * Retrieves student progress details
     */
    getStudentProgress: async (userId: string) => {
        const student = await db.query.students.findFirst({
            where: eq(students.id, userId),
            columns: {
                cumulative_xp: true,
                current_streak: true
            }
        });

        if (!student) return null;

        const totalXp = Number(student.cumulative_xp) || 0;
        const level = gamificationService.calculateLevel(totalXp);
        const xpInCurrentLevel = totalXp % XP_PER_LEVEL;
        const progressToNextLevel = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

        return {
            totalXp,
            level,
            xpInCurrentLevel,
            nextLevelThreshold: XP_PER_LEVEL,
            progressToNextLevel,
            streak: student.current_streak || 0
        };
    }
};
