'use server';

import { db } from '@/lib/db';
import { students, schoolSubscriptions, lessonProgress, quizAttempts, courseProgress, courses, schoolClassMapping, courseClassMapping, lessons, enrollments } from '@/db/schema';
import { eq, and, sql, count, isNull, isNotNull, gt, avg, sum, inArray, or, asc, desc } from 'drizzle-orm';
import { verifySchoolAdminContext } from './shared';
import { calculateTrueStreak } from '../utils/streak';
import { calculateLevel } from '@/lib/gamification';

import { SchoolStats, SchoolCourseMetric, SchoolLeaderboardEntry } from '../types';

export async function getSchoolCourseAnalytics(schoolId: string): Promise<SchoolCourseMetric[]> {
    await verifySchoolAdminContext(schoolId);

    const stats = await db
        .select({
            course_id: courseProgress.course_id,
            avg_progress: avg(courseProgress.progress_pct),
            avg_xp: avg(courseProgress.total_xp_earned),
            total_time: sum(courseProgress.total_time_secs),
            count: count()
        })
        .from(courseProgress)
        .innerJoin(students, eq(courseProgress.user_id, students.id))
        .where(and(eq(students.school_id, schoolId), isNull(students.deleted_at)))
        .groupBy(courseProgress.course_id);

    if (stats.length === 0) return [];

    const courseIds = stats.map(s => s.course_id);
    const courseDetails = await db.query.courses.findMany({
        where: and(inArray(courses.id, courseIds), isNull(courses.deleted_at)),
        with: {
            classMapping: {
                with: {
                    academicClass: true
                }
            }
        }
    });

    const courseMap = new Map(courseDetails.map(c => [c.id, c]));

    return stats.map(s => {
        const course = courseMap.get(s.course_id);
        if (!course) return null;

        return {
            id: course.id,
            title: course.title,
            thumbnail_url: course.thumbnail_url,
            is_published: course.is_published,
            lesson_count: course.total_lessons,
            enrolled_count: Number(s.count),
            completion_rate: Math.round(Number(s.avg_progress || 0)),
            avg_xp: Math.round(Number(s.avg_xp || 0)),
            total_time_mins: Math.round(Number(s.total_time || 0) / 60),
            mapped_classes: course.classMapping?.map(cm => cm.academicClass?.name).filter(Boolean) || [],
            description: course.description
        };
    }).filter(Boolean) as SchoolCourseMetric[];
}

export async function getSchoolStats(schoolId: string): Promise<SchoolStats> {
    await verifySchoolAdminContext(schoolId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [basicStats, activeCount, lessonsCompleted, quizCount, avgProgress, xpStats, pendingCount, enrolledCount] = await Promise.all([
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true))),
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true), gt(students.last_active_at, sevenDaysAgo))),
        db.select({ count: count() }).from(lessonProgress).innerJoin(students, eq(lessonProgress.user_id, students.id)).where(and(eq(students.school_id, schoolId), isNotNull(lessonProgress.completed_at))),
        db.select({ count: count() }).from(quizAttempts).innerJoin(students, eq(quizAttempts.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ avg_pct: avg(courseProgress.progress_pct) }).from(courseProgress).innerJoin(students, eq(courseProgress.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ avg: avg(students.cumulative_xp), total: sum(students.cumulative_xp) }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true))),
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, false))),
        db.select({ count: count(sql`DISTINCT ${courseProgress.course_id}`) }).from(courseProgress).innerJoin(students, eq(courseProgress.user_id, students.id)).where(eq(students.school_id, schoolId)),
    ]);

    const sub = await db.query.schoolSubscriptions.findFirst({ 
        where: eq(schoolSubscriptions.school_id, schoolId),
        with: { plan: true }
    });

    return {
        totalStudents: Number(basicStats[0]?.count || 0),
        activeStudents: Number(activeCount[0]?.count || 0),
        avgXp: Math.round(Number(xpStats[0]?.avg || 0)),
        totalXp: Number(xpStats[0]?.total || 0),
        totalLessonsCompleted: Number(lessonsCompleted[0]?.count || 0),
        totalQuizzesTaken: Number(quizCount[0]?.count || 0),
        avgCompletionRate: Math.round(Number(avgProgress[0]?.avg_pct || 0)),
        enrolledCourses: Number(enrolledCount[0]?.count || 0),
        pendingStudents: Number(pendingCount[0]?.count || 0),
        planName: sub?.plan?.name || 'Community',
        subscriptionStatus: sub?.status || 'active',
        planExpiry: sub?.current_period_end?.toISOString() || null,
    };
}

export async function getSchoolDashboardOverview(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const [stats, coursesData] = await Promise.all([
        getSchoolStats(schoolId),
        getSchoolCoursesListAction(schoolId)
    ]);
    return { stats, coursesData };
}

