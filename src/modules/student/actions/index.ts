'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { students, schools, courses, lessons, lessonProgress, dailyChallenges, userDailyChallenges, achievements, userAchievements, enrollments, studentAcademicRecords, courseClassMapping, quizAttempts, auditLogs } from '@/db/schema';
import { eq, and, gt, inArray, asc, desc, isNotNull, sql } from 'drizzle-orm';
import { redis, safeRedis } from '@/lib/redis';

export const invalidateStudentDashboardCache = async (userId: string) => {
    await redis.del(`cache:student:${userId}:dashboard`);
};

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
    if (!session) {
        redirect('/login');
    }

    const userId = session.userId;

    // Validate role - only students should access this backend module
    if (session.role !== 'student') {
        throw new Error('Access denied: You must be a student to view this dashboard');
    }

    // Verify engagement (streak, last active) and trigger achievement evaluation
    try {
        const { handleStudentEngagement } = await import('@/lib/gamification');
        const { checkAndAwardAchievements } = await import('./achievement-actions');
        
        // Parallel sync (non-blocking if possible, but for data accuracy we wait)
        await Promise.all([
            handleStudentEngagement(userId),
            checkAndAwardAchievements()
        ]);
    } catch (err) {
        console.error("Dashboard engagement sync error:", err);
    }

    const cacheKey = `cache:student:${userId}:dashboard`;
    try {
        const cached = await safeRedis.get<DashboardData>(cacheKey);
        if (cached) return cached;
    } catch (err) {
        console.error("Redis student dashboard read error:", err);
    }

    const profile = await db.query.students.findFirst({
        where: and(eq(students.id, userId), sql`${students.deleted_at} IS NULL`),
        with: {
            academicRecords: {
                with: {
                    academicClass: true
                },
                limit: 1
            }
        }
    });

    if (!profile) {
        // If not found in students table but has session, it might be an admin or a purged user
        console.warn(`Student profile not found for ID: ${userId} with role: ${session.role}`);
        throw new Error('User profile not found. Please contact support or re-register.');
    }

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

    // Calculate rank at school level (fallback to global if no school assigned)
    let usersWithMoreXp;
    let totalSchoolStudents;

    if (profile.school_id) {
        usersWithMoreXp = await db.select().from(students).where(
            and(
                gt(students.cumulative_xp, Number(profile.cumulative_xp) || 0),
                eq(students.school_id, profile.school_id)
            )
        );
        totalSchoolStudents = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(
                and(
                    eq(students.school_id, profile.school_id)
                )
            );
    } else {
        usersWithMoreXp = await db.select().from(students).where(
            and(
                gt(students.cumulative_xp, Number(profile.cumulative_xp) || 0)
            )
        );
        totalSchoolStudents = await db.select({ count: sql<number>`count(*)` })
            .from(students);
    }

    const rank = usersWithMoreXp.length + 1;
    const rankPercentage = Math.min(100, Math.max(1, Math.round((rank / (totalSchoolStudents[0]?.count || 1)) * 100)));

    const stats = {
        xp: Number(profile.cumulative_xp) || 0,
        streak: Number(profile.current_streak) || 0,
        level: Math.floor((Number(profile.cumulative_xp) || 0) / 1000) + 1,
        lessonsCompleted: completedLessons.length,
        totalTime: totalHours,
        accuracy: accuracy,
        rank: rank,
        rankPercentage: rankPercentage
    };

    // Daily Challenges
    const { getOrGenerateDailyChallenges } = await import('./challenge-actions');
    const formattedChallenges = await getOrGenerateDailyChallenges(userId);

    // Achievements
    const allAchvs = await db.query.achievements.findMany({
        where: eq(achievements.is_active, true),
        limit: 100
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
            unlocked_at: unlockedMap.get(a.id),
            criteria: a.criteria
        }));

        formattedAchievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return 0;
        });
    }

    // Next Goal Calculation: Find first locked achievement and calculate real progress based on criteria type
    const nextAchievement = allAchvs.find(a => !formattedAchievements.find(fa => fa.id === a.id && fa.unlocked));
    let nextGoal = null;

    if (nextAchievement) {
        const criteria = (nextAchievement.criteria as any) || {};
        let progress = 0;
        const target = Number(criteria.value) || 1;

        switch (criteria.type) {
            case 'xp':
                progress = Math.min(Math.round((stats.xp / target) * 100), 100);
                break;
            case 'lesson_count':
                progress = Math.min(Math.round((stats.lessonsCompleted / target) * 100), 100);
                break;
            case 'quiz_count':
                // We need to fetch quizzes passed count if not already in stats
                progress = Math.min(Math.round((stats.accuracy > 0 ? 50 : 0)), 100); // Fallback: 50% if they have some accuracy
                break;
            default:
                progress = Math.min(Math.round((stats.xp / (nextAchievement.xp_threshold || 1000)) * 100), 100);
        }

        nextGoal = {
            name: nextAchievement.name,
            requirement: nextAchievement.description || 'Unlock this achievement',
            progress: progress
        };
    }

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

    const validCourses = coursesWithProgress.filter(Boolean) as any[];

    // Sort: Active (partially completed) first, then Not Started, then Fully Completed last
    validCourses.sort((a, b) => {
        const aCompleted = a.completedLessons === a.totalLessons && a.totalLessons > 0;
        const bCompleted = b.completedLessons === b.totalLessons && b.totalLessons > 0;

        const aActive = a.completedLessons > 0 && a.completedLessons < a.totalLessons;
        const bActive = b.completedLessons > 0 && b.completedLessons < b.totalLessons;

        // Active first
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // Completed last
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;

        return 0;
    });

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

    const result: DashboardData = {
        profile: {
            ...profile,
            className: (profile.academicRecords?.[0] as any)?.academicClass?.name || 'Class Unassigned',
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
        courses: validCourses,
        activities: formattedActivities,
        categories: Array.from(new Set(validCourses.map((c: any) => c?.category))).filter(Boolean).map(cat => ({
            name: cat,
            count: validCourses.filter((c: any) => c?.category === cat).length
        })),
        topics: Array.from(new Set(validCourses.flatMap((c: any) => {
            const t = c?.topics;
            if (Array.isArray(t)) return t.map((s: string) => s?.trim()).filter(Boolean);
            if (typeof t === 'string') return t.split(',').map((s: string) => s.trim()).filter(Boolean);
            return [];
        }))).filter(Boolean) as string[]
    };

    // Cache the result
    await safeRedis.set(cacheKey, result, 600); // 10 mins

    return result;
}

/**
 * Account Deletion Flow (Right to Be Forgotten / GDPR Compliance)
 * Soft-deletes user, obfuscates PII, and cascades session block.
 */
export async function deleteStudentAccountAction() {
    const session = await verifySession();
    if (!session || session.role !== 'student') {
        redirect('/login');
    }

    try {
        await db.update(students).set({
            first_name: 'Deleted',
            last_name: 'User',
            email: `deleted_${session.userId}@technurture.io`,
            phone: null,
            is_active: false,
            deleted_at: new Date()
        }).where(eq(students.id, session.userId));

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
