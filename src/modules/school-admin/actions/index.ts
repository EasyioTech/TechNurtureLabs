'use server';

import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students, courses, classes, schoolClassMapping, courseClassMapping, lessons, lessonProgress, schools, enrollments, studentAcademicRecords, academicSessions, schoolSubscriptions, paymentPlans, courseProgress, quizAttempts, auditLogs, userSessions, invoices } from '@/db/schema';
import { eq, asc, desc, inArray, and, sql, or, count, isNull, isNotNull, gt, avg, sum } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';
import { z } from 'zod';

/**
 * MIddleware Guard: Throws if the current session does not have access to targetSchoolId
 */
async function verifySchoolAdminContext(targetSchoolId: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    if (session.userType === 'super_admin') return;

    // School Admins can only view/edit their own school
    const currentUser = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, session.userId) });
    if (!currentUser || currentUser.school_id !== targetSchoolId) {
        throw new Error('Forbidden: Privilege Escalation Attempt Detected.');
    }
}

/**
 * Middleware Guard: Throws if current session doesn't belong to the same school as targetUserId
 */
async function verifyStudentContext(targetUserId: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    if (session.userType === 'super_admin') return;

    const currentUser = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, session.userId) });
    if (!currentUser) throw new Error('Unauthorized');

    const targetStudent = await db.query.students.findFirst({ where: eq(students.id, targetUserId) });

    if (!targetStudent || currentUser.school_id !== targetStudent.school_id) {
        throw new Error('Forbidden: Privatized Learner Record.');
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// STREAK HELPER
// ─────────────────────────────────────────────────────────────────────────────
function calculateTrueStreak(user: any): number {
    let activeStreak = user.current_streak || 0;
    if (user.last_active_at && activeStreak > 0) {
        const lastDate = new Date(user.last_active_at);
        lastDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) activeStreak = 0;
    }
    return activeStreak;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export async function getSchoolProfile(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const school = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });
    if (!school) return null;
    return {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        city: school.city,
        state: school.state,
        country: school.country,
        pincode: school.pincode,
        logo_url: school.logo_url,
        website: school.website,
        is_active: school.is_active,
        slug: school.slug,
    };
}

const updateSchoolSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional(),
    pincode: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable().or(z.literal('')),
    website: z.string().url().optional().nullable().or(z.literal('')),
    data_processing_consent: z.boolean().optional(),
    minor_data_guardian_consent: z.boolean().optional(),
    // Strictly whitelisted fields: fields like is_active or role are dropped.
});

