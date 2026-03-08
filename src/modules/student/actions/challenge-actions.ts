'use server';

import { db } from '@/lib/db';
import { dailyChallenges, userDailyChallenges, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

// Helper to get today's date string in YYYY-MM-DD format
function getTodayString() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export async function getOrGenerateDailyChallenges(userId: string) {
    const todayStr = getTodayString();

    // Check if challenges exist for today
    let todayChallenges = await db.query.dailyChallenges.findMany({
        where: eq(dailyChallenges.challenge_date, todayStr)
    });

    // If no challenges exist today, generate them centrally (first user of the day triggers this)
    if (todayChallenges.length === 0) {
        try {
            const newChallenges = await db.insert(dailyChallenges).values([
                {
                    title: 'Quick Learner',
                    description: 'Complete 2 lessons today.',
                    xp_reward: 50,
                    challenge_date: todayStr,
                    status: 'active',
                    criteria: { type: 'quiz_complete', target: 2, icon: 'book-open' }
                },
                {
                    title: 'Perfect Streak',
                    description: 'Log in and study today.',
                    xp_reward: 20,
                    challenge_date: todayStr,
                    status: 'active',
                    criteria: { type: 'streak', target: 1, icon: 'flame' }
                },
                {
                    title: 'Master Scorer',
                    description: 'Earn 100 XP today.',
                    xp_reward: 100,
                    challenge_date: todayStr,
                    status: 'active',
                    criteria: { type: 'xp_gain', target: 100, icon: 'star' }
                }
            ]).returning();
            todayChallenges = newChallenges;
        } catch (e) {
            // Possible race condition if multiple users hit this at the exact same sec. Fallback:
            todayChallenges = await db.query.dailyChallenges.findMany({
                where: eq(dailyChallenges.challenge_date, todayStr)
            });
        }
    }

    // Now, get the user's progress for these challenges
    const userChallenges = await db.query.userDailyChallenges.findMany({
        where: eq(userDailyChallenges.user_id, userId)
    });

    const userMap = new Map(userChallenges.map(uc => [uc.challenge_id, uc]));

    const formatted = todayChallenges.map(c => {
        const uc = userMap.get(c.id);
        const criteria = c.criteria as any;
        return {
            id: c.id,
            title: c.title,
            challenge_type: criteria?.type || 'unknown',
            target_value: criteria?.target || 1,
            xp_reward: c.xp_reward,
            icon: criteria?.icon || 'zap',
            current_progress: uc ? (uc.xp_earned || 0) : 0,
            is_completed: !!uc?.completed_at
        };
    });

    return formatted;
}

export async function updateDailyChallengeProgress(userId: string, actionType: string, amount: number = 1) {
    const todayStr = getTodayString();

    // Attempt to get or generate today's challenges
    const todayChallenges = await getOrGenerateDailyChallenges(userId);
    if (!todayChallenges || todayChallenges.length === 0) return;

    // Find any challenges that match the action type and are NOT completed yet
    const matchingChallenges = todayChallenges.filter((c: any) =>
        (c.challenge_type === actionType || c.challenge_type === 'xp_gain') && !c.is_completed
    );

    for (const challenge of matchingChallenges) {
        // Find existing user progress
        const existingProgressRow = await db.query.userDailyChallenges.findFirst({
            where: and(
                eq(userDailyChallenges.user_id, userId),
                eq(userDailyChallenges.challenge_id, challenge.id)
            )
        });

        // Determine how much to add. If this is xp_gain check, we add the actual amount
        const increment = challenge.challenge_type === 'xp_gain' ? amount : 1;
        const currentProgress = existingProgressRow ? (existingProgressRow.xp_earned || 0) : 0;
        const newProgress = Math.min(currentProgress + increment, challenge.target_value);

        if (existingProgressRow) {
            await db.update(userDailyChallenges).set({
                xp_earned: newProgress,
                completed_at: newProgress >= challenge.target_value ? new Date() : null
            }).where(eq(userDailyChallenges.id, existingProgressRow.id));
        } else {
            await db.insert(userDailyChallenges).values({
                user_id: userId,
                challenge_id: challenge.id,
                xp_earned: newProgress,
                completed_at: newProgress >= challenge.target_value ? new Date() : null
            } as any);
        }

        // If this exact update completed it, reward the user with XP
        if (newProgress >= challenge.target_value && currentProgress < challenge.target_value) {
            const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            if (user) {
                await db.update(users).set({
                    cumulative_xp: (Number(user.cumulative_xp) || 0) + challenge.xp_reward
                }).where(eq(users.id, userId));
            }
        }
    }
}
