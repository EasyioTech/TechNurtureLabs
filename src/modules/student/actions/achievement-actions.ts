'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import {
    students,
    achievements,
    userAchievements,
    lessonProgress,
    quizAttempts,
    xpEvents,
    enrollments,
    auditLogs
} from '@/db/schema';
import { eq, and, gt, sql, count, isNotNull, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Idempotent achievement seeding
 */
export async function seedAchievementsData() {
    const defaultAchievements = [
        // Beginner Badges
        {
            name: 'First Steps',
            description: 'Completed your first lesson',
            icon_url: 'award',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'lesson_count', value: 1 }
        },
        {
            name: 'Quiz Starter',
            description: 'Passed your first quiz',
            icon_url: 'target',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'quiz_count', value: 1 }
        },
        {
            name: 'XP Earner',
            description: 'Reached 500 total XP',
            icon_url: 'zap',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'xp', value: 500 }
        },
        {
            name: 'Profile Pro',
            description: 'Added a bio to your profile',
            icon_url: 'user',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'bio_updated', value: true }
        },

        // Advanced Badges
        {
            name: 'Perfect Score',
            description: 'Achieved 100% on a quiz',
            icon_url: 'star',
            tier: 'gold' as const,
            category: 'Advanced',
            criteria: { type: 'perfect_quiz', value: 1 }
        },
        {
            name: 'Course Master',
            description: 'Completed a full learning module',
            icon_url: 'award',
            tier: 'gold' as const,
            category: 'Advanced',
            criteria: { type: 'course_complete', value: 1 }
        },
        {
            name: 'Expert Learner',
            description: 'Earned over 5,000 XP',
            icon_url: 'shield',
            tier: 'platinum' as const,
            category: 'Advanced',
            criteria: { type: 'xp', value: 5000 }
        },
        {
            name: 'Elite Scholar',
            description: 'Passed 10 complex quizzes',
            icon_url: 'trophy',
            tier: 'platinum' as const,
            category: 'Advanced',
            criteria: { type: 'quiz_count', value: 10 }
        },

        // Persistence Badges
        {
            name: 'Consistency King',
            description: 'Maintained a 3-day learning streak',
            icon_url: 'flame',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'streak', value: 3 }
        },
        {
            name: 'Weekly Warrior',
            description: 'Maintained a 7-day learning streak',
            icon_url: 'flame',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'streak', value: 7 }
        },
        {
            name: 'Dedicated Student',
            description: 'Completed 20 lessons total',
            icon_url: 'medal',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'lesson_count', value: 20 }
        },
        {
            name: 'Learning Marathon',
            description: 'Spent over 5 hours learning',
            icon_url: 'clock',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'learning_time', value: 300 } // minutes
        }
    ];

    for (const ach of defaultAchievements) {
        const existing = await db.query.achievements.findFirst({
            where: eq(achievements.name, ach.name)
        });

        if (!existing) {
            await db.insert(achievements).values(ach as any);
        } else {
            // Update to ensure correct category and criteria if names match
            await db.update(achievements)
                .set({
                    category: ach.category,
                    criteria: ach.criteria,
                    tier: ach.tier,
                    description: ach.description,
                    icon_url: ach.icon_url
                })
                .where(eq(achievements.id, existing.id));
        }
    }
}

/**
 * Check and award achievements to the current user
 */
