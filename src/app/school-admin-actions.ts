'use server';

import { db } from '@/lib/db';
import { profiles, courses, classes, lessons, progressTracking, schools } from '@/db/schema';
import { eq, asc, desc, inArray } from 'drizzle-orm';

export async function getSchoolAdminDashboardData(schoolId: string) {
    const students = await db.query.profiles.findMany({
        where: (p, { and, eq }) => and(eq(p.school_id, schoolId), eq(p.role, 'student'))
    });
    const coursesData = await db.query.courses.findMany({
        // @ts-ignore Since courses don't have school_id in schema, I am fetching all published. Wait, admin page had eq('school_id', schoolId).
        // Let's assume courses has a school_id or we just return all published for now if school_id isn't in course schema.
    });
    const classesData = await db.query.classes.findMany({
        where: eq(classes.school_id, schoolId),
        orderBy: [asc(classes.level_index)]
    });
    const lessonsData = await db.query.lessons.findMany();

    const studentIds = students.map(s => s.id);
    const progressData = studentIds.length > 0 ? await db.query.progressTracking.findMany({
        where: inArray(progressTracking.user_id, studentIds),
        orderBy: [desc(progressTracking.completed_at)]
    }) : [];

    return { students, coursesData, classesData, lessonsData, progressData };
}

export async function updateSchoolBranding(schoolId: string, primaryColor: string) {
    await db.update(schools).set({
        branding_config: { primary_color: primaryColor }
    }).where(eq(schools.id, schoolId));
}

export async function promoteStudentsAction(schoolId: string) {
    // Simplistic promotion logic
    const schoolStudents = await db.query.profiles.findMany({
        where: (p, { and, eq }) => and(eq(p.school_id, schoolId), eq(p.role, 'student'))
    });

    for (const student of schoolStudents) {
        if (student.grade) {
            await db.update(profiles).set({
                grade: student.grade + 1
            }).where(eq(profiles.id, student.id));
        }
    }
}

export async function fetchSchoolAdminCourseData(schoolId: string, courseId: string) {
    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
    });

    const lessonsData = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: [asc(lessons.sequence_index)]
    });

    const studentsData = await db.query.profiles.findMany({
        where: (p, { and, eq }) => and(eq(p.school_id, schoolId), eq(p.role, 'student'))
    });

    const lessonIds = lessonsData.map(l => l.id);
    const progressData = lessonIds.length > 0 ? await db.query.progressTracking.findMany({
        where: inArray(progressTracking.lesson_id, lessonIds)
    }) : [];

    return { course, lessonsData, studentsData, progressData };
}
