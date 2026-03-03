'use server';

import { db } from '@/lib/db';
import { users, courses, grades, schoolGradeMapping, lessons, lessonProgress, schools, enrollments, studentAcademicRecords, academicSessions } from '@/db/schema';
import { eq, asc, desc, inArray, and } from 'drizzle-orm';

export async function getSchoolAdminDashboardData(schoolId: string) {
    const students = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });

    const studentIds = students.map(s => s.id);

    // Fetch academic records to get grade/class info
    const academicRecords = studentIds.length > 0 ? await db.query.studentAcademicRecords.findMany({
        where: and(inArray(studentAcademicRecords.user_id, studentIds), eq(studentAcademicRecords.school_id, schoolId)),
    }) : [];

    const studentGradeMap = new Map<string, string>();
    academicRecords.forEach(r => {
        studentGradeMap.set(r.user_id, r.grade_id);
    });

    // Courses: find via enrollments for this school
    const schoolEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.school_id, schoolId),
        with: { course: true }
    });

    const uniqueCourseMap = new Map<string, any>();
    schoolEnrollments.forEach(e => {
        if (e.course && !uniqueCourseMap.has(e.course.id)) {
            uniqueCourseMap.set(e.course.id, {
                ...e.course,
                thumbnail: e.course.thumbnail_url,
                published: e.course.is_published,
            });
        }
    });
    const coursesData = Array.from(uniqueCourseMap.values());

    // Grades for this school
    const gradeMapping = await db.query.schoolGradeMapping.findMany({
        where: eq(schoolGradeMapping.school_id, schoolId),
        with: { grade: true } as any
    });

    const gradesData = gradeMapping.map((gm: any) => ({
        id: gm.grade_id,
        name: gm.grade?.name || '',
        level_index: gm.grade?.level || 0,
        school_id: schoolId,
        created_at: gm.created_at,
    }));

    // Lessons for school's courses
    const courseIds = coursesData.map(c => c.id);
    const lessonsData = courseIds.length > 0 ? await db.query.lessons.findMany({
        where: inArray(lessons.course_id, courseIds)
    }) : [];

    // Progress data for students
    const progressData = studentIds.length > 0 ? await db.select().from(lessonProgress).where(
        inArray(lessonProgress.user_id, studentIds)
    ) : [];

    return {
        students: students.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
            current_streak: s.current_streak || 0,
            level: Math.floor(Number(s.cumulative_xp) / 1000) + 1,
            class_id: studentGradeMap.get(s.id) || '',
        })),
        coursesData,
        classesData: gradesData,
        lessonsData: lessonsData.map(l => ({
            ...l,
            sequence_index: l.sequence_order,
            duration: l.duration_minutes || 10,
        })),
        progressData
    };
}

export async function updateSchoolBranding(schoolId: string, primaryColor: string) {
    // Logo/branding is now stored in logo_url; primary_color not in schema
    // For now, update the school's website field as a placeholder
    await db.update(schools).set({
        website: primaryColor
    }).where(eq(schools.id, schoolId));
}

export async function promoteStudentsAction(schoolId: string) {
    // Get current session
    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, schoolId), eq(academicSessions.is_current, true))
    });
    if (!currentSession) return;

    // Get all student academic records for current session
    const records = await db.query.studentAcademicRecords.findMany({
        where: and(
            eq(studentAcademicRecords.school_id, schoolId),
            eq(studentAcademicRecords.session_id, currentSession.id),
            eq(studentAcademicRecords.is_promoted, false)
        )
    });

    // Mark all as promoted
    for (const record of records) {
        await db.update(studentAcademicRecords).set({
            is_promoted: true,
            promoted_at: new Date(),
        }).where(eq(studentAcademicRecords.id, record.id));
    }
}

export async function fetchSchoolAdminCourseData(schoolId: string, courseId: string) {
    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
    });

    const lessonsData = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: [asc(lessons.sequence_order)]
    });

    const studentsData = await db.query.users.findMany({
        where: (u, { and, eq }) => and(eq(u.school_id, schoolId), eq(u.role, 'student'))
    });

    const lessonIds = lessonsData.map(l => l.id);
    const progressData = lessonIds.length > 0 ? await db.select().from(lessonProgress).where(
        inArray(lessonProgress.lesson_id, lessonIds)
    ) : [];

    return {
        course: course ? {
            ...course,
            thumbnail: course.thumbnail_url,
            published: course.is_published,
        } : null,
        lessonsData: lessonsData.map(l => ({
            ...l,
            sequence_index: l.sequence_order,
            duration: l.duration_minutes || 10,
        })),
        studentsData: studentsData.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
        })),
        progressData
    };
}