export async function updateSchoolProfile(schoolId: string, data: any) {
    await verifySchoolAdminContext(schoolId);

    const parseResult = updateSchoolSchema.safeParse(data);
    if (!parseResult.success) {
        throw new Error('Validation failed: Invalid input fields.');
    }

    await db.update(schools).set({
        ...parseResult.data,
        updated_at: new Date(),
    } as any).where(eq(schools.id, schoolId));

    await invalidateSchoolCache(schoolId);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_DASHBOARD_CACHE_TTL = 300; // 5 mins

export async function invalidateSchoolCache(schoolId: string) {
    await redis.del(`cache:school:${schoolId}:dashboard`);
    await redis.del(`cache:school:${schoolId}:stats`);
}

// getSchoolAdminDashboardData is now deprecated in favor of granular actions
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

    // 1. Get school classes
    const classMapping = await db.query.schoolClassMapping.findMany({
        where: eq(schoolClassMapping.school_id, schoolId),
        with: { academicClass: true } as any
    });
    const schoolClassIds = classMapping.map((gm: any) => gm.class_id);

    // 2. Get applicable courses
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

export async function getSchoolStudentsPaginated(schoolId: string, page: number = 1, limit: number = 10, search: string = '') {
    await verifySchoolAdminContext(schoolId);
    const offset = (page - 1) * limit;

    const whereClause = and(
        eq(students.school_id, schoolId),
        isNull(students.deleted_at),
        search ? or(
            sql`${students.first_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.last_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.email} ILIKE ${'%' + search + '%'}`
        ) : undefined
    );

    const [studentsData, totalCount] = await Promise.all([
        db.query.students.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: [desc(students.cumulative_xp)],
            with: {
                academicRecords: {
                    with: { academicClass: true },
                    limit: 1
                }
            }
        }),
        db.select({ count: count() }).from(students).where(whereClause)
    ]);

    return {
        students: studentsData.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp) || 0,
            level: Math.floor((Number(s.cumulative_xp) || 0) / 1000) + 1,
            class_name: (s.academicRecords?.[0] as any)?.academicClass?.name || 'N/A'
        })),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL STATS (aggregated)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStats(schoolId: string) {
    await verifySchoolAdminContext(schoolId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Optimized SQL aggregations
    const [basicStats, activeCount, lessonsCompleted, quizCount, avgProgress, xpStats] = await Promise.all([
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at))),
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), gt(students.last_active_at, sevenDaysAgo))),
        db.select({ count: count() }).from(lessonProgress).innerJoin(students, eq(lessonProgress.user_id, students.id)).where(and(eq(students.school_id, schoolId), isNotNull(lessonProgress.completed_at))),
        db.select({ count: count() }).from(quizAttempts).innerJoin(students, eq(quizAttempts.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ avg_pct: avg(courseProgress.progress_pct) }).from(courseProgress).innerJoin(students, eq(courseProgress.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ total: sum(students.cumulative_xp), avg: avg(students.cumulative_xp) }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at)))
    ]);

    // Subscription info
    const sub = await db.query.schoolSubscriptions.findFirst({ 
        where: eq(schoolSubscriptions.school_id, schoolId),
        with: { plan: true } as any
    });

    return {
        totalStudents: Number(basicStats[0]?.count || 0),
        activeStudents: Number(activeCount[0]?.count || 0),
        avgXp: Math.round(Number(xpStats[0]?.avg || 0)),
        totalXp: Number(xpStats[0]?.total || 0),
        enrolledCourses: 0, // Calculated in UI or separately if needed
        totalLessonsCompleted: Number(lessonsCompleted[0]?.count || 0),
        totalQuizzesTaken: Number(quizCount[0]?.count || 0),
        avgCompletionRate: Math.round(Number(avgProgress[0]?.avg_pct || 0)),
        planName: (sub as any)?.plan?.name || 'Community',
        subscriptionStatus: sub?.status || 'active',
        planExpiry: sub?.current_period_end?.toISOString() || null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS (paginated + searchable)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStudents(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const studentsData = await db.query.students.findMany({
        where: and(eq(students.school_id, schoolId), isNull(students.deleted_at)),
        orderBy: [desc(students.cumulative_xp)],
    });
    const studentIds = studentsData.map(s => s.id);

    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];

    const classRecords = studentIds.length > 0
        ? await db.query.studentAcademicRecords.findMany({
            where: and(inArray(studentAcademicRecords.user_id, studentIds), eq(studentAcademicRecords.school_id, schoolId)),
            with: { academicClass: true } as any
        })
        : [];

    const classMap = new Map<string, string>();
    classRecords.forEach((r: any) => classMap.set(r.user_id, r.academicClass?.name || ''));

    return studentsData.map(s => ({
        id: s.id,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        total_xp: Number(s.cumulative_xp),
        level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
        current_streak: calculateTrueStreak(s),
        longest_streak: s.longest_streak || 0,
        lessons_completed: progressData.filter(p => p.user_id === s.id && p.completed_at != null).length,
        is_active: s.is_active,
        last_active_at: s.last_active_at?.toISOString() || null,
        class_name: classMap.get(s.id) || '',
    }));
}

