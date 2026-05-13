'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { redirect } from 'next/navigation';
import { analyticsService } from '@/lib/services/analytics-service';
import {
    students, schoolAdmins, superAdmins, courses, lessons,
    lessonProgress, enrollments, quizAttempts, academicSessions,
    studentAcademicRecords, courseClassMapping, schools, auditLogs,
    schoolSubscriptions, schoolClassMapping
} from '@/db/schema';
import { eq, and, inArray, asc, desc, isNotNull, isNull, sql, count } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { cacheService } from '@/lib/cache';

/**
 * SCALE BREAKER C: Invalidate student dashboard cache using tagging strategy
 */
export const invalidateStudentDashboardCache = async (userId: string) => {
    try {
        await cacheService.invalidateUser(userId);
    } catch (_) { /* non-critical */ }
};

/**
 * Auto-enroll a student in a course if not already enrolled.
 * SECURITY: userId is always from session, never caller-supplied
 */
export async function ensureEnrollment(courseId: string) {
    const session = await verifySession();
    if (!session) return null;

    const userId = session.userId;

    const existingEnrollment = await db.query.enrollments.findFirst({
        where: and(
            eq(enrollments.user_id, userId),
            eq(enrollments.course_id, courseId),
            isNull(enrollments.deleted_at)
        )
    });

    if (existingEnrollment) return existingEnrollment;

    let user: any = null;
    const role = session.userType;
    if (role === 'student') {
        user = await db.query.students.findFirst({ where: eq(students.id, userId), columns: { school_id: true } });
    } else if (role === 'school_admin') {
        user = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, userId), columns: { school_id: true } });
    } else {
        user = await db.query.superAdmins.findFirst({ where: eq(superAdmins.id, userId) });
    }

    if (!user?.school_id) return null;

    // SECURITY: For students, verify school has an ACTIVE subscription
    // Students cannot access courses if school's subscription is not active
    if (role === 'student') {
        const subscription = await db.query.schoolSubscriptions.findFirst({
            where: and(
                eq(schoolSubscriptions.school_id, user.school_id),
                eq(schoolSubscriptions.status, 'active') // Only 'active' subscriptions allow access
            ),
            columns: { id: true }
        });
        // Deny access if no active subscription
        if (!subscription) {
            console.warn(`[Course Access] Student ${userId} denied - no active subscription for school ${user.school_id}`);
            return null;
        }
    }

    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, user.school_id), eq(academicSessions.is_current, true))
    });

    if (!currentSession) return null;

    if (role === 'student') {
        // Only require the course to be published.
        // Class-course mapping controls which courses appear in a student's list (filtering),
        // but does NOT block access — any student from the school can enroll in any published course.
        const course = await db.query.courses.findFirst({
            where: and(eq(courses.id, courseId), eq(courses.is_published, true))
        });
        if (!course) return null;
    }

    // UPSERT enrollment to handle concurrency and re-enrollment atomically
    // NOTE: Constraint is partial index (WHERE deleted_at IS NULL), so use raw SQL
    const result = await db.execute(sql`
        INSERT INTO enrollments (id, user_id, course_id, school_id, session_id, updated_at)
        VALUES (
            gen_random_uuid(),
            ${userId}::uuid,
            ${courseId}::uuid,
            ${user.school_id}::uuid,
            ${currentSession.id}::uuid,
            NOW()
        )
        ON CONFLICT (user_id, course_id, session_id)
        WHERE deleted_at IS NULL
        DO UPDATE SET
            deleted_at = NULL,
            updated_at = NOW()
        RETURNING *
    `);

    // Extract enrollment from result
    const enrollmentArray = Array.isArray(result) ? result : [result];
    const newEnrollment = enrollmentArray[0] || {
        user_id: userId,
        course_id: courseId,
        school_id: user.school_id,
        session_id: currentSession.id
    };

    if (role === 'student') {
        await invalidateStudentDashboardCache(userId);
    }

    analyticsService.incrementMetric('total_enrollments').catch(() => {});

    return newEnrollment;
}

/**
 * Fetch course details with lessons and progress
 */
