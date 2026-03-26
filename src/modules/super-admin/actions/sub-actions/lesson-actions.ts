'use server';

import { db } from '@/lib/db';
import { 
    lessons, auditLogs, courses
} from '@/db/schema';
import { eq, asc, desc, sql, count, ilike, and } from 'drizzle-orm';
import { z } from 'zod';
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

const lessonSchema = z.object({
    id: z.string().uuid().optional(),
    course_id: z.string().uuid().optional(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().default(''),
    content_type: z.enum(['video', 'ppt', 'pdf', 'quiz', 'assignment']),
    content_url: z.string().optional().default(''),
    content_items: z.any().optional().nullable(),
    asset_id: z.string().uuid().optional().nullable(),
    xp_reward: z.number().int().min(0).default(10),
    duration: z.number().int().min(0).optional(),
    duration_minutes: z.number().int().min(0).optional(),
    is_published: z.boolean().optional().default(true),
});

export async function saveLessonAdmin(lessonData: unknown) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = lessonSchema.parse(lessonData);
    const durationMinutes = data.duration ?? data.duration_minutes ?? 10;

    if (data.id) {
        const [updated] = await db.update(lessons).set({
            title: data.title,
            description: data.description,
            content_type: data.content_type,
            content_url: data.content_url,
            content_items: data.content_items ?? null,
            asset_id: data.asset_id ?? null,
            xp_reward: data.xp_reward,
            duration_minutes: durationMinutes,
            is_published: data.is_published ?? true,
            updated_at: new Date()
        }).where(eq(lessons.id, data.id)).returning();

        await updateCourseTotals(updated.course_id);
        await invalidateCourseCaches(updated.course_id);
        return { ...updated, sequence_index: updated.sequence_order, duration: updated.duration_minutes };
    } else {
        if (!data.course_id) throw new Error('course_id is required when creating a lesson');

        const maxOrderResult = await db.select({
            max: sql<number>`COALESCE(MAX(${lessons.sequence_order}), 0)`
        }).from(lessons).where(eq(lessons.course_id, data.course_id));

        const newOrder = Number(maxOrderResult[0].max) + 1;

        const [created] = await db.insert(lessons).values({
            course_id: data.course_id,
            title: data.title,
            description: data.description,
            content_type: data.content_type,
            content_url: data.content_url,
            content_items: data.content_items ?? null,
            asset_id: data.asset_id ?? null,
            xp_reward: data.xp_reward,
            duration_minutes: durationMinutes,
            sequence_order: newOrder,
            is_published: data.is_published ?? true,
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
 * Global Library: Fetch lessons across all courses with server-side pagination + search.
 * Previously returned every lesson with no LIMIT — a single query could return tens of
 * thousands of rows as content grows.  Now bounded to `limit` rows per page (default 50,
 * max 200) with an optional full-text search pushed down to Postgres.
 */
export async function fetchGlobalLessons({
    page = 1,
    limit = 50,
    search = '',
}: { page?: number; limit?: number; search?: string } = {}) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const searchFilter = search.trim().length >= 2
        ? ilike(lessons.title, `%${search.trim()}%`)
        : undefined;

    const baseWhere = searchFilter
        ? and(sql`lessons.deleted_at IS NULL`, searchFilter)
        : sql`lessons.deleted_at IS NULL`;

    const [data, countResult] = await Promise.all([
        db.select({
            id: lessons.id,
            title: lessons.title,
            content_type: lessons.content_type,
            created_at: lessons.created_at,
            course_title: courses.title,
        })
        .from(lessons)
        .innerJoin(courses, eq(lessons.course_id, courses.id))
        .where(baseWhere)
        .orderBy(desc(lessons.created_at))
        .limit(safeLimit)
        .offset(offset),

        db.select({ total: count() })
        .from(lessons)
        .where(baseWhere),
    ]);

    const total = Number(countResult[0]?.total ?? 0);
    return { data, total, pages: Math.ceil(total / safeLimit), page: safePage };
}

