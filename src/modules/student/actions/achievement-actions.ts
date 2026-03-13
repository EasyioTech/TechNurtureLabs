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
import { redirect } from 'next/navigation';
import { eq, and, gt, sql, count, isNotNull, asc, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getProgressCounter, isAchievementCheckNeeded, clearAchievementDirtyBit } from '@/lib/gamification';

/**
 * Idempotent achievement seeding
 */
export async function seedAchievementsData() {
    const defaultAchievements = [
        // Beginner Badges
        {
            name: 'First Steps',
            description: 'Complete your very first lesson to start your journey',
            icon_url: 'award',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'lesson_count', value: 1 }
        },
        {
            name: 'Quiz Starter',
            description: 'Pass any 1 quiz to prove your basic knowledge',
            icon_url: 'target',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'quiz_count', value: 1 }
        },
        {
            name: 'XP Earner',
            description: 'Accumulate a total of 500 XP through lessons and quizzes',
            icon_url: 'zap',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'xp', value: 500 }
        },
        {
            name: 'Profile Pro',
            description: 'Go to your profile and add a bio to introduce yourself',
            icon_url: 'user',
            tier: 'bronze' as const,
            category: 'Beginner',
            criteria: { type: 'bio_updated', value: true }
        },

        // Advanced Badges
        {
            name: 'Perfect Score',
            description: 'Score exactly 100% on any quiz to earn this golden star',
            icon_url: 'star',
            tier: 'gold' as const,
            category: 'Advanced',
            criteria: { type: 'perfect_quiz', value: 1 }
        },
        {
            name: 'Course Master',
            description: 'Finish all lessons in a single complete learning module',
            icon_url: 'award',
            tier: 'gold' as const,
            category: 'Advanced',
            criteria: { type: 'course_complete', value: 1 }
        },
        {
            name: 'Expert Learner',
            description: 'Reach an elite milestone of 5,000 total XP',
            icon_url: 'shield',
            tier: 'platinum' as const,
            category: 'Advanced',
            criteria: { type: 'xp', value: 5000 }
        },
        {
            name: 'Elite Scholar',
            description: 'Successfully pass 10 different quizzes with high scores',
            icon_url: 'trophy',
            tier: 'platinum' as const,
            category: 'Advanced',
            criteria: { type: 'quiz_count', value: 10 }
        },

        // Persistence Badges
        {
            name: 'Consistency King',
            description: 'Maintain a learning streak for 3 consecutive days',
            icon_url: 'flame',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'streak', value: 3 }
        },
        {
            name: 'Weekly Warrior',
            description: 'Keep your momentum alive for 7 straight days',
            icon_url: 'flame',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'streak', value: 7 }
        },
        {
            name: 'Dedicated Student',
            description: 'Complete a total of 20 lessons across any courses',
            icon_url: 'medal',
            tier: 'silver' as const,
            category: 'Persistence',
            criteria: { type: 'lesson_count', value: 20 }
        },
        {
            name: 'Learning Marathon',
            description: 'Spend more than 5 hours (300 mins) actively learning',
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
    if (!session) {
        redirect('/login');
    }
    const userId = session.userId;

    // OPTIMIZATION: Check dirty bit first. If no new XP or progress event, skip heavy DB checks.
    const needed = await isAchievementCheckNeeded(userId);
    
    // Ensure achievements exist in DB even if we don't need to check user progress yet
    await seedAchievementsData();
    
    if (!needed) return { success: true, unlocked: [] };

    if (session.role !== 'student') {
        return { success: false, error: 'Student access only' };
    }

    const user = await db.query.students.findFirst({
        where: and(eq(students.id, userId), isNull(students.deleted_at)),
        columns: {
            id: true,
            school_id: true,
            cumulative_xp: true,
            current_streak: true,
            bio: true
        }
    });
    if (!user) return { success: false, error: 'Student profile not found' };

    const unlockedAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, userId)
    });
    const unlockedSet = new Set(unlockedAchvs.map(ua => ua.achievement_id));

    const allAchvs = await db.query.achievements.findMany({
        where: eq(achievements.is_active, true)
    });

    // OPTIMIZED: Use Redis counters instead of heavy SQL count(*) queries
    const lessonsCompleted = await getProgressCounter(userId, 'lessons');
    const quizzesPassed = await getProgressCounter(userId, 'quizzes');
    const perfectQuizzes = await getProgressCounter(userId, 'perfect_quizzes');

    // These still need DB for now as they are complex/long-term, but they are less frequent
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

    // Clear the dirty bit
    await clearAchievementDirtyBit(userId);

    if (newlyUnlocked.length > 0) {
        revalidatePath('/student/achievements');
        revalidatePath('/student');
        return { success: true, unlocked: newlyUnlocked };
    }
    return { success: true, unlocked: [] };
}

async function getStudentRankMetrics(userId: string, schoolId: string) {
    if (!schoolId) return { rank: 1, rankPercentage: 100 };

    const totalSchoolStudents = await db.select({ count: count() })
        .from(students)
        .where(eq(students.school_id, schoolId));

    const currentUser = await db.query.students.findFirst({
        where: eq(students.id, userId)
    });

    if (!currentUser) return { rank: 1, rankPercentage: 100 };

    const usersWithMoreXp = await db.select({ count: count() })
        .from(students)
        .where(and(
            eq(students.school_id, schoolId),
            gt(students.cumulative_xp, currentUser.cumulative_xp)
        ));

    const rank = usersWithMoreXp[0].count + 1;
    const totalCount = totalSchoolStudents[0].count || 1;
    const rankPercentage = Math.min(100, Math.max(1, Math.round((rank / totalCount) * 100)));

    return { rank, rankPercentage };
}

export async function getStudentAchievementsData() {
    const session = await verifySession();
    if (!session) {
        redirect('/login');
    }
    const userId = session.userId;

    if (session.role !== 'student') {
        throw new Error('Access denied: Student access only');
    }

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
        where: and(eq(students.id, userId), isNull(students.deleted_at)),
        columns: {
            id: true,
            school_id: true,
            cumulative_xp: true
        }
    });

    // Fetch rank metrics
    const rankMetrics = await getStudentRankMetrics(userId, profile?.school_id || '');

    return {
        achievements: formattedAchievements,
        stats: {
            xp: Number(profile?.cumulative_xp) || 0,
            level: Math.floor((Number(profile?.cumulative_xp) || 0) / 1000) + 1,
            rank: rankMetrics.rank,
            rankPercentage: rankMetrics.rankPercentage
        }
    };
}
