'use server';

import { db } from '@/lib/db';
import { courses, lessons, paymentPlans } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export async function fetchAllAdminData() {
    const students = await db.query.profiles.findMany({ where: (p, { eq }) => eq(p.role, 'student') });
    const schoolsData = await db.query.schools.findMany();
    const coursesData = await db.query.courses.findMany({ orderBy: [desc(courses.created_at)] });
    const lessonsData = await db.query.lessons.findMany();
    const plansData = await db.query.paymentPlans.findMany({ orderBy: [asc(paymentPlans.price)] });
    const progressData = await db.query.progressTracking.findMany();

    return {
        students,
        schools: schoolsData,
        courses: coursesData,
        lessons: lessonsData,
        plans: plansData,
        progress: progressData
    };
}

export async function fetchCourseLessons(courseId: string) {
    return await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: [asc(lessons.sequence_index)]
    });
}

export async function saveCourseAdmin(courseData: any) {
    if (courseData.id) {
        const [updated] = await db.update(courses).set({
            title: courseData.title,
            description: courseData.description,
            thumbnail: courseData.thumbnail,
            published: courseData.published,
            grade: courseData.all_grades ? null : courseData.grade,
            all_grades: courseData.all_grades,
        }).where(eq(courses.id, courseData.id)).returning();
        return updated;
    } else {
        const [created] = await db.insert(courses).values({
            title: courseData.title,
            description: courseData.description || '',
            thumbnail: courseData.thumbnail || '',
            published: courseData.published ?? false,
            grade: courseData.all_grades ? null : courseData.grade,
            all_grades: courseData.all_grades ?? true,
        }).returning();
        return created;
    }
}

export async function deleteCourseAdmin(id: string) {
    await db.delete(courses).where(eq(courses.id, id));
}

export async function saveLessonAdmin(lessonData: any) {
    if (lessonData.id) {
        const [updated] = await db.update(lessons).set({
            title: lessonData.title,
            content_type: lessonData.content_type,
            content_url: lessonData.content_url,
            xp_reward: lessonData.xp_reward,
            duration: lessonData.duration,
        }).where(eq(lessons.id, lessonData.id)).returning();
        return updated;
    } else {
        const [created] = await db.insert(lessons).values({
            course_id: lessonData.course_id,
            title: lessonData.title,
            content_type: lessonData.content_type || 'video',
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 100,
            duration: lessonData.duration || 10,
            sequence_index: lessonData.sequence_index || 0,
        }).returning();
        return created;
    }
}

export async function deleteLessonAdmin(id: string) {
    await db.delete(lessons).where(eq(lessons.id, id));
}

export async function saveLessonOrderAdmin(updates: any[]) {
    // Simple ordered updates
    for (const update of updates) {
        await db.update(lessons)
            .set({ sequence_index: update.sequence_index })
            .where(eq(lessons.id, update.id));
    }
}

export async function savePlanAdmin(planData: any) {
    if (planData.id) {
        const [updated] = await db.update(paymentPlans).set({
            name: planData.name,
            description: planData.description || '',
            price: planData.price.toString(),
            billing_cycle: planData.billing_cycle || 'monthly',
            features: planData.features || [],
            max_students: planData.max_students,
            max_courses: planData.max_courses,
            is_active: planData.is_active ?? true,
        }).where(eq(paymentPlans.id, planData.id)).returning();
        return updated;
    } else {
        const [created] = await db.insert(paymentPlans).values({
            name: planData.name,
            description: planData.description || '',
            price: planData.price.toString(),
            billing_cycle: planData.billing_cycle || 'monthly',
            features: planData.features || [],
            max_students: planData.max_students,
            max_courses: planData.max_courses,
            is_active: planData.is_active ?? true,
        }).returning();
        return created;
    }
}

export async function deletePlanAdmin(id: string) {
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
}
