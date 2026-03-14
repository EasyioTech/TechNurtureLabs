'use server';

import { db } from '@/lib/db';
import { 
    lessons, auditLogs, courses
} from '@/db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { updateCourseTotals } from './course-actions';
import { invalidateCourseCaches } from '@/lib/services/cache-service';

export async function fetchCourseLessons(courseId: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
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

export async function fetchLessonAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    return await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
}

export async function saveLessonAdmin(lessonData: any) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    if (lessonData.id) {
        const [updated] = await db.update(lessons).set({
            title: lessonData.title,
            description: lessonData.description || '',
            content_type: lessonData.content_type,
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 10,
            duration_minutes: lessonData.duration || lessonData.duration_minutes || 10,
            is_published: lessonData.is_published ?? true,
            updated_at: new Date()
        }).where(eq(lessons.id, lessonData.id)).returning();

        await updateCourseTotals(updated.course_id);
        await invalidateCourseCaches(updated.course_id);
        return { ...updated, sequence_index: updated.sequence_order, duration: updated.duration_minutes };
    } else {
        // SQL optimized max order fetch
        const maxOrderResult = await db.select({ 
            max: sql<number>`COALESCE(MAX(${lessons.sequence_order}), 0)` 
        }).from(lessons).where(eq(lessons.course_id, lessonData.course_id));
        
        const newOrder = Number(maxOrderResult[0].max) + 1;

        const [created] = await db.insert(lessons).values({
            course_id: lessonData.course_id,
            title: lessonData.title,
            description: lessonData.description || '',
            content_type: lessonData.content_type || 'video',
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 10,
            duration_minutes: lessonData.duration || lessonData.duration_minutes || 10,
            sequence_order: newOrder,
            is_published: lessonData.is_published ?? true,
        } as any).returning();

        await updateCourseTotals(created.course_id);
        await invalidateCourseCaches(created.course_id);
        return { ...created, sequence_index: created.sequence_order, duration: created.duration_minutes };
    }
}

export async function deleteLessonAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
    await db.delete(lessons).where(eq(lessons.id, id));
    if (lesson) {
        await updateCourseTotals(lesson.course_id);
        await invalidateCourseCaches(lesson.course_id);
        if (session) {
            await db.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: 'delete',
                entity_type: 'lesson',
                entity_id: id,
                old_values: lesson
            } as any);
        }
    }
}

export async function saveLessonOrderAdmin(updates: any[]) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    for (const update of updates) {
        await db.update(lessons)
            .set({ sequence_order: update.sequence_index || update.sequence_order })
            .where(eq(lessons.id, update.id));
    }

    if (updates.length > 0) {
        const first = await db.query.lessons.findFirst({ where: eq(lessons.id, updates[0].id) });
        if (first) {
            await updateCourseTotals(first.course_id);
            await invalidateCourseCaches(first.course_id);
        }
    }
}

export async function cloneLessonAction(lessonId: string, targetCourseId: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    
    const sourceLesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    if (!sourceLesson) throw new Error("Source lesson not found");

    const maxOrderResult = await db.select({ 
        max: sql<number>`COALESCE(MAX(${lessons.sequence_order}), 0)` 
    }).from(lessons).where(eq(lessons.course_id, targetCourseId));
    
    const newOrder = Number(maxOrderResult[0].max) + 1;

    const [cloned] = await db.insert(lessons).values({
        ...sourceLesson,
        id: undefined,
        course_id: targetCourseId,
        sequence_order: newOrder,
        created_at: new Date(),
        updated_at: new Date()
    } as any).returning();

    await updateCourseTotals(targetCourseId);
    await invalidateCourseCaches(targetCourseId);
    return cloned;
}

/**
 * Global Library: Fetch all lessons across all courses
 */
export async function fetchGlobalLessons() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = await db.select({
        id: lessons.id,
        title: lessons.title,
        content_type: lessons.content_type,
        created_at: lessons.created_at,
        course_title: courses.title,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.course_id, courses.id))
    .where(sql`lessons.deleted_at IS NULL`)
    .orderBy(desc(lessons.created_at));

    return data;
}

