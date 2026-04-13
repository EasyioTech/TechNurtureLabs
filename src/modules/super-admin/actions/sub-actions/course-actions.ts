'use server';

import { db } from '@/lib/db';
import { 
    courses, lessons, enrollments, 
    courseClassMapping 
} from '@/db/schema';
import { eq, count, sql, and, desc, asc, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { redis } from '@/lib/redis';
import { createAuditLog } from '@/lib/audit';

const CACHE_KEY = 'cache:admin:courses';

export async function fetchAdminCourses(page: number = 0, limit: number = 50) {
    const session = await requireSuperAdmin();

    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = Math.max(0, page) * safeLimit;

    const coursesData = await db.select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        thumbnail_url: courses.thumbnail_url,
        is_published: courses.is_published,
        all_classes: courses.all_classes,
        total_lessons: courses.total_lessons,
        total_xp: courses.total_xp,
        created_at: courses.created_at,
        enrolled_count: count(enrollments.id)
    })
    .from(courses)
    .leftJoin(enrollments, eq(enrollments.course_id, courses.id))
    .where(isNull(courses.deleted_at))
    .groupBy(courses.id)
    .orderBy(desc(courses.created_at))
    .limit(safeLimit)
    .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(courses).where(isNull(courses.deleted_at));

    return {
        data: coursesData.map(c => ({
            ...c,
            thumbnail: c.thumbnail_url,
            published: c.is_published,
            enrolled_count: Number(c.enrolled_count || 0),
        })),
        total: Number(total),
        pages: Math.ceil(Number(total) / safeLimit)
    };
}

export async function fetchCourseClassMappings() {
    const session = await requireSuperAdmin();

    return await db.select({
        course_id: courseClassMapping.course_id,
        class_id: courseClassMapping.class_id,
    }).from(courseClassMapping);
}

export async function updateCourseTotals(courseId: string, txContext?: any) {
    const dbClient = txContext ?? db;

    const stats = await dbClient.select({
        count: count(),
        xp: sql<number>`sum(${lessons.xp_reward})`
    })
    .from(lessons)
    .where(and(eq(lessons.course_id, courseId), isNull(lessons.deleted_at)));

    const totalLessons = Number(stats[0].count);
    const totalXp = Number(stats[0].xp || 0);

    await dbClient.update(courses)
        .set({ total_lessons: totalLessons, total_xp: totalXp, updated_at: new Date() })
        .where(eq(courses.id, courseId));
    
    await redis.del(CACHE_KEY);
    await redis.del('cache:admin:meta');
}

import { analyticsService } from '@/lib/services/analytics-service';

const courseSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().nullable().default(''),
    thumbnail: z.string().optional().nullable(),
    thumbnail_url: z.string().optional().nullable(),
    published: z.boolean().optional().nullable(),
    is_published: z.boolean().optional().nullable(),
    all_classes: z.boolean().optional().nullable().default(false),
    classIds: z.array(z.string().uuid()).optional().nullable(),
    created_by: z.string().uuid().optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
});

export async function saveCourseAdmin(courseData: unknown) {
    const session = await requireSuperAdmin();

    const data = courseSchema.parse(courseData);
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const thumbnailUrl = data.thumbnail ?? data.thumbnail_url ?? '';
    const isPublished = data.published ?? data.is_published ?? false;

    let courseId = data.id;
    let isNew = false;

    return await db.transaction(async (tx) => {
        const existing = await tx.query.courses.findFirst({
            where: and(eq(courses.slug, slug), isNull(courses.deleted_at))
        });
        if (existing && existing.id !== courseId) {
            slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        if (courseId) {
            const oldCourse = await tx.query.courses.findFirst({ where: eq(courses.id, courseId) });
            await tx.update(courses).set({
                title: data.title,
                slug,
                description: data.description || '',
                thumbnail_url: thumbnailUrl,
                is_published: isPublished,
                all_classes: data.all_classes ?? false,
                updated_at: new Date()
            }).where(eq(courses.id, courseId));

            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'update',
                entityType: 'course',
                entityId: courseId,
                newValues: data,
                metadata: {},
                tx
            });
        } else {
            const createdBy = data.created_by ?? data.userId ?? session.userId;
            const [created] = await tx.insert(courses).values({
                title: data.title,
                slug,
                description: data.description || '',
                thumbnail_url: thumbnailUrl,
                is_published: isPublished,
                all_classes: data.all_classes ?? false,
                created_by: createdBy,
                total_lessons: 0,
                total_xp: 0,
            }).returning();
            courseId = created.id;
            isNew = true;

            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'create',
                entityType: 'course',
                entityId: courseId,
                newValues: created,
                metadata: {},
                tx
            });
        }

        if (data.classIds) {
            await tx.delete(courseClassMapping).where(eq(courseClassMapping.course_id, courseId!));
            if (data.classIds.length > 0) {
                await tx.insert(courseClassMapping).values(
                    data.classIds.map((classId) => ({
                        course_id: courseId!,
                        class_id: classId,
                    }))
                );
            }
        }
        
        if (isNew) {
            analyticsService.incrementMetric('total_courses').catch(() => {});
        }

        const updatedCourse = await tx.query.courses.findFirst({ where: eq(courses.id, courseId!) });
        await updateCourseTotals(courseId!, tx);

        return { 
            ...updatedCourse, 
            thumbnail: updatedCourse?.thumbnail_url, 
            published: updatedCourse?.is_published 
        };
    });
}

export async function deleteCourseAdmin(id: string) {
    const session = await requireSuperAdmin();
    const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
    if (!course) return;

    await db.update(courses).set({ deleted_at: new Date(), updated_at: new Date() }).where(eq(courses.id, id));

    if (session && course) {
        analyticsService.decrementMetric('total_courses').catch(() => {});
        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            action: 'delete',
            entityType: 'course',
            entityId: id,
            oldValues: course,
            metadata: {}
        });
        await redis.del(CACHE_KEY);
    }
}