export async function checkAndAwardAchievements() {
    const session = await verifySession();
    if (!session) return { success: false, error: 'Unauthorized' };
    const userId = session.userId;

    // Ensure achievements exist
    await seedAchievementsData();

    const user = await db.query.students.findFirst({
        where: eq(students.id, userId)
    });
    if (!user) return { success: false, error: 'User not found' };

    const unlockedAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, userId)
    });
    const unlockedSet = new Set(unlockedAchvs.map(ua => ua.achievement_id));

    const allAchvs = await db.query.achievements.findMany({
        where: eq(achievements.is_active, true)
    });

    // Fetch user stats for criteria checking
    const lessonCountResult = await db.select({ count: count() })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.user_id, userId), isNotNull(lessonProgress.completed_at)));
    const lessonsCompleted = Number(lessonCountResult[0]?.count) || 0;

    const quizCountResult = await db.select({ count: count() })
        .from(quizAttempts)
        .where(and(eq(quizAttempts.user_id, userId), eq(quizAttempts.passed, true)));
    const quizzesPassed = Number(quizCountResult[0]?.count) || 0;

    const perfectQuizResult = await db.select({ count: count() })
        .from(quizAttempts)
        .where(and(
            eq(quizAttempts.user_id, userId),
            eq(quizAttempts.passed, true),
            sql`${quizAttempts.score} = ${quizAttempts.max_score}`
        ));
    const perfectQuizzes = Number(perfectQuizResult[0]?.count) || 0;

    const timeSpentResult = await db.select({ total: sql<number>`sum(${lessonProgress.time_spent_secs})` })
        .from(lessonProgress)
        .where(eq(lessonProgress.user_id, userId));
    const learningMinutes = Math.floor((Number(timeSpentResult[0]?.total) || 0) / 60);

    const fullCoursesResult = await db.select({ count: count() })
        .from(enrollments)
        .where(and(eq(enrollments.user_id, userId), isNotNull(enrollments.completed_at)));
    const coursesCompleted = Number(fullCoursesResult[0]?.count) || 0;

    const newlyUnlocked = [];

    for (const ach of allAchvs) {
        if (unlockedSet.has(ach.id)) continue;

        const criteria = ach.criteria as any;
        let isMet = false;

        switch (criteria?.type) {
            case 'lesson_count':
                isMet = lessonsCompleted >= criteria.value;
                break;
            case 'quiz_count':
                isMet = quizzesPassed >= criteria.value;
                break;
            case 'xp':
                isMet = (Number(user.cumulative_xp) || 0) >= criteria.value;
                break;
            case 'streak':
                isMet = (user.current_streak || 0) >= criteria.value;
                break;
            case 'perfect_quiz':
                isMet = perfectQuizzes >= criteria.value;
                break;
            case 'course_complete':
                isMet = coursesCompleted >= criteria.value;
                break;
            case 'learning_time':
                isMet = learningMinutes >= criteria.value;
                break;
            case 'bio_updated':
                isMet = !!user.bio && user.bio.length > 5;
                break;
        }

        if (isMet) {
            await db.insert(userAchievements).values({
                user_id: userId,
                achievement_id: ach.id,
                earned_at: new Date()
            });

            // Log activity
            await db.insert(auditLogs).values({
                user_id: userId,
                user_type: 'student',
                school_id: user.school_id,
                action: 'create',
                entity_type: 'user_achievement',
                entity_id: ach.id,
                new_values: { achievement_name: ach.name }
            } as any);

            newlyUnlocked.push(ach.name);
        }
    }

    if (newlyUnlocked.length > 0) {
        revalidatePath('/student/achievements');
        revalidatePath('/student');
        return { success: true, unlocked: newlyUnlocked };
    }
    return { success: true, unlocked: [] };
}

export async function getStudentAchievementsData() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    // Trigger check/seed on load to ensure sync
    await checkAndAwardAchievements();

    const allAchievements = await db.query.achievements.findMany({
        where: eq(achievements.is_active, true),
        orderBy: [asc(achievements.created_at)]
    });

    const userAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, userId)
    });

    const unlockedMap = new Map(userAchvs.map(ua => [ua.achievement_id, ua.earned_at]));

    const formattedAchievements = allAchievements.map(a => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id)
    }));

    // Fetch basic stats for the progress circle
    const profile = await db.query.students.findFirst({
        where: eq(students.id, userId)
    });

    return {
        achievements: formattedAchievements,
        stats: {
            xp: Number(profile?.cumulative_xp) || 0,
            level: Math.floor((Number(profile?.cumulative_xp) || 0) / 1000) + 1
        }
    };
}
