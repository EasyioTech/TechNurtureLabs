'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, schools, courses, lessons, lessonProgress, dailyChallenges, userDailyChallenges, achievements, userAchievements, enrollments, studentAcademicRecords, courseClassMapping, quizAttempts, auditLogs } from '@/db/schema';
import { eq, and, gt, inArray, asc, desc, isNotNull, sql } from 'drizzle-orm';

export type DashboardData = {
    profile: any;
    school: any;
    stats: {
        xp: number;
        streak: number;
        level: number;
        lessonsCompleted: number;
        totalTime: number;
        accuracy: number;
        rank: number;
        rankPercentage: number;
    };
    nextGoal: {
        name: string;
        requirement: string;
        progress: number;
    } | null;
    dailyChallenges: any[];
    achievements: any[];
    courses: any[];
    activities: any[];
    categories: any[];
    topics: string[];
};

export async function getStudentDashboardData(): Promise<DashboardData> {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const userId = session.userId;

    const profile = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!profile) throw new Error('User not found');

    const school = profile.school_id ? await db.query.schools.findFirst({
        where: eq(schools.id, profile.school_id)
    }) : null;

    // Count completed lessons for this user
    const completedLessons = await db.select().from(lessonProgress)
        .where(and(eq(lessonProgress.user_id, userId), isNotNull(lessonProgress.completed_at)));

    // Total learning time in hours
    const timeSpentResult = await db.select({
        total_secs: sql<number>`sum(${lessonProgress.time_spent_secs})`
    }).from(lessonProgress).where(eq(lessonProgress.user_id, userId));
    const totalHours = Math.round((Number(timeSpentResult[0]?.total_secs) || 0) / 3600 * 10) / 10;

    // Average Accuracy from quiz attempts
    const quizResult = await db.select({
        avg_pct: sql<number>`avg((${quizAttempts.score} / ${quizAttempts.max_score}) * 100)`
    }).from(quizAttempts).where(eq(quizAttempts.user_id, userId));
    const accuracy = Math.round(Number(quizResult[0]?.avg_pct) || 0);

    const usersWithMoreXp = await db.select().from(users).where(and(gt(users.cumulative_xp, Number(profile.cumulative_xp) || 0), eq(users.role, 'student')));
    const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'student'));
    const rank = usersWithMoreXp.length + 1;
    const rankPercentage = Math.max(1, Math.round((rank / (totalStudents[0]?.count || 1)) * 100));

    const stats = {
        xp: Number(profile.cumulative_xp) || 0,
        streak: profile.current_streak || 0,
        level: Math.floor((Number(profile.cumulative_xp) || 0) / 1000) + 1,
        lessonsCompleted: completedLessons.length,
        totalTime: totalHours,
        accuracy: accuracy,
        rank: rank,
        rankPercentage: rankPercentage
    };

    // Daily Challenges
    const allChallenges = await db.query.dailyChallenges.findMany({
        where: eq(dailyChallenges.status, 'active'),
        limit: 3
    });

    let formattedChallenges: any[] = [];
    const userChallengesData = await db.query.userDailyChallenges.findMany({
        where: eq(userDailyChallenges.user_id, userId)
    });

    const challengeMap = new Map(
        userChallengesData.map(uc => [uc.challenge_id, uc])
    );

    if (allChallenges.length > 0) {
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

    // If less than 3, add virtual/default challenges as requested by user
    if (formattedChallenges.length < 3) {
        const defaults = [
            { id: 'v-xp', title: 'Gain 50 XP', challenge_type: 'xp_gain', target_value: 50, xp_reward: 10, icon: 'zap', current_progress: Math.min(stats.xp % 100, 50), is_completed: (stats.xp % 100) >= 50 },
            { id: 'v-time', title: 'Study for 30m', challenge_type: 'learning_time', target_value: 30, xp_reward: 15, icon: 'clock', current_progress: Math.min(Math.round(stats.totalTime * 60) % 60, 30), is_completed: (stats.totalTime * 60 % 60) >= 30 },
            { id: 'v-quiz', title: 'Complete a Quiz', challenge_type: 'quiz_complete', target_value: 1, xp_reward: 20, icon: 'target', current_progress: stats.accuracy > 0 ? 1 : 0, is_completed: stats.accuracy > 0 }
        ];
        formattedChallenges = [...formattedChallenges, ...defaults].slice(0, 3);
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

    // Next Goal
    const nextAchievement = allAchvs.find(a => !formattedAchievements.find(fa => fa.id === a.id && fa.unlocked));
    const nextGoal = nextAchievement ? {
        name: nextAchievement.name,
        requirement: nextAchievement.description || 'Unlock this achievement',
        progress: Math.min(Math.round((stats.xp / (nextAchievement.xp_threshold || 1000)) * 100), 100)
    } : null;

    // Rank already calculated above

    // 1. Get student's current class
    const currentRecord = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, userId),
        orderBy: [desc(studentAcademicRecords.created_at)]
    });

    const classId = currentRecord?.class_id;

    // 2. Fetch courses via enrollments
    const userEnrollments = await db.query.enrollments.findMany({
        where: and(eq(enrollments.user_id, userId), eq(enrollments.is_active, true)),
        with: { course: true }
    });

    // 3. Fetch courses where all_classes is true
    const globalCourses = await db.query.courses.findMany({
        where: and(eq(courses.all_classes, true), eq(courses.is_published, true))
    });

    // 4. Fetch courses mapped to the student's class (for auto-show)
    let classMappedCourses: any[] = [];
    if (classId) {
        const mappings = await db.query.courseClassMapping.findMany({
            where: eq(courseClassMapping.class_id, classId),
            with: { course: true }
        });
        classMappedCourses = mappings.map(m => m.course).filter(c => c && c.is_published === true);
    }

    // Combine and deduplicate
    const courseMap = new Map<string, any>();

    // Priority 1: Enrolled courses
    userEnrollments.forEach(e => {
        if (e.course && e.course.is_published) {
            courseMap.set(e.course.id, { ...e.course, isEnrolled: true });
        }
    });

    // Priority 2: Global courses
    globalCourses.forEach(c => {
        if (!courseMap.has(c.id)) {
            courseMap.set(c.id, { ...c, isEnrolled: false });
        }
    });

    // Priority 3: Class mapped courses
    classMappedCourses.forEach(c => {
        if (c && !courseMap.has(c.id)) {
            courseMap.set(c.id, { ...c, isEnrolled: false });
        }
    });

    const allRelevantCourses = Array.from(courseMap.values());

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

    // Fetch recent activity
    const recentActivities = await db.query.auditLogs.findMany({
        where: eq(auditLogs.user_id, userId),
        orderBy: [desc(auditLogs.created_at)],
        limit: 5
    });

    const formattedActivities = recentActivities.map(log => {
        let title = "System update";
        let type: string = log.action;

        if (log.action === 'login') {
            title = "Logged into platform";
            type = 'login';
        } else if (log.action === 'update' && log.entity_type === 'lesson_progress') {
            title = "Progressed in a lesson";
            type = 'lesson_complete';
        } else if (log.action === 'create' && log.entity_type === 'lesson_progress') {
            title = "Completed a new lesson";
            type = 'lesson_complete';
        } else if (log.action === 'create' && log.entity_type === 'user_achievement') {
            title = "Unlocked new achievement";
            type = 'challenge_complete';
        } else if (log.action === 'create' && log.entity_type === 'enrollment') {
            title = "Started new course";
            type = 'enroll';
        } else if (log.action === 'create' && log.entity_type === 'quiz_attempt') {
            title = "Attempted a quiz";
            type = 'challenge_complete';
        }

        return {
            id: log.id,
            title,
            time: log.created_at,
            type: type as any
        };
    });

    return {
        profile: {
            ...profile,
            full_name: `${profile.first_name} ${profile.last_name}`,
            total_xp: Number(profile.cumulative_xp) || 0,
            level: stats.level,
        },
        school: school ? {
            name: school.name,
            logo_url: school.logo_url
        } : null,
        stats,
        nextGoal,
        dailyChallenges: formattedChallenges,
        achievements: formattedAchievements,
        courses: coursesWithProgress.filter(Boolean) as any[],
        activities: formattedActivities,
        categories: Array.from(new Set(coursesWithProgress.filter(Boolean).map(c => c?.category))).filter(Boolean).map(cat => ({
            name: cat,
            count: coursesWithProgress.filter(Boolean).filter(c => c?.category === cat).length
        })),
        topics: Array.from(new Set(coursesWithProgress.filter(Boolean).flatMap(c => c?.topics?.split(',').map((t: string) => t.trim())))).filter(Boolean) as string[]
    };
}

/**
 * Account Deletion Flow (Right to Be Forgotten / GDPR Compliance)
 * Soft-deletes user, obfuscates PII, and cascades session block.
 */
export async function deleteStudentAccountAction() {
    const session = await verifySession();
    if (!session || session.role !== 'student') {
        throw new Error('Unauthorized account termination request.');
    }

    try {
        await db.update(users).set({
            first_name: 'Deleted',
            last_name: 'User',
            email: `deleted_${session.userId}@technurture.io`,
            phone: null,
            is_active: false,
            deleted_at: new Date()
        }).where(eq(users.id, session.userId));

        await db.insert(auditLogs).values({
            user_id: session.userId,
            action: 'delete',
            entity_type: 'user',
            entity_id: session.userId,
            old_values: { reason: "Self-deletion requested. PII scrubbed." }
        } as any);

        const { destroySession } = await import('@/lib/auth');
        await destroySession();
        return { success: true };
    } catch (e) {
        throw new Error("Unable to obfuscate and terminate user record safely.");
    }
}
