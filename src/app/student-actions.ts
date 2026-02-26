'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { profiles, courses, lessons, progressTracking, dailyChallenges, userDailyChallenges, achievements, userAchievements } from '@/db/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';

export type DashboardData = {
    profile: any;
    stats: {
        xp: number;
        streak: number;
        level: number;
        lessonsCompleted: number;
        totalTime: number;
        rank: number;
    };
    dailyChallenges: any[];
    achievements: any[];
    courses: any[];
};

export async function getStudentDashboardData(): Promise<DashboardData> {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const userId = session.userId;

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId)
    });

    if (!profile) throw new Error('User not found');

    const studentGrade = profile.grade;
    const stats = {
        xp: profile.total_xp || 0,
        streak: profile.current_streak || 0,
        level: profile.level || 1,
        lessonsCompleted: profile.total_lessons_completed || 0,
        totalTime: Math.round((profile.total_learning_time_minutes || 0) / 60),
        rank: 0
    };

    // Daily Challenges
    const today = new Date().toISOString().split('T')[0];
    const allChallenges = await db.query.dailyChallenges.findMany({
        where: eq(dailyChallenges.is_active, true),
        limit: 3
    });

    let formattedChallenges: any[] = [];
    if (allChallenges.length > 0) {
        const userChallenges = await db.query.userDailyChallenges.findMany({
            where: and(
                eq(userDailyChallenges.user_id, userId),
                eq(userDailyChallenges.challenge_date, today)
            )
        });

        const challengeProgressMap = new Map(
            userChallenges.map(uc => [uc.challenge_id, uc])
        );

        formattedChallenges = allChallenges.map(c => ({
            id: c.id,
            title: c.title,
            challenge_type: c.challenge_type,
            target_value: c.target_value,
            xp_reward: c.xp_reward,
            icon: c.icon,
            current_progress: challengeProgressMap.get(c.id)?.current_progress || 0,
            is_completed: challengeProgressMap.get(c.id)?.is_completed || false
        }));
    }

    // Achievements
    const allAchvs = await db.query.achievements.findMany({
        where: eq(achievements.is_hidden, false),
        limit: 10
    });

    let formattedAchievements: any[] = [];
    if (allAchvs.length > 0) {
        const userAchvs = await db.query.userAchievements.findMany({
            where: eq(userAchievements.user_id, userId)
        });

        const unlockedMap = new Map(
            userAchvs.map(ua => [ua.achievement_id, ua.unlocked_at])
        );

        formattedAchievements = allAchvs.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            category: a.category,
            unlocked: unlockedMap.has(a.id),
            unlocked_at: unlockedMap.get(a.id)
        }));

        formattedAchievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return 0;
        });
    }

    // Class Rank (count of profiles with more xp)
    const usersWithMoreXp = await db.select().from(profiles).where(and(gt(profiles.total_xp, profile.total_xp || 0), eq(profiles.role, 'student')));
    stats.rank = usersWithMoreXp.length + 1;

    // Courses
    const allCourses = await db.query.courses.findMany({
        where: eq(courses.published, true)
    });

    const filteredCourses = allCourses.filter(course => {
        if (course.all_grades === true) return true;
        if (!studentGrade) return true;
        if (course.grade === studentGrade) return true;
        return false;
    });

    const coursesWithProgress = await Promise.all(
        filteredCourses.map(async (course) => {
            const courseLessons = await db.query.lessons.findMany({
                where: eq(lessons.course_id, course.id)
            });
            const totalLessons = courseLessons.length;

            let completedLessons = 0;
            if (totalLessons > 0) {
                const lessonIds = courseLessons.map(l => l.id);
                const userProgress = await db.query.progressTracking.findMany({
                    where: and(
                        eq(progressTracking.user_id, userId),
                        eq(progressTracking.status, 'completed'),
                        inArray(progressTracking.lesson_id, lessonIds)
                    )
                });
                completedLessons = userProgress.length;
            }

            return {
                ...course,
                totalLessons,
                completedLessons
            };
        })
    );

    return {
        profile,
        stats,
        dailyChallenges: formattedChallenges,
        achievements: formattedAchievements,
        courses: coursesWithProgress
    };
}
