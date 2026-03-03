'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, courses, lessons, lessonProgress, dailyChallenges, userDailyChallenges, achievements, userAchievements, enrollments, studentAcademicRecords, courseGradeMapping } from '@/db/schema';
import { eq, and, gt, inArray, asc, desc, isNotNull } from 'drizzle-orm';

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

    const profile = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!profile) throw new Error('User not found');

    // Count completed lessons for this user
    const completedLessons = await db.select().from(lessonProgress)
        .where(and(eq(lessonProgress.user_id, userId), isNotNull(lessonProgress.completed_at)));

    const stats = {
        xp: Number(profile.cumulative_xp) || 0,
        streak: profile.current_streak || 0,
        level: Math.floor((Number(profile.cumulative_xp) || 0) / 500) + 1,
        lessonsCompleted: completedLessons.length,
        totalTime: 0,
        rank: 0
    };

    // Daily Challenges
    const today = new Date().toISOString().split('T')[0];
    const allChallenges = await db.query.dailyChallenges.findMany({
        where: eq(dailyChallenges.status, 'active'),
        limit: 3
    });

    let formattedChallenges: any[] = [];
    if (allChallenges.length > 0) {
        const userChallengesData = await db.query.userDailyChallenges.findMany({
            where: eq(userDailyChallenges.user_id, userId)
        });

        const challengeMap = new Map(
            userChallengesData.map(uc => [uc.challenge_id, uc])
        );

        formattedChallenges = allChallenges.map(c => {
            const uc = challengeMap.get(c.id);
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
    }

    // Achievements
    const allAchvs = await db.query.achievements.findMany({
        where: eq(achievements.is_active, true),
        limit: 10
    });

    let formattedAchievements: any[] = [];
    if (allAchvs.length > 0) {
        const userAchvs = await db.query.userAchievements.findMany({
            where: eq(userAchievements.user_id, userId)
        });

        const unlockedMap = new Map(
            userAchvs.map(ua => [ua.achievement_id, ua.earned_at])
        );

        formattedAchievements = allAchvs.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon_url || '',
            category: a.tier,
            unlocked: unlockedMap.has(a.id),
            unlocked_at: unlockedMap.get(a.id)
        }));

        formattedAchievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return 0;
        });
    }

    // Class Rank (count of users with more xp)
    const usersWithMoreXp = await db.select().from(users).where(and(gt(users.cumulative_xp, Number(profile.cumulative_xp) || 0), eq(users.role, 'student')));
    stats.rank = usersWithMoreXp.length + 1;

    // 1. Get student's current grade
    const currentRecord = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, userId),
        orderBy: [desc(studentAcademicRecords.created_at)]
    });

    const gradeId = currentRecord?.grade_id;

    // 2. Fetch courses via enrollments
    const userEnrollments = await db.query.enrollments.findMany({
        where: and(eq(enrollments.user_id, userId), eq(enrollments.is_active, true)),
        with: { course: true }
    });

    // 3. Fetch courses mapped to the student's grade (for auto-show)
    let gradeMappedCourses: any[] = [];
    if (gradeId) {
        const mappings = await db.query.courseGradeMapping.findMany({
            where: eq(courseGradeMapping.grade_id, gradeId),
            with: { course: true }
        });
        gradeMappedCourses = mappings.map(m => m.course).filter(Boolean);
    }

    // Combine and deduplicate
    const enrollmentCourseIds = new Set(userEnrollments.map(e => e.course_id));
    const allRelevantCourses = [...userEnrollments.map(e => ({ ...e.course, isEnrolled: true }))];

    gradeMappedCourses.forEach(c => {
        if (!enrollmentCourseIds.has(c.id)) {
            allRelevantCourses.push({ ...c, isEnrolled: false });
        }
    });

    const coursesWithProgress = await Promise.all(
        allRelevantCourses.map(async (course) => {
            if (!course) return null;

            const courseLessons = await db.query.lessons.findMany({
                where: eq(lessons.course_id, course.id)
            });
            const totalLessons = courseLessons.length;

            let completedCount = 0;
            if (totalLessons > 0) {
                const lessonIds = courseLessons.map(l => l.id);
                const userProgress = await db.select().from(lessonProgress).where(
                    and(
                        eq(lessonProgress.user_id, userId),
                        inArray(lessonProgress.lesson_id, lessonIds),
                        isNotNull(lessonProgress.completed_at)
                    )
                );
                completedCount = userProgress.length;
            }

            return {
                ...course,
                // Backward-compatible aliases
                thumbnail: course.thumbnail_url,
                published: course.is_published,
                totalLessons,
                completedLessons: completedCount
            };
        })
    );

    return {
        profile: {
            ...profile,
            // Backward-compatible aliases
            full_name: `${profile.first_name} ${profile.last_name}`,
            total_xp: Number(profile.cumulative_xp),
            level: stats.level,
        },
        stats,
        dailyChallenges: formattedChallenges,
        achievements: formattedAchievements,
        courses: coursesWithProgress.filter(Boolean)
    };
}