export async function getSchoolStudentDetails(userId: string) {
    await verifyStudentContext(userId);
    const student = await db.query.students.findFirst({
        where: and(eq(students.id, userId), isNull(students.deleted_at))
    });
    if (!student) return null;

    const progressData = await db.select().from(lessonProgress).where(eq(lessonProgress.user_id, userId));
    const lessonsDone = progressData.filter(p => p.completed_at != null).length;

    const courseProgressData = await db.select().from(courseProgress).where(eq(courseProgress.user_id, userId));
    const courseIds = courseProgressData.map(cp => cp.course_id);

    const enrolledCourses = courseIds.length > 0
        ? await db.query.courses.findMany({ where: inArray(courses.id, courseIds) })
        : [];

    const attempts = await db.query.quizAttempts.findMany({ 
        where: eq(quizAttempts.user_id, userId),
        orderBy: [desc(quizAttempts.completed_at)]
    });
    
    const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((a, at) => {
            const score = Number(at.score) || 0;
            const max = Number(at.max_score) || 100;
            return a + (score / max * 100);
        }, 0) / attempts.length)
        : 0;

    const classMappingDetails = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, userId),
        orderBy: [desc(studentAcademicRecords.created_at)],
        with: { academicClass: true } as any
    });

    // Rank calculation within their school
    const rankResult = await db.select({
        count: count()
    })
    .from(students)
    .where(and(
        eq(students.school_id, student.school_id),
        gt(students.cumulative_xp, student.cumulative_xp),
        isNull(students.deleted_at)
    ));
    const rank = Number(rankResult[0].count) + 1;

    return {
        student: {
            ...student,
            full_name: `${student.first_name} ${student.last_name}`,
            total_xp: Number(student.cumulative_xp),
            level: Math.floor(Number(student.cumulative_xp) / 1000) + 1,
            class_name: (classMappingDetails as any)?.academicClass?.name || 'N/A',
            lessons_completed: lessonsDone,
            rank
        },
        courses: courseProgressData.map(cp => {
            const c = enrolledCourses.find(cur => cur.id === cp.course_id);
            return {
                ...cp,
                title: c?.title || 'Unknown',
                thumbnail_url: c?.thumbnail_url || null,
                progress_pct: Number(cp.progress_pct)
            };
        }),
        quizCount: attempts.length,
        avgScore,
        recentAttempts: attempts.slice(0, 5).map(at => ({
            ...at,
            score_pct: Math.round((Number(at.score) / (Number(at.max_score) || 100)) * 100)
        }))
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE ANALYTICS (school-scoped)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolCourseAnalytics(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    // Only published courses
    const schoolEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.school_id, schoolId),
        with: { course: true }
    });

    const activeEnrollments = schoolEnrollments.filter(e => e.course?.is_published);

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

    const courseMap = new Map<string, any>();

    allValidCourses.forEach(c => {
        courseMap.set(c.id, { course: c, enrolledUserIds: new Set() });
    });

    activeEnrollments.forEach(e => {
        if (!e.course) return;
        if (!courseMap.has(e.course.id)) courseMap.set(e.course.id, { course: e.course, enrolledUserIds: new Set() });
        courseMap.get(e.course.id).enrolledUserIds.add(e.user_id);
    });

    const courseIds = Array.from(courseMap.keys());
    if (courseIds.length === 0) return [];

    const lessonsData = await db.query.lessons.findMany({ where: inArray(lessons.course_id, courseIds) });
    const cpData = await db.select().from(courseProgress).where(inArray(courseProgress.course_id, courseIds));

    // Get actual mapped class data for tags
    const courseClassMaps = await db.query.courseClassMapping.findMany({
        where: inArray(courseClassMapping.course_id, courseIds),
        with: { academicClass: true } as any
    });

    const ccmCache = new Map<string, string[]>();
    courseClassMaps.forEach((ccm: any) => {
        if (!ccm.academicClass) return;
        const current = ccmCache.get(ccm.course_id) || [];
        ccmCache.set(ccm.course_id, [...current, ccm.academicClass.name]);
    });

    // Only include school's students
    const studentsData = await db.query.students.findMany({
        where: eq(students.school_id, schoolId)
    });
    const studentIds = new Set(studentsData.map(s => s.id));
    const schoolCpData = cpData.filter(cp => studentIds.has(cp.user_id));

    return courseIds.map(courseId => {
        const { course, enrolledUserIds } = courseMap.get(courseId)!;
        const courseLessons = lessonsData.filter(l => l.course_id === courseId);
        const schoolEnrolled = Array.from(enrolledUserIds).filter(id => studentIds.has(id as string));
        const cpEntries = schoolCpData.filter(cp => cp.course_id === courseId);
        const completed = cpEntries.filter(cp => cp.completed_at != null).length;
        const totalXp = cpEntries.reduce((a, cp) => a + (cp.total_xp_earned || 0), 0);
        const totalSecs = cpEntries.reduce((a, cp) => a + (cp.total_time_secs || 0), 0);

        return {
            id: course.id,
            title: course.title,
            thumbnail_url: course.thumbnail_url,
            is_published: course.is_published,
            lesson_count: courseLessons.length,
            enrolled_count: schoolEnrolled.length,
            completion_rate: cpEntries.length > 0 ? Math.round((completed / cpEntries.length) * 100) : 0,
            avg_xp: cpEntries.length > 0 ? Math.round(totalXp / cpEntries.length) : 0,
            total_time_mins: Math.round(totalSecs / 60),
            mapped_classes: course.all_classes ? ['All Classes'] : (ccmCache.get(courseId) || []),
            description: course.description,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD (top students in school by XP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolLeaderboard(schoolId: string, limit = 10) {
    await verifySchoolAdminContext(schoolId);
    const studentsData = await db.query.students.findMany({
        where: eq(students.school_id, schoolId),
        orderBy: [desc(students.cumulative_xp)],
        limit
    });
    const studentIds = studentsData.map(s => s.id);
    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];

    return studentsData.map((s, i) => ({
        rank: i + 1,
        id: s.id,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        total_xp: Number(s.cumulative_xp),
        level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
        current_streak: calculateTrueStreak(s),
        lessons_completed: progressData.filter(p => p.user_id === s.id && p.completed_at != null).length,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleStudentStatus(userId: string, isActive: boolean) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    await verifyStudentContext(userId);
    const oldStudent = await db.query.students.findFirst({ where: eq(students.id, userId) });

    const [updated] = await db.update(students).set({ is_active: isActive }).where(eq(students.id, userId)).returning();

    if (session && oldStudent) {
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'update',
            entity_type: 'student',
            entity_id: userId,
            old_values: oldStudent,
            new_values: updated
        } as any);
        invalidateSchoolCache(oldStudent.school_id);
    }
    return updated;
}

export async function deleteStudent(userId: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    await verifyStudentContext(userId);
    const student = await db.query.students.findFirst({ where: eq(students.id, userId) });

    if (!student) throw new Error('Student not found');

    await db.transaction(async (tx) => {
        // Soft delete the student
        await tx.update(students)
            .set({
                deleted_at: new Date(),
                is_active: false,
                updated_at: new Date()
            })
            .where(eq(students.id, userId));

        // Invalidate sessions
        await tx.update(userSessions)
            .set({ revoked_at: new Date() })
            .where(eq(userSessions.user_id, userId));

        // Cleanup Redis
        const sessions = await tx.query.userSessions.findMany({ where: eq(userSessions.user_id, userId) });
        for (const s of sessions) {
            await redis.del(`session:${s.id}`);
        }

        // Audit Log
        if (session) {
            await tx.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: 'delete',
                entity_type: 'student',
                entity_id: userId,
                old_values: student
            } as any);
        }
        invalidateSchoolCache(student.school_id);
    });

    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — keep for compatibility
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSchoolBranding(schoolId: string, primaryColor: string) {
    await verifySchoolAdminContext(schoolId);
    await db.update(schools).set({ website: primaryColor }).where(eq(schools.id, schoolId));
}

export async function promoteStudentsAction(schoolId: string, newSessionName: string = 'Next Academic Year') {
    await verifySchoolAdminContext(schoolId);

    // Find current session
    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, schoolId), eq(academicSessions.is_current, true))
    });
    if (!currentSession) throw new Error('No active academic session found.');

    // Find all classes & map levels
    const allClasses = await db.query.classes.findMany();
    const classLevelMap = new Map(allClasses.map(c => [c.id, c.level]));
    const levelClassMap = new Map(allClasses.map(c => [c.level, c.id]));

    // Find classes assigned to this school
    const schoolClassesMap = await db.query.schoolClassMapping.findMany({
        where: eq(schoolClassMapping.school_id, schoolId)
    });
    const schoolClassIds = new Set(schoolClassesMap.map(c => c.class_id));

    // Get current records
    const records = await db.query.studentAcademicRecords.findMany({
        where: and(
            eq(studentAcademicRecords.school_id, schoolId),
            eq(studentAcademicRecords.session_id, currentSession.id),
            eq(studentAcademicRecords.is_promoted, false)
        )
    });

    if (records.length === 0) throw new Error('No eligible students for promotion.');

    // Complete the current session
    await db.update(academicSessions)
        .set({ is_current: false })
        .where(eq(academicSessions.id, currentSession.id));

    // Create the next session
    const newSessionStartDate = new Date();
    // E.g. session runs for one year minus one day from today
    const newSessionEndDate = new Date(newSessionStartDate);
    newSessionEndDate.setFullYear(newSessionEndDate.getFullYear() + 1);

    const [newSession] = await db.insert(academicSessions).values({
        school_id: schoolId,
        name: newSessionName,
        start_date: newSessionStartDate.toISOString(),
        end_date: newSessionEndDate.toISOString(),
        is_current: true,
    }).returning();

    // Prepare new records for next class
    const newRecords = [];
    for (const record of records) {
        // Mark as promoted in previous session
        await db.update(studentAcademicRecords)
            .set({ is_promoted: true, promoted_at: new Date() })
            .where(eq(studentAcademicRecords.id, record.id));

        const currentLevel = classLevelMap.get(record.class_id);
        if (currentLevel !== undefined) {
            const nextLevel = currentLevel + 1;
            const nextClassId = levelClassMap.get(nextLevel);

            if (nextClassId && schoolClassIds.has(nextClassId)) {
                // Next class exists and belongs to school -> Promote!
                newRecords.push({
                    user_id: record.user_id,
                    school_id: schoolId,
                    session_id: newSession.id,
                    class_id: nextClassId,
                    is_promoted: false,
                });
            } else {
                // Next class doesn't exist (e.g. Graduated). We leave them without a record, effectively finished.
                // Or you could deactivate them depending on school policy
            }
        }
    }

    if (newRecords.length > 0) {
        await db.insert(studentAcademicRecords).values(newRecords);
    }

    await invalidateSchoolCache(schoolId);

    return { success: true, message: `Successfully ended session and processed ${records.length} students into the new '${newSessionName}' session.` };
}

