'use server';

import { db } from '@/lib/db';
import { users, courses, classes, schoolClassMapping, courseClassMapping, lessons, lessonProgress, schools, enrollments, studentAcademicRecords, academicSessions, schoolSubscriptions, paymentPlans, courseProgress, quizAttempts } from '@/db/schema';
import { eq, asc, desc, inArray, and, sql, or } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { z } from 'zod';

/**
 * MIddleware Guard: Throws if the current session does not have access to targetSchoolId
 */
async function verifySchoolAdminContext(targetSchoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    if (session.role === 'super_admin') return;

    // School Admins can only view/edit their own school
    const currentUser = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!currentUser || currentUser.school_id !== targetSchoolId) {
        throw new Error('Forbidden: Privilege Escalation Attempt Detected.');
    }
}

/**
 * Middleware Guard: Throws if current session doesn't belong to the same school as targetUserId
 */
async function verifyStudentContext(targetUserId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    if (session.role === 'super_admin') return;

    const currentUser = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    const targetStudent = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });

    if (!currentUser || !targetStudent || currentUser.school_id !== targetStudent.school_id) {
        throw new Error('Forbidden: Privatized Learner Record.');
    }
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
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolAdminDashboardData(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });
    const studentIds = students.map(s => s.id);

    const academicRecords = studentIds.length > 0 ? await db.query.studentAcademicRecords.findMany({
        where: and(inArray(studentAcademicRecords.user_id, studentIds), eq(studentAcademicRecords.school_id, schoolId)),
    }) : [];

    const studentClassMap = new Map<string, string>();
    academicRecords.forEach(r => studentClassMap.set(r.user_id, r.class_id));

    // Base enrollments - only for published courses
    const schoolEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.school_id, schoolId),
        with: { course: true }
    });

    const activeEnrollments = schoolEnrollments.filter(e => e.course?.is_published);

    // 1. Get school classes
    const classMapping = await db.query.schoolClassMapping.findMany({
        where: eq(schoolClassMapping.school_id, schoolId),
        with: { academicClass: true } as any
    });
    const classesDataFinal = classMapping.map((gm: any) => ({
        id: gm.class_id, name: gm.academicClass?.name || '', level_index: gm.academicClass?.level || 0,
        school_id: schoolId, created_at: gm.created_at,
    }));
    const schoolClassIds = classesDataFinal.map(g => g.id);

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

    const uniqueCourseMap = new Map<string, any>();

    // Add explicitly mapped valid courses
    allValidCourses.forEach(c => {
        uniqueCourseMap.set(c.id, { ...c, thumbnail: c.thumbnail_url, published: c.is_published });
    });

    // Add courses they are already enrolled in (in case mappings changed)
    activeEnrollments.forEach(e => {
        if (e.course && !uniqueCourseMap.has(e.course.id)) {
            uniqueCourseMap.set(e.course.id, { ...e.course, thumbnail: e.course.thumbnail_url, published: e.course.is_published });
        }
    });

    const coursesData = Array.from(uniqueCourseMap.values());

    const courseIds = coursesData.map(c => c.id);
    const lessonsData = courseIds.length > 0 ? await db.query.lessons.findMany({ where: inArray(lessons.course_id, courseIds) }) : [];

    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];

    return {
        students: students.map(s => ({
            ...s, full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp), current_streak: s.current_streak || 0,
            level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
            class_id: studentClassMap.get(s.id) || '',
        })),
        coursesData, classesData: classesDataFinal,
        lessonsData: lessonsData.map(l => ({ ...l, sequence_index: l.sequence_order, duration: l.duration_minutes || 10 })),
        progressData
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL STATS (aggregated)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStats(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });
    const studentIds = students.map(s => s.id);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeStudents = students.filter(s => s.last_active_at && new Date(s.last_active_at) > sevenDaysAgo).length;

    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];
    const lessonsCompleted = progressData.filter(p => p.completed_at != null).length;

    const quizData = studentIds.length > 0
        ? await db.select().from(quizAttempts).where(inArray(quizAttempts.user_id, studentIds))
        : [];

    const courseProgressData = studentIds.length > 0
        ? await db.select({
            id: courseProgress.id,
            user_id: courseProgress.user_id,
            course_id: courseProgress.course_id,
            progress_pct: courseProgress.progress_pct,
            completed_at: courseProgress.completed_at
        })
            .from(courseProgress)
            .innerJoin(courses, eq(courseProgress.course_id, courses.id))
            .where(and(
                inArray(courseProgress.user_id, studentIds),
                eq(courses.is_published, true),
                sql`${courses.deleted_at} IS NULL`
            ))
        : [];

    const avgCompletion = courseProgressData.length > 0
        ? Math.round(courseProgressData.reduce((a, cp) => a + Number(cp.progress_pct), 0) / courseProgressData.length)
        : 0;

    // Calculate total published courses mapped to this school
    const schoolClassMappingData = await db.query.schoolClassMapping.findMany({ where: eq(schoolClassMapping.school_id, schoolId) });
    const classIds = schoolClassMappingData.map(m => m.class_id);
    let totalActiveCourses = 0;
    let validCourseIds: string[] = [];
    if (classIds.length > 0) {
        const mappings = await db.query.courseClassMapping.findMany({ where: inArray(courseClassMapping.class_id, classIds) });
        validCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
    }

    const activeCourses = await db.query.courses.findMany({
        where: and(
            eq(courses.is_published, true),
            validCourseIds.length > 0
                ? or(eq(courses.all_classes, true), inArray(courses.id, validCourseIds))
                : eq(courses.all_classes, true)
        )
    });
    totalActiveCourses = activeCourses.length;

    const totalXp = students.reduce((a, s) => a + (Number(s.cumulative_xp) || 0), 0);
    const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;

    // Subscription info
    const sub = await db.query.schoolSubscriptions.findFirst({ where: eq(schoolSubscriptions.school_id, schoolId) });
    let planName: string | null = null;
    if (sub) {
        const plan = await db.query.paymentPlans.findFirst({ where: eq(paymentPlans.id, sub.plan_id) });
        planName = plan?.name || null;
    }

    return {
        totalStudents: students.length,
        activeStudents,
        avgXp,
        totalXp,
        enrolledCourses: totalActiveCourses,
        totalLessonsCompleted: lessonsCompleted,
        totalQuizzesTaken: quizData.length,
        avgCompletionRate: avgCompletion,
        planName,
        subscriptionStatus: sub?.status || null,
        planExpiry: sub?.current_period_end?.toISOString() || null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS (paginated + searchable)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStudents(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student')),
        orderBy: [desc(users.cumulative_xp)],
    });
    const studentIds = students.map(s => s.id);

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

    return students.map(s => ({
        id: s.id,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        total_xp: Number(s.cumulative_xp),
        level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
        current_streak: s.current_streak || 0,
        longest_streak: s.longest_streak || 0,
        lessons_completed: progressData.filter(p => p.user_id === s.id && p.completed_at != null).length,
        is_active: s.is_active,
        last_active_at: s.last_active_at?.toISOString() || null,
        class_name: classMap.get(s.id) || '',
    }));
}

