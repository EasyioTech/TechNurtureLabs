'use server';

import { db } from '@/lib/db';
import { 
    lessons, courses
} from '@/db/schema';
import { eq, asc, desc, sql, count, ilike, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { createAuditLog } from '@/lib/audit';
import { updateCourseTotals } from './course-actions';
import { invalidateCourseCaches } from '@/lib/services/cache-service';

export async function fetchCourseLessons(courseId: string) {
    const session = await requireSuperAdmin();
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
    const session = await requireSuperAdmin();
    return await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
}

const lessonSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    course_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().nullable().default(''),
    content_type: z.enum(['video', 'ppt', 'pdf', 'quiz']),
    content_url: z.string().optional().nullable().default(''),
    content_items: z.any().optional().nullable(),
    asset_id: z.string().uuid().optional().nullable(),
    xp_reward: z.number().int().min(0).nullable().default(10),
    duration: z.number().int().min(0).optional().nullable(),
    duration_minutes: z.number().int().min(0).optional().nullable(),
    is_published: z.boolean().optional().nullable().default(true),
});

export async function saveLessonAdmin(lessonData: unknown) {
    const session = await requireSuperAdmin();

    const data = lessonSchema.parse(lessonData);
    const durationMinutes = data.duration ?? data.duration_minutes ?? 10;

    if (data.id) {
        const [updated] = await db.update(lessons).set({
            title: data.title,
            description: data.description || '',
            content_type: data.content_type,
            content_url: data.content_url || '',
            content_items: data.content_items ?? null,
            asset_id: data.asset_id ?? null,
            xp_reward: data.xp_reward || 10,
            duration_minutes: durationMinutes,
            is_published: data.is_published ?? true,
            updated_at: new Date()
        }).where(eq(lessons.id, data.id)).returning();

        if (session) {
            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'update',
                entityType: 'lesson',
                entityId: updated.id,
                newValues: updated,
                metadata: { courseId: updated.course_id }
            });
        }

        await updateCourseTotals(updated.course_id);
        await invalidateCourseCaches(updated.course_id);
        return { ...updated, sequence_index: updated.sequence_order, duration: updated.duration_minutes };
    } else {
        if (!data.course_id) throw new Error('course_id is required when creating a lesson');

        const [created] = await db.insert(lessons).values({
            course_id: data.course_id,
            title: data.title,
            description: data.description || '',
            content_type: data.content_type,
            content_url: data.content_url || '',
            content_items: data.content_items ?? null,
            asset_id: data.asset_id ?? null,
            xp_reward: data.xp_reward || 10,
            duration_minutes: durationMinutes,
            // H-5: Atomic subquery to prevent sequence order race conditions
            sequence_order: sql`(SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM lessons WHERE course_id = ${data.course_id})`,
            is_published: data.is_published ?? true,
        } as any).returning();

        if (session) {
            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'create',
                entityType: 'lesson',
                entityId: created.id,
                newValues: created,
                metadata: { courseId: created.course_id }
            });
        }

        await updateCourseTotals(created.course_id);
        await invalidateCourseCaches(created.course_id);
        return { ...created, sequence_index: created.sequence_order, duration: created.duration_minutes };
    }
}

export async function deleteLessonAdmin(id: string) {
    const session = await requireSuperAdmin();
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
    await db.delete(lessons).where(eq(lessons.id, id));
    if (lesson) {
        await updateCourseTotals(lesson.course_id);
        await invalidateCourseCaches(lesson.course_id);
        if (session) {
            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'delete',
                entityType: 'lesson',
                entityId: id,
                oldValues: lesson,
                metadata: { courseId: lesson.course_id }
            });
        }
    }
}

const lessonOrderUpdateSchema = z.array(z.object({
    id: z.string().uuid(),
    sequence_order: z.number().int().min(0).optional(),
    sequence_index: z.number().int().min(0).optional(),
}));

/**
 * Persists lesson sequence updates.
 * CRITICAL FIX: Uses a temporary offset strategy to prevent UniqueIndex violations
 * (uq_lesson_sequence_per_course) during bulk updates.
 */
export async function saveLessonOrderAdmin(rawUpdates: any[]) {
    const session = await requireSuperAdmin();

    let updates;
    try {
        updates = lessonOrderUpdateSchema.parse(rawUpdates);
    } catch (err) {
        throw new Error('Invalid lesson order data format');
    }

    if (updates.length === 0) return;

    // 1. Get course context from the first lesson
    const firstLesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, updates[0].id)
    });
    
    if (!firstLesson) throw new Error('Lesson context not found');
    const courseId = firstLesson.course_id;

    try {
        await db.transaction(async (tx) => {
            // 2. PHASE 1: Move target lessons to a temporary out-of-range sequence
            // This prevents unique constraint collisions (uq_lesson_sequence_per_course)
            // when swapping positions (e.g. swapping 1 and 2 would normally fail at 1->2).
            const targetIds = updates.map(u => u.id);
            await tx.update(lessons)
                .set({ sequence_order: sql`${lessons.sequence_order} + 10000` })
                .where(and(
                    eq(lessons.course_id, courseId),
                    inArray(lessons.id, targetIds)
                ));

            // 3. PHASE 2: Apply the final desired sequence indices
            for (const u of updates) {
                const finalOrder = u.sequence_index ?? u.sequence_order;
                if (finalOrder === undefined) continue;

                await tx.update(lessons)
                    .set({
                        sequence_order: finalOrder,
                        updated_at: new Date()
                    })
                    .where(eq(lessons.id, u.id));
            }
        });

        // 4. Cleanup & Invalidation
        await updateCourseTotals(courseId);
        await invalidateCourseCaches(courseId);

    } catch (err: any) {
        console.error("[saveLessonOrderAdmin] Transaction failed:", err);
        throw new Error('Failed to update lesson order: ' + (err.message || 'Database error'));
    }
}

export async function cloneLessonAction(lessonId: string, targetCourseId: string) {
    const session = await requireSuperAdmin();
    
    const sourceLesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    if (!sourceLesson) throw new Error("Source lesson not found");

    const [cloned] = await db.insert(lessons).values({
        ...sourceLesson,
        id: undefined,
        course_id: targetCourseId,
        // H-5: Atomic subquery for sequence order during cloning
        sequence_order: sql`(SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM lessons WHERE course_id = ${targetCourseId})`,
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
    const session = await requireSuperAdmin();

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