export async function fetchSchoolAdminCourseData(schoolId: string, courseId: string) {
    await verifySchoolAdminContext(schoolId);
    const course = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.is_published, true))
    });
    if (!course) return { course: null, lessonsData: [], studentsData: [], progressData: [] };

    // Validate course belongs to school
    const schoolEnrollments = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.school_id, schoolId), eq(enrollments.course_id, courseId))
    });

    const classMapping = await db.query.schoolClassMapping.findMany({
        where: eq(schoolClassMapping.school_id, schoolId)
    });
    const schoolClassIds = classMapping.map(gm => gm.class_id);

    let isMappedToSchool = course.all_classes === true;
    if (!isMappedToSchool && schoolClassIds.length > 0) {
        const mappings = await db.query.courseClassMapping.findFirst({
            where: and(inArray(courseClassMapping.class_id, schoolClassIds), eq(courseClassMapping.course_id, courseId))
        });
        if (mappings) isMappedToSchool = true;
    }

    if (!schoolEnrollments && !isMappedToSchool) {
        return { course: null, lessonsData: [], studentsData: [], progressData: [] };
    }

    const lessonsData = await db.query.lessons.findMany({ where: eq(lessons.course_id, courseId), orderBy: [asc(lessons.sequence_order)] });
    const studentsData = await db.query.students.findMany({ where: eq(students.school_id, schoolId) });
    const lessonIds = lessonsData.map(l => l.id);
    const progressData = lessonIds.length > 0 ? await db.select().from(lessonProgress).where(inArray(lessonProgress.lesson_id, lessonIds)) : [];

    return {
        course: { ...course, thumbnail: course.thumbnail_url, published: course.is_published },
        lessonsData: lessonsData.map(l => ({ ...l, sequence_index: l.sequence_order, duration: l.duration_minutes || 10 })),
        studentsData: studentsData.map(s => ({ ...s, full_name: `${s.first_name} ${s.last_name}`, total_xp: Number(s.cumulative_xp) })),
        progressData
    };
}

