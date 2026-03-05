'use server';

import { db } from '@/lib/db';
import { users, courses, grades, schoolGradeMapping, courseGradeMapping, lessons, lessonProgress, schools, enrollments, studentAcademicRecords, academicSessions, schoolSubscriptions, paymentPlans, courseProgress, quizAttempts } from '@/db/schema';
import { eq, asc, desc, inArray, and, sql } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolProfile(schoolId: string) {
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

// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolAdminDashboardData(schoolId: string) {
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });
    const studentIds = students.map(s => s.id);

    const academicRecords = studentIds.length > 0 ? await db.query.studentAcademicRecords.findMany({
        where: and(inArray(studentAcademicRecords.user_id, studentIds), eq(studentAcademicRecords.school_id, schoolId)),
    }) : [];

    const studentGradeMap = new Map<string, string>();
    academicRecords.forEach(r => studentGradeMap.set(r.user_id, r.grade_id));

    // Base enrollments
    const schoolEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.school_id, schoolId),
        with: { course: true }
    });

    // 1. Get school grades
    const gradeMapping = await db.query.schoolGradeMapping.findMany({
        where: eq(schoolGradeMapping.school_id, schoolId),
        with: { grade: true } as any
    });
    const gradesData = gradeMapping.map((gm: any) => ({
        id: gm.grade_id, name: gm.grade?.name || '', level_index: gm.grade?.level || 0,
        school_id: schoolId, created_at: gm.created_at,
    }));
    const schoolGradeIds = gradesData.map(g => g.id);

    // 2. Get applicable courses
    let validCourseIds: string[] = [];
    if (schoolGradeIds.length > 0) {
        const mappings = await db.query.courseGradeMapping.findMany({
            where: inArray(courseGradeMapping.grade_id, schoolGradeIds)
        });
        validCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
    }

    const allValidCourses = validCourseIds.length > 0
        ? await db.query.courses.findMany({
            where: and(inArray(courses.id, validCourseIds), eq(courses.is_published, true))
        })
        : [];

    const uniqueCourseMap = new Map<string, any>();

    // Add explicitly mapped valid courses
    allValidCourses.forEach(c => {
        uniqueCourseMap.set(c.id, { ...c, thumbnail: c.thumbnail_url, published: c.is_published });
    });

    // Add courses they are already enrolled in (in case mappings changed)
    schoolEnrollments.forEach(e => {
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
            class_id: studentGradeMap.get(s.id) || '',
        })),
        coursesData, classesData: gradesData,
        lessonsData: lessonsData.map(l => ({ ...l, sequence_index: l.sequence_order, duration: l.duration_minutes || 10 })),
        progressData
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL STATS (aggregated)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolStats(schoolId: string) {
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
        ? await db.select().from(courseProgress).where(inArray(courseProgress.user_id, studentIds))
        : [];
    const enrolledCourses = new Set(courseProgressData.map(cp => cp.course_id)).size;
    const avgCompletion = courseProgressData.length > 0
        ? Math.round(courseProgressData.reduce((a, cp) => a + Number(cp.progress_pct), 0) / courseProgressData.length)
        : 0;

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
        enrolledCourses,
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
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student')),
        orderBy: [desc(users.cumulative_xp)],
    });
    const studentIds = students.map(s => s.id);

    const progressData = studentIds.length > 0
        ? await db.select().from(lessonProgress).where(inArray(lessonProgress.user_id, studentIds))
        : [];

    const gradeRecords = studentIds.length > 0
        ? await db.query.studentAcademicRecords.findMany({
            where: and(inArray(studentAcademicRecords.user_id, studentIds), eq(studentAcademicRecords.school_id, schoolId)),
            with: { grade: true } as any
        })
        : [];

    const gradeMap = new Map<string, string>();
    gradeRecords.forEach((r: any) => gradeMap.set(r.user_id, r.grade?.name || ''));

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
        grade_name: gradeMap.get(s.id) || '',
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE ANALYTICS (school-scoped)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolCourseAnalytics(schoolId: string) {
    const schoolEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.school_id, schoolId),
        with: { course: true }
    });

    const gradeMapping = await db.query.schoolGradeMapping.findMany({
        where: eq(schoolGradeMapping.school_id, schoolId)
    });
    const schoolGradeIds = gradeMapping.map(gm => gm.grade_id);

    let validCourseIds: string[] = [];
    if (schoolGradeIds.length > 0) {
        const mappings = await db.query.courseGradeMapping.findMany({
            where: inArray(courseGradeMapping.grade_id, schoolGradeIds)
        });
        validCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
    }

    const allValidCourses = validCourseIds.length > 0
        ? await db.query.courses.findMany({
            where: and(inArray(courses.id, validCourseIds), eq(courses.is_published, true))
        })
        : [];

    const courseMap = new Map<string, any>();

    allValidCourses.forEach(c => {
        courseMap.set(c.id, { course: c, enrolledUserIds: new Set() });
    });

    schoolEnrollments.forEach(e => {
        if (!e.course) return;
        if (!courseMap.has(e.course.id)) courseMap.set(e.course.id, { course: e.course, enrolledUserIds: new Set() });
        courseMap.get(e.course.id).enrolledUserIds.add(e.user_id);
    });

    const courseIds = Array.from(courseMap.keys());
    if (courseIds.length === 0) return [];

    const lessonsData = await db.query.lessons.findMany({ where: inArray(lessons.course_id, courseIds) });
    const cpData = await db.select().from(courseProgress).where(inArray(courseProgress.course_id, courseIds));

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
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD (top students in school by XP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSchoolLeaderboard(schoolId: string, limit = 10) {
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
    const [updated] = await db.update(users).set({ is_active: isActive }).where(eq(users.id, userId)).returning();
    return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — keep for compatibility
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSchoolBranding(schoolId: string, primaryColor: string) {
    await db.update(schools).set({ website: primaryColor }).where(eq(schools.id, schoolId));
}

export async function promoteStudentsAction(schoolId: string) {
    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, schoolId), eq(academicSessions.is_current, true))
    });
    if (!currentSession) return;
    const records = await db.query.studentAcademicRecords.findMany({
        where: and(
            eq(studentAcademicRecords.school_id, schoolId),
            eq(studentAcademicRecords.session_id, currentSession.id),
            eq(studentAcademicRecords.is_promoted, false)
        )
    });
    for (const record of records) {
        await db.update(studentAcademicRecords).set({ is_promoted: true, promoted_at: new Date() }).where(eq(studentAcademicRecords.id, record.id));
    }
}

export async function fetchSchoolAdminCourseData(schoolId: string, courseId: string) {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return { course: null, lessonsData: [], studentsData: [], progressData: [] };

    // Validate course belongs to school
    const schoolEnrollments = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.school_id, schoolId), eq(enrollments.course_id, courseId))
    });

    const gradeMapping = await db.query.schoolGradeMapping.findMany({
        where: eq(schoolGradeMapping.school_id, schoolId)
    });
    const schoolGradeIds = gradeMapping.map(gm => gm.grade_id);

    let isMappedToSchool = course.all_grades === true;
    if (!isMappedToSchool && schoolGradeIds.length > 0) {
        const mappings = await db.query.courseGradeMapping.findFirst({
            where: and(inArray(courseGradeMapping.grade_id, schoolGradeIds), eq(courseGradeMapping.course_id, courseId))
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