export async function getSchoolCoursesListAction(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const classMapping = await db.query.schoolClassMapping.findMany({
        where: eq(schoolClassMapping.school_id, schoolId)
    });
    const schoolClassIds = classMapping.map(gm => gm.class_id);

    let validCourseIds: string[] = [];
    if (schoolClassIds.length > 0) {
        const mappings = await db.query.courseClassMapping.findMany({
            where: inArray(courseClassMapping.class_id, schoolClassIds)
        });
        validCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
    }

    const allValidCourses = await db.query.courses.findMany({
        where: and(
            eq(courses.is_published, true),
            validCourseIds.length > 0
                ? or(eq(courses.all_classes, true), inArray(courses.id, validCourseIds))
                : eq(courses.all_classes, true)
        )
    });

    return allValidCourses.map(c => ({
        ...c,
        thumbnail: c.thumbnail_url,
        published: c.is_published
    }));
}

export async function getSchoolLeaderboard(schoolId: string, limit = 10): Promise<SchoolLeaderboardEntry[]> {
    await verifySchoolAdminContext(schoolId);
    const studentsData = await db.query.students.findMany({
        where: and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true)),
        orderBy: [desc(students.cumulative_xp)],
        limit
    });
    if (studentsData.length === 0) return [];

    const studentIds = studentsData.map(s => s.id);
    const completionCounts = await db
        .select({ user_id: lessonProgress.user_id, count: count() })
        .from(lessonProgress)
        .where(and(
            inArray(lessonProgress.user_id, studentIds),
            isNotNull(lessonProgress.completed_at)
        ))
        .groupBy(lessonProgress.user_id);

    const completionMap = new Map(completionCounts.map(r => [r.user_id, Number(r.count)]));

    return studentsData.map((s, i) => {
        const xp = Number(s.cumulative_xp) || 0;
        const levelData = calculateLevel(xp);
        return {
            rank: i + 1,
            id: s.id,
            full_name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            phone: s.phone,
            total_xp: xp,
            level: levelData.level,
            current_streak: calculateTrueStreak(s),
            lessons_completed: completionMap.get(s.id) ?? 0,
        };
    });
}

export async function fetchSchoolAdminCourseData(schoolId: string, courseId: string) {
    try {
        await verifySchoolAdminContext(schoolId);

        // 1. Fetch the course with its class mappings to verify accessibility
        const course = await db.query.courses.findFirst({
            where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
            with: {
                classMapping: true
            }
        });

        if (!course) return { success: false, error: 'Course not found' };

        // 2. SECURITY GUARD: Verify the school can access this course
        if (!course.all_classes) {
            const schoolClasses = await db.query.schoolClassMapping.findMany({
                where: eq(schoolClassMapping.school_id, schoolId)
            });
            const schoolClassIds = schoolClasses.map(m => m.class_id);
            const courseClassIds = course.classMapping.map(m => m.class_id);
            
            const hasAccess = courseClassIds.some(cid => schoolClassIds.includes(cid));
            if (!hasAccess) {
                return { success: false, error: 'Forbidden: This course is not mapped to your school.' };
            }
        }

        // 3. Fetch lessons
        const lessonsData = await db.query.lessons.findMany({
            where: and(eq(lessons.course_id, courseId), isNull(lessons.deleted_at)),
            orderBy: [asc(lessons.sequence_order)]
        });
        const lessonIds = lessonsData.map(l => l.id);

        // 3a. Fetch students specifically enrolled in this course for this school
        const enrolledStudents = await db.select({
            id: students.id,
            first_name: students.first_name,
            last_name: students.last_name,
            cumulative_xp: students.cumulative_xp,
            last_active_at: students.last_active_at,
            avatar_url: students.avatar_url,
            is_active: students.is_active
        })
        .from(students)
        .innerJoin(enrollments, and(eq(enrollments.user_id, students.id), eq(enrollments.course_id, courseId)))
        .where(and(
            eq(students.school_id, schoolId),
            isNull(students.deleted_at),
            eq(students.is_verified, true)
        ))
        .orderBy(desc(students.cumulative_xp));

        const enrolledIds = enrolledStudents.map(s => s.id);
        
        // 4. Efficiently fetch progress only for enrolled students/lessons
        const progressData = (enrolledIds.length > 0 && lessonIds.length > 0) 
            ? await db.query.lessonProgress.findMany({
                where: and(
                    inArray(lessonProgress.user_id, enrolledIds),
                    inArray(lessonProgress.lesson_id, lessonIds)
                )
            }) 
            : [];

        return {
            success: true,
            course: {
                ...course,
                thumbnail: course.thumbnail_url,
                published: course.is_published
            },
            lessonsData: lessonsData.map(l => ({
                ...l,
                duration: l.duration_minutes || 0,
                xp_reward: 10 
            })),
            studentsData: enrolledStudents.map(s => ({
                ...s,
                id: s.id,
                full_name: `${s.first_name} ${s.last_name}`,
                total_xp: Number(s.cumulative_xp) || 0
            })),
            progressData,
            activeSessions: []
        };
    } catch (err: any) {
        console.error('[FetchCourseData Error]:', err);
        return { success: false, error: err.message || 'Failed to fetch course analytics data' };
    }
}