export async function getCourseDetailsData(courseId: string, bypassCache = false) {
    const session = await verifySession();
    if (!session) throw new Error("Unauthorized");
    const userId = session.userId;
    const role = session.userType;

    const course = await db.query.courses.findFirst({
        where: and(
            eq(courses.id, courseId),
            isNull(courses.deleted_at)
        )
    });

    if (!course) throw new Error("Course not found");

    const cacheKey = `cache:student:${userId}:course:${courseId}`;
    if (!bypassCache) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                // Check if the cached structure version matches the current course version
                if (data.v === (course.updated_at?.getTime() || 0)) {
                    return data.result;
                }
            }
        } catch (err) {
            console.error("Redis cache read error (course details):", err);
        }
    }

    if (role !== 'super_admin' && !course.is_published) {
        throw new Error('Course not found');
    }

    // SECURITY: Students can only access courses from their own school
    if (role === 'student') {
        const studentRecord = await db.query.students.findFirst({
            where: eq(students.id, userId),
            columns: { school_id: true }
        });

        if (!studentRecord) {
            throw new Error('Course not found');
        }

        // Verify course is mapped to this student's school
        const schoolClassMappings = await db.query.schoolClassMapping.findMany({
            where: eq(schoolClassMapping.school_id, studentRecord.school_id),
            columns: { class_id: true }
        });

        const classIds = schoolClassMappings.map(m => m.class_id);

        // Check if course is mapped to any of the student's school's classes
        let hasAccess = false;
        if (classIds.length > 0) {
            const mapping = await db.query.courseClassMapping.findFirst({
                where: and(
                    eq(courseClassMapping.course_id, courseId),
                    inArray(courseClassMapping.class_id, classIds)
                )
            });
            hasAccess = !!mapping;
        }

        // Also check if course is for all classes
        if (!hasAccess && !course.all_classes) {
            throw new Error('Course not found');
        }
    }

    // Class-course mapping is used for filtering/display only — not as an access gate.

    const courseLessons = await db.query.lessons.findMany({
        where: and(
            eq(lessons.course_id, courseId),
            isNull(lessons.deleted_at)
        ),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    const enrolledCountResult = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.course_id, courseId));
    const enrolledCount = Number(enrolledCountResult[0]?.count || 0);

    let formattedLessons = courseLessons.map((l, i) => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
        xp_reward: l.xp_reward || 10,
        status: (i === 0 ? 'available' : 'locked') as 'locked' | 'available' | 'completed'
    }));

    if (courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id);
        const progressData = await db.select().from(lessonProgress).where(
            and(
                eq(lessonProgress.user_id, userId),
                inArray(lessonProgress.lesson_id, lessonIds)
            )
        );

        const progressMap = new Map();
        progressData.forEach(p => {
            const isDone = p.completed_at || p.content_watched || p.progress_pct === '100' || p.completion_locked;
            const current = progressMap.get(p.lesson_id);
            if (!current || (isDone && current !== 'completed')) {
                progressMap.set(p.lesson_id, isDone ? 'completed' : 'in_progress');
            }
        });

        let foundIncomplete = false;
        const isAdmin = role === 'super_admin' || role === 'school_admin';

        formattedLessons = courseLessons.map((l, i) => {
            const status = progressMap.get(l.id);
            let lessonStatus: 'locked' | 'available' | 'completed' = 'locked';

            if (status === 'completed') {
                lessonStatus = 'completed';
            } else if (!foundIncomplete || isAdmin) {
                // If admin, everything is available even if locked for ordinary students
                lessonStatus = 'available';
                foundIncomplete = true;
            }

            return {
                ...l,
                sequence_index: l.sequence_order,
                duration: l.duration_minutes || 10,
                xp_reward: l.xp_reward || 10,
                status: lessonStatus
            };
        });
    }

    const result = {
        course: {
            ...course,
            thumbnail: course.thumbnail_url,
            published: course.is_published,
        },
        lessons: formattedLessons,
        enrolledCount
    };

    try {
        await cacheService.set(cacheKey, {
            v: course.updated_at?.getTime() || 0,
            result: result
        }, [`user:${userId}`, `course:${courseId}`], 600);
    } catch (err) {
        console.error("Cache write error (course details):", err);
    }

    return result;
}

/**
 * Fetch courses for student dashboard with progress summary
 * SCALE BREAKER C: Tag-based caching for dashboard summary
 */