export async function getGlobalClasses() {
    return await db.query.classes.findMany({
        orderBy: (classes, { asc }) => [asc(classes.level)]
    });
}

export async function fetchSchoolClasses(schoolId: string) {
    const mappings = await db.query.schoolClassMapping.findMany({
        where: and(
            eq(schoolClassMapping.school_id, schoolId),
            eq(schoolClassMapping.is_active, true)
        )
    });
    return mappings.map(m => m.class_id);
}

export async function updateSchoolClasses(schoolId: string, classIds: string[]) {
    await verifySchoolAdminContext(schoolId);

    return await db.transaction(async (tx) => {
        // Deactivate all existing mappings
        await tx.update(schoolClassMapping)
            .set({ is_active: false })
            .where(eq(schoolClassMapping.school_id, schoolId));

        if (classIds.length > 0) {
            for (const classId of classIds) {
                // Check if mapping exists (including inactive ones)
                const existing = await tx.query.schoolClassMapping.findFirst({
                    where: and(
                        eq(schoolClassMapping.school_id, schoolId),
                        eq(schoolClassMapping.class_id, classId)
                    )
                });

                if (existing) {
                    await tx.update(schoolClassMapping)
                        .set({ is_active: true })
                        .where(eq(schoolClassMapping.id, existing.id));
                } else {
                    await tx.insert(schoolClassMapping)
                        .values({
                            school_id: schoolId,
                            class_id: classId,
                            is_active: true
                        } as any);
                }
            }
        }

        await invalidateSchoolCache(schoolId);
        return { success: true, message: 'School classes updated successfully' };
    });
}