export async function getSchoolStudentDetails(userId: string) {
    await verifyStudentContext(userId);
    const student = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });
    if (!student) return null;

    const progressData = await db.select().from(lessonProgress).where(eq(lessonProgress.user_id, userId));
    const courseProgressData = await db.select().from(courseProgress).where(eq(courseProgress.user_id, userId));
    const courseIds = courseProgressData.map(cp => cp.course_id);

    const enrolledCourses = courseIds.length > 0
        ? await db.query.courses.findMany({ where: inArray(courses.id, courseIds) })
        : [];

    const attempts = await db.query.quizAttempts.findMany({ where: eq(quizAttempts.user_id, userId) });
    const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((a, at) => a + (Number((at as any).score_pct) || 0), 0) / attempts.length)
        : 0;

    const classMappingDetails = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, userId),
        with: { academicClass: true } as any
    });

    return {
        student: {
            ...student,
            full_name: `${student.first_name} ${student.last_name}`,
            total_xp: Number(student.cumulative_xp),
            level: Math.floor(Number(student.cumulative_xp) / 1000) + 1,
            class_name: (classMappingDetails as any)?.academicClass?.name || 'N/A'
        },
        courses: courseProgressData.map(cp => {
            const c = enrolledCourses.find(cur => cur.id === cp.course_id);
            return {
                ...cp,
                title: c?.title || 'Unknown',
                thumbnail_url: c?.thumbnail_url || null
            };
        }),
        quizCount: attempts.length,
        avgScore
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
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });
    const studentIds = new Set(students.map(s => s.id));
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
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD (top students in school by XP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolLeaderboard(schoolId: string, limit = 10) {
    await verifySchoolAdminContext(schoolId);
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student')),
        orderBy: [desc(users.cumulative_xp)],
    });
    const studentIds = students.slice(0, limit).map(s => s.id);
    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];

    return students.slice(0, limit).map((s, i) => ({
        rank: i + 1,
        id: s.id,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        total_xp: Number(s.cumulative_xp),
        level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
        current_streak: s.current_streak || 0,
        lessons_completed: progressData.filter(p => p.user_id === s.id && p.completed_at != null).length,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleStudentStatus(userId: string, isActive: boolean) {
    await verifyStudentContext(userId);
    const [updated] = await db.update(users).set({ is_active: isActive }).where(eq(users.id, userId)).returning();
    return updated;
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
    const studentsData = await db.query.users.findMany({ where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student')) });
    const lessonIds = lessonsData.map(l => l.id);
    const progressData = lessonIds.length > 0 ? await db.select().from(lessonProgress).where(inArray(lessonProgress.lesson_id, lessonIds)) : [];

    return {
        course: { ...course, thumbnail: course.thumbnail_url, published: course.is_published },
        lessonsData: lessonsData.map(l => ({ ...l, sequence_index: l.sequence_order, duration: l.duration_minutes || 10 })),
        studentsData: studentsData.map(s => ({ ...s, full_name: `${s.first_name} ${s.last_name}`, total_xp: Number(s.cumulative_xp) })),
        progressData
    };
}
