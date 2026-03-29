'use server';

import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students, courses, classes, schoolClassMapping, courseClassMapping, lessons, lessonProgress, schools, enrollments, studentAcademicRecords, academicSessions, schoolSubscriptions, paymentPlans, courseProgress, quizAttempts, auditLogs, userSessions, invoices, paymentTransactions } from '@/db/schema';
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
        udise_code: school.udise_code,
    };
}

const urlSchema = z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return val;
    if (val && !/^https?:\/\//i.test(val)) {
        return `https://${val}`;
    }
    return val;
}).refine(val => {
    if (!val || val === '') return true;
    try { 
        const url = new URL(val); 
        return url.protocol === "http:" || url.protocol === "https:";
    } catch(_) { return false; }
}, { message: "Invalid URL (e.g. tech-nurture.com)" });

const alphaOnly = z.string().regex(/^[a-zA-Z\s]+$/, "Numeric digits or special characters are not allowed").min(2, "Minimum 2 characters required").optional().nullable();

const updateSchoolSchema = z.object({
    name: z.string().min(3, "Institution name must be at least 3 characters").optional(),
    email: z.string().email("Invalid official email address").optional(),
    phone: z.string().regex(/^\d{10}$/, "Provide a valid 10-digit contact number").optional().nullable(),
    address: z.string().min(10, "Provide a complete address (min 10 chars)").optional().nullable(),
    city: alphaOnly,
    state: alphaOnly,
    country: alphaOnly,
    pincode: z.string().regex(/^\d{6}$/, "Indian Pincode must be exactly 6 digits").optional().nullable(),
    logo_url: urlSchema.optional(),
    website: urlSchema.optional(),
    data_processing_consent: z.boolean().optional(),
    minor_data_guardian_consent: z.boolean().optional(),
    udise_code: z.string().regex(/^\d{11}$/, "UDISE Code must be exactly 11 digits").optional().nullable(),
});