export async function updateSchoolAdminPassword(schoolId: string, adminEmail: string, currentPass: string, newPass: string) {
    await verifySchoolAdminContext(schoolId);

    const admin = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.school_id, schoolId),
            eq(schoolAdmins.email, adminEmail)
        )
    });

    if (!admin) return { success: false, message: 'Admin not found' };

    const isValid = await bcrypt.compare(currentPass, admin.password_hash);
    if (!isValid) return { success: false, message: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPass, 10);
    await db.update(schoolAdmins)
        .set({ password_hash: newHash })
        .where(eq(schoolAdmins.id, admin.id));

    return { success: true, message: 'Password updated successfully' };
}

export async function updateSchoolAdminProfile(schoolId: string, adminId: string, data: { first_name: string, last_name: string }) {
    await verifySchoolAdminContext(schoolId);

    await db.update(schoolAdmins)
        .set({
            first_name: data.first_name,
            last_name: data.last_name,
            updated_at: new Date()
        } as any)
        .where(and(
            eq(schoolAdmins.id, adminId),
            eq(schoolAdmins.school_id, schoolId)
        ));

    return { success: true, message: 'Profile updated successfully' };
}

export async function getSchoolInvoices(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    return await db.query.invoices.findMany({
        where: eq(invoices.school_id, schoolId),
        orderBy: [desc(invoices.created_at)],
        with: {
            transaction: true
        }
    });
}

export async function getAvailablePlans() {
    return await db.query.paymentPlans.findMany({
        where: eq(paymentPlans.is_active, true),
        orderBy: [asc(paymentPlans.price)]
    });
}