export async function getStudentDashboardCourses(bypassCache = false) {
    const session = await verifySession();
    // Return fallback instead of redirect — redirect() throws errors that bypass Promise.all().catch()
    // Dashboard page checks coursesData and handles redirect properly
    if (!session || session.role !== 'student') return { courses: [] };
    const userId = session.userId;

    const cacheKey = `cache:student:${userId}:dashboard`;
    if (!bypassCache) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (_) {}
    }

    const currentSession = await db.query.academicSessions.findFirst({
        where: and(
            eq(academicSessions.school_id, sql`${db.select({ school_id: students.school_id }).from(students).where(eq(students.id, userId)).limit(1)}`),
            eq(academicSessions.is_current, true)
        )
    });

    const currentRecord = await db.query.studentAcademicRecords.findFirst({
        where: and(
            eq(studentAcademicRecords.user_id, userId),
            currentSession ? eq(studentAcademicRecords.session_id, currentSession.id) : isNotNull(studentAcademicRecords.id)
        ),
        orderBy: [desc(studentAcademicRecords.created_at)]
    });
    const classId = currentRecord?.class_id;
    const sessionId = currentSession?.id;

    // ... (rest of logic)

    const [enrolled, global, classMapped] = await Promise.all([
        db.query.enrollments.findMany({
            where: and(
                eq(enrollments.user_id, userId),
                isNull(enrollments.deleted_at),
                sessionId ? eq(enrollments.session_id, sessionId) : isNotNull(enrollments.id)
            ),
            with: { course: true }
        }),
        db.query.courses.findMany({
            where: and(
                eq(courses.all_classes, true),
                eq(courses.is_published, true),
                isNull(courses.deleted_at)
            )
        }),
        classId ? db.query.courseClassMapping.findMany({
            where: and(
                eq(courseClassMapping.class_id, classId),
                isNull(courseClassMapping.deleted_at)
            ),
            with: { course: true }
        }) : Promise.resolve([])
    ]);

    const courseMap = new Map<string, any>();
    enrolled.forEach(e => e.course?.is_published && !e.course?.deleted_at && courseMap.set(e.course.id, { ...e.course, isEnrolled: true }));
    global.forEach(c => !c.deleted_at && !courseMap.has(c.id) && courseMap.set(c.id, { ...c, isEnrolled: false }));
    (classMapped as any[]).forEach(m => m.course?.is_published && !m.course?.deleted_at && !courseMap.has(m.course.id) && courseMap.set(m.course.id, { ...m.course, isEnrolled: false }));

    const allCourses = Array.from(courseMap.values());
    const courseIds = allCourses.map(c => c.id);

    const [allLessons, userProgress] = await Promise.all([
        courseIds.length > 0 ? db.query.lessons.findMany({ where: inArray(lessons.course_id, courseIds) }) : Promise.resolve([]),
        courseIds.length > 0 ? db.select().from(lessonProgress).where(
            and(
                eq(lessonProgress.user_id, userId), 
                isNotNull(lessonProgress.completed_at),
                sessionId ? eq(lessonProgress.session_id, sessionId) : isNotNull(lessonProgress.id)
            )
        ) : Promise.resolve([])
    ]);

    const progressSet = new Set(userProgress.map(p => p.lesson_id));
    const coursesWithProgress = allCourses.map(course => {
        const cLessons = allLessons.filter(l => l.course_id === course.id);
        const completed = cLessons.filter(l => progressSet.has(l.id)).length;
        return {
            ...course,
            thumbnail: course.thumbnail_url,
            totalLessons: cLessons.length,
            completedLessons: completed
        };
    });

    coursesWithProgress.sort((a, b) => {
        const aActive = a.completedLessons > 0 && a.completedLessons < a.totalLessons;
        const bActive = b.completedLessons > 0 && b.completedLessons < b.totalLessons;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return (a.completedLessons === a.totalLessons) ? 1 : -1;
    });

    const result = {
        courses: coursesWithProgress,
        categories: Array.from(new Set(coursesWithProgress.map(c => c.category))).filter(Boolean).map(cat => ({
            name: cat,
            count: coursesWithProgress.filter(c => c.category === cat).length
        })),
        topics: Array.from(new Set(coursesWithProgress.flatMap(c => {
            const t = c.topics;
            if (Array.isArray(t)) return t;
            if (typeof t === 'string') return t.split(',').map(s => s.trim());
            return [];
        }))).filter(Boolean) as string[]
    };

    // Cache the result for 1 hour, tagged by user
    await cacheService.set(cacheKey, result, [`user:${userId}`], 3600);

    return result;
}

/**
 * Invalidate all student dashboard caches (called after backup restore)
 * Only super admin can trigger this
 */
export async function invalidateAllStudentDashboardCaches() {
    const session = await requireSuperAdmin();

    try {
        const allStudents = await db.query.students.findMany({
            columns: { id: true }
        });

        // PERFORMANCE: Batch Redis deletions using pipeline to avoid O(n) round-trips
        if (allStudents.length > 0) {
            const pipeline = redis.pipeline();
            for (const student of allStudents) {
                const cacheKey = `cache:student:${student.id}:dashboard`;
                pipeline.del(cacheKey);
            }
            await pipeline.exec();
        }

        console.log(`[Cache Invalidation] Invalidated ${allStudents.length} student dashboard caches`);
        return { success: true, invalidatedCount: allStudents.length };
    } catch (error: any) {
        console.error('[Cache Invalidation] Error:', error);
        return { success: false, error: error.message };
    }
}