export async function updateSchoolProfile(schoolId: string, data: any) {
    try {
        await verifySchoolAdminContext(schoolId);

        const parseResult = updateSchoolSchema.safeParse(data);
        if (!parseResult.success) {
            return {
                success: false,
                error: 'Validation failed',
                details: parseResult.error.flatten().fieldErrors
            };
        }

        await db.update(schools).set({
            ...parseResult.data,
            updated_at: new Date(),
        } as any).where(eq(schools.id, schoolId));

        // Clear both Redis cache and Next.js Data Cache
        await invalidateSchoolCache(schoolId);
        
        // Proactive revalidation to ensure students and admins see fresh data
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/school-admin', 'layout');
        revalidatePath('/student', 'layout');
        
        return { success: true };
    } catch (err: any) {
        console.error('[Update School Profile Error]:', err);
        return { 
            success: false, 
            error: err.message || 'Operation failed' 
        };
    }
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
        eq(students.is_verified, true),
        search ? or(
            sql`${students.first_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.last_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.email} ILIKE ${'%' + search + '%'}`,
            sql`${students.phone} ILIKE ${'%' + search + '%'}`
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

export async function getPendingStudents(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    
    const studentsData = await db.query.students.findMany({
        where: and(
            eq(students.school_id, schoolId),
            isNull(students.deleted_at),
            eq(students.is_verified, false)
        ),
        orderBy: [desc(students.created_at)],
        with: {
            academicRecords: {
                with: { academicClass: true },
                limit: 1
            }
        }
    });

    return studentsData.map(s => ({
        ...s,
        full_name: `${s.first_name} ${s.last_name}`,
        class_name: (s.academicRecords?.[0] as any)?.academicClass?.name || 'N/A'
    }));
}

export async function verifyStudentAction(userId: string, isVerified: boolean) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    await verifyStudentContext(userId);
    
    const student = await db.query.students.findFirst({ where: eq(students.id, userId) });
    if (!student) throw new Error('Student not found');

    if (isVerified) {
        const [updated] = await db.update(students)
            .set({ is_verified: true, updated_at: new Date() })
            .where(eq(students.id, userId))
            .returning();

        // Audit Log
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'update',
            entity_type: 'student',
            entity_id: userId,
            old_values: { is_verified: false },
            new_values: { is_verified: true },
            metadata: { field: 'is_verified' }
        } as any);
    } else {
        // Rejection - Soft delete the student
        await db.update(students)
            .set({ 
                deleted_at: new Date(), 
                is_active: false,
                updated_at: new Date() 
            })
            .where(eq(students.id, userId));

        // Audit Log
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'delete',
            entity_type: 'student',
            entity_id: userId,
            metadata: { reason: 'verification_rejected' }
        } as any);
    }

    invalidateSchoolCache(student.school_id);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL STATS (aggregated)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStats(schoolId: string) {
    await verifySchoolAdminContext(schoolId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Optimized SQL aggregations
    const [basicStats, activeCount, lessonsCompleted, quizCount, avgProgress, xpStats, pendingCount] = await Promise.all([
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true))),
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true), gt(students.last_active_at, sevenDaysAgo))),
        db.select({ count: count() }).from(lessonProgress).innerJoin(students, eq(lessonProgress.user_id, students.id)).where(and(eq(students.school_id, schoolId), isNotNull(lessonProgress.completed_at))),
        db.select({ count: count() }).from(quizAttempts).innerJoin(students, eq(quizAttempts.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ avg_pct: avg(courseProgress.progress_pct) }).from(courseProgress).innerJoin(students, eq(courseProgress.user_id, students.id)).where(eq(students.school_id, schoolId)),
        db.select({ total: sum(students.cumulative_xp), avg: avg(students.cumulative_xp) }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, true))),
        db.select({ count: count() }).from(students).where(and(eq(students.school_id, schoolId), isNull(students.deleted_at), eq(students.is_verified, false)))
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
        pendingStudents: Number(pendingCount[0]?.count || 0),
        planName: (sub as any)?.plan?.name || 'Community',
        subscriptionStatus: sub?.status || 'active',
        planExpiry: sub?.current_period_end?.toISOString() || null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS (paginated + searchable)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStudentDetails(userId: string) {
    await verifyStudentContext(userId);
    const student = await db.query.students.findFirst({
        where: and(eq(students.id, userId), isNull(students.deleted_at))
    });
    if (!student) return null;

    const [lessonsDoneResult] = await db
        .select({ count: count() })
        .from(lessonProgress)
        .where(and(
            eq(lessonProgress.user_id, userId),
            isNotNull(lessonProgress.completed_at)
        ));
    const lessonsDone = Number(lessonsDoneResult?.count ?? 0);

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

    // 1. Get school class IDs
    const classMapping = await db.select({ class_id: schoolClassMapping.class_id })
        .from(schoolClassMapping)
        .where(eq(schoolClassMapping.school_id, schoolId));
    const schoolClassIds = classMapping.map(m => m.class_id);

    // 2. Get valid course IDs for this school
    let validCourseIds: string[] = [];
    if (schoolClassIds.length > 0) {
        const mappings = await db.select({ course_id: courseClassMapping.course_id })
            .from(courseClassMapping)
            .where(inArray(courseClassMapping.class_id, schoolClassIds));
        validCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
    }

    // 3. Get published courses applicable to this school
    const validCourses = await db.select({
        id: courses.id,
        title: courses.title,
        thumbnail_url: courses.thumbnail_url,
        is_published: courses.is_published,
        all_classes: courses.all_classes,
        description: courses.description,
    })
    .from(courses)
    .where(and(
        eq(courses.is_published, true),
        validCourseIds.length > 0
            ? or(eq(courses.all_classes, true), inArray(courses.id, validCourseIds))
            : eq(courses.all_classes, true)
    ));

    if (validCourses.length === 0) return [];
    const courseIds = validCourses.map(c => c.id);

    // 4. Get school student IDs (one lightweight query)
    const schoolStudents = await db.select({ id: students.id })
        .from(students)
        .where(and(eq(students.school_id, schoolId), isNull(students.deleted_at)));
    const studentIds = schoolStudents.map(s => s.id);

    if (studentIds.length === 0) {
        return validCourses.map(c => ({
            id: c.id, title: c.title, thumbnail_url: c.thumbnail_url,
            is_published: c.is_published, lesson_count: 0, enrolled_count: 0,
            completion_rate: 0, avg_xp: 0, total_time_mins: 0,
            mapped_classes: c.all_classes ? ['All Classes'] : [],
            description: c.description,
        }));
    }

    // 5. Push all aggregations to Postgres — no row-level JS filtering
    const [enrollmentCounts, progressStats, lessonCounts, courseClassMaps] = await Promise.all([
        db.select({
            course_id: enrollments.course_id,
            count: count(),
        })
        .from(enrollments)
        .where(and(
            inArray(enrollments.course_id, courseIds),
            inArray(enrollments.user_id, studentIds)
        ))
        .groupBy(enrollments.course_id),

        db.select({
            course_id: courseProgress.course_id,
            total_entries: count(),
            completed: sql<number>`COUNT(CASE WHEN ${courseProgress.completed_at} IS NOT NULL THEN 1 END)`,
            avg_xp: avg(courseProgress.total_xp_earned),
            total_time_secs: sum(courseProgress.total_time_secs),
        })
        .from(courseProgress)
        .where(and(
            inArray(courseProgress.course_id, courseIds),
            inArray(courseProgress.user_id, studentIds)
        ))
        .groupBy(courseProgress.course_id),

        db.select({
            course_id: lessons.course_id,
            count: count(),
        })
        .from(lessons)
        .where(inArray(lessons.course_id, courseIds))
        .groupBy(lessons.course_id),

        db.query.courseClassMapping.findMany({
            where: inArray(courseClassMapping.course_id, courseIds),
            with: { academicClass: true } as any
        }),
    ]);

    const enrollMap = new Map(enrollmentCounts.map(r => [r.course_id, Number(r.count)]));
    const progressMap = new Map(progressStats.map(r => [r.course_id, r]));
    const lessonMap = new Map(lessonCounts.map(r => [r.course_id, Number(r.count)]));

    const ccmCache = new Map<string, string[]>();
    courseClassMaps.forEach((ccm: any) => {
        if (!ccm.academicClass) return;
        const current = ccmCache.get(ccm.course_id) || [];
        ccmCache.set(ccm.course_id, [...current, ccm.academicClass.name]);
    });

    return validCourses.map(c => {
        const progress = progressMap.get(c.id);
        const totalEntries = Number(progress?.total_entries || 0);
        const completed = Number(progress?.completed || 0);
        const totalTimeSecs = Number(progress?.total_time_secs || 0);
        return {
            id: c.id,
            title: c.title,
            thumbnail_url: c.thumbnail_url,
            is_published: c.is_published,
            lesson_count: lessonMap.get(c.id) ?? 0,
            enrolled_count: enrollMap.get(c.id) ?? 0,
            completion_rate: totalEntries > 0 ? Math.round((completed / totalEntries) * 100) : 0,
            avg_xp: totalEntries > 0 ? Math.round(Number(progress?.avg_xp || 0)) : 0,
            total_time_mins: Math.round(totalTimeSecs / 60),
            mapped_classes: c.all_classes ? ['All Classes'] : (ccmCache.get(c.id) || []),
            description: c.description,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD (top students in school by XP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolLeaderboard(schoolId: string, limit = 10) {
    await verifySchoolAdminContext(schoolId);
    const studentsData = await db.query.students.findMany({
        where: and(eq(students.school_id, schoolId), isNull(students.deleted_at)),
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

    return studentsData.map((s, i) => ({
        rank: i + 1,
        id: s.id,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        phone: s.phone,
        total_xp: Number(s.cumulative_xp),
        level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
        current_streak: calculateTrueStreak(s),
        lessons_completed: completionMap.get(s.id) ?? 0,
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

export async function updateSchoolAdminPassword(schoolId: string, adminId: string, currentPass: string, newPass: string) {
    await verifySchoolAdminContext(schoolId);

    const admin = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.school_id, schoolId),
            eq(schoolAdmins.id, adminId)
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

export async function upgradeSchoolPlan(schoolId: string, planId: string) {
    try {
        await verifySchoolAdminContext(schoolId);

        const plan = await db.query.paymentPlans.findFirst({
            where: and(eq(paymentPlans.id, planId), eq(paymentPlans.is_active, true))
        });

        if (!plan) return { success: false, error: 'Invalid or inactive plan selected' };

        const school = await db.query.schools.findFirst({
            where: eq(schools.id, schoolId)
        });

        if (!school) return { success: false, error: 'School not found' };

        const now = new Date();
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + 1);

        const subId = await db.transaction(async (tx) => {
            // 1. Create/Update subscription
            const subs = await tx.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.school_id, schoolId));
            let sId: string;

            if (subs.length > 0) {
                sId = subs[0].id;
                await tx.update(schoolSubscriptions).set({
                    plan_id: planId,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear,
                    auto_renew: true,
                    updated_at: now
                } as any).where(eq(schoolSubscriptions.id, sId));
            } else {
                const newSub = await tx.insert(schoolSubscriptions).values({
                    school_id: schoolId,
                    plan_id: planId,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear,
                    auto_renew: true,
                    created_at: now,
                    updated_at: now
                } as any).returning();
                sId = newSub[0].id;
            }

            // 2. Create Transaction record
            const trans = await tx.insert(paymentTransactions).values({
                school_id: schoolId,
                subscription_id: sId,
                amount: plan.price,
                currency: plan.currency,
                status: 'captured',
                created_at: now,
                updated_at: now
            } as any).returning();

            // 3. Generate Invoice
            const invoiceNum = `INV-${Date.now().toString().slice(-8)}`;
            await tx.insert(invoices).values({
                school_id: schoolId,
                subscription_id: sId,
                transaction_id: trans[0].id,
                invoice_number: invoiceNum,
                status: 'paid',
                subtotal: plan.price,
                total: plan.price,
                currency: plan.currency,
                issued_at: now,
                paid_at: now,
                billing_name: school.name,
                billing_address: `${school.city || ''}, ${school.state || ''}, ${school.country || 'IN'} - ${school.pincode || ''}`,
                created_at: now,
                updated_at: now
            } as any);

            return sId;
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/school-admin', 'layout');
        await invalidateSchoolCache(schoolId);
        
        return { success: true };
    } catch (err: any) {
        console.error('[Upgrade Plan Error]:', err);
        return { success: false, error: err.message || 'Operation failed' };
    }
}
