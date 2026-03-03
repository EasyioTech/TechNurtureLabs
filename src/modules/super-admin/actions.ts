'use server';

import { db } from '@/lib/db';
import { courses, lessons, paymentPlans, users, schools, lessonProgress, enrollments, schoolSubscriptions, paymentTransactions } from '@/db/schema';
import { eq, asc, desc, and, count, sum, isNotNull } from 'drizzle-orm';

export async function fetchAllAdminData() {
    const students = await db.query.users.findMany({ where: (u, { eq }) => eq(u.role, 'student') });
    const schoolsData = await db.query.schools.findMany();
    const coursesData = await db.query.courses.findMany({ orderBy: [desc(courses.created_at)] });
    const lessonsData = await db.query.lessons.findMany();
    const plansData = await db.query.paymentPlans.findMany({ orderBy: [asc(paymentPlans.price)] });
    const progressData = await db.select().from(lessonProgress);
    const enrollmentsData = await db.select().from(enrollments);
    const subscriptionsData = await db.select().from(schoolSubscriptions);
    const transactionsData = await db.select().from(paymentTransactions);

    return {
        students: students.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
            level: Math.floor((Number(s.cumulative_xp) || 0) / 500) + 1,
        })),
        schools: schoolsData,
        courses: coursesData.map(c => ({
            ...c,
            thumbnail: c.thumbnail_url,
            published: c.is_published,
        })),
        lessons: lessonsData.map(l => ({
            ...l,
            sequence_index: l.sequence_order,
            duration: l.duration_minutes || 10,
        })),
        plans: plansData.map(p => ({
            ...p,
            price: Number(p.price),
            features: Array.isArray(p.features) ? p.features : (typeof p.features === 'object' ? Object.values(p.features as Record<string, string>) : []),
        })),
        progress: progressData,
        enrollments: enrollmentsData,
        subscriptions: subscriptionsData,
        transactions: transactionsData,
    };
}

export async function fetchCourseLessons(courseId: string) {
    const data = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: [asc(lessons.sequence_order)]
    });
    return data.map(l => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
    }));
}

export async function saveCourseAdmin(courseData: any) {
    if (courseData.id) {
        const [updated] = await db.update(courses).set({
            title: courseData.title,
            description: courseData.description,
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url,
            is_published: courseData.published ?? courseData.is_published,
        }).where(eq(courses.id, courseData.id)).returning();
        return { ...updated, thumbnail: updated.thumbnail_url, published: updated.is_published };
    } else {
        const slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [created] = await db.insert(courses).values({
            title: courseData.title,
            description: courseData.description || '',
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url || '',
            is_published: courseData.published ?? courseData.is_published ?? false,
            slug: slug,
            created_by: courseData.created_by || courseData.userId,
        } as any).returning();
        return { ...created, thumbnail: created.thumbnail_url, published: created.is_published };
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
            duration_minutes: lessonData.duration || lessonData.duration_minutes,
        }).where(eq(lessons.id, lessonData.id)).returning();
        return { ...updated, sequence_index: updated.sequence_order, duration: updated.duration_minutes };
    } else {
        const [created] = await db.insert(lessons).values({
            course_id: lessonData.course_id,
            title: lessonData.title,
            content_type: lessonData.content_type || 'video',
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 100,
            duration_minutes: lessonData.duration || lessonData.duration_minutes || 10,
            sequence_order: lessonData.sequence_index || lessonData.sequence_order || 1,
        } as any).returning();
        return { ...created, sequence_index: created.sequence_order, duration: created.duration_minutes };
    }
}

export async function deleteLessonAdmin(id: string) {
    await db.delete(lessons).where(eq(lessons.id, id));
}

export async function saveLessonOrderAdmin(updates: any[]) {
    for (const update of updates) {
        await db.update(lessons)
            .set({ sequence_order: update.sequence_index || update.sequence_order })
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
            features: planData.features || {},
            max_students: planData.max_students,
            is_active: planData.is_active ?? true,
        }).where(eq(paymentPlans.id, planData.id)).returning();
        return { ...updated, price: Number(updated.price) };
    } else {
        const [created] = await db.insert(paymentPlans).values({
            name: planData.name,
            description: planData.description || '',
            price: planData.price.toString(),
            billing_cycle: planData.billing_cycle || 'monthly',
            features: planData.features || {},
            max_students: planData.max_students,
            is_active: planData.is_active ?? true,
        } as any).returning();
        return { ...created, price: Number(created.price) };
    }
}

export async function deletePlanAdmin(id: string) {
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const [updated] = await db.update(schools)
        .set({ is_active: isActive })
        .where(eq(schools.id, schoolId))
        .returning();
    return updated;
}
