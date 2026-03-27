'use server';

import { db } from '@/lib/db';
import { 
    courses, lessons, enrollments, 
    courseClassMapping, auditLogs 
} from '@/db/schema';
import { eq, count, sql, and, desc, asc, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'cache:admin:courses';

export async function fetchAdminCourses(page: number = 0, limit: number = 50) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = Math.max(0, page) * safeLimit;

    // M-8: Optimized course fetch with enrollment counts via SQL and proper pagination
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
        enrolled_count: sql<number>`(SELECT count(*) FROM ${enrollments} WHERE ${enrollments.course_id} = ${courses.id})`
    })
    .from(courses)
    .where(isNull(courses.deleted_at))
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

export async function updateCourseTotals(courseId: string) {
    // Optimization: Calculate in DB without loading objects
    const stats = await db.select({
        count: count(),
        xp: sql<number>`sum(${lessons.xp_reward})`
    })
    .from(lessons)
    .where(and(eq(lessons.course_id, courseId), isNull(lessons.deleted_at)));

    const totalLessons = Number(stats[0].count);
    const totalXp = Number(stats[0].xp || 0);

    await db.update(courses)
        .set({ total_lessons: totalLessons, total_xp: totalXp, updated_at: new Date() })
        .where(eq(courses.id, courseId));
    
    await redis.del(CACHE_KEY);
    await redis.del('cache:admin:meta');
}

import { analyticsService } from '@/lib/services/analytics-service';

const courseSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().default(''),
    // Accept either field name used by the frontend
    thumbnail: z.string().optional(),
    thumbnail_url: z.string().optional(),
    published: z.boolean().optional(),
    is_published: z.boolean().optional(),
    all_classes: z.boolean().optional().default(false),
    classIds: z.array(z.string().uuid()).optional(),
    created_by: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
});

export async function saveCourseAdmin(courseData: unknown) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = courseSchema.parse(courseData);
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const thumbnailUrl = data.thumbnail ?? data.thumbnail_url ?? '';
    const isPublished = data.published ?? data.is_published ?? false;

    let courseId = data.id;
    let isNew = false;

    return await db.transaction(async (tx) => {
        if (courseId) {
            await tx.update(courses).set({
                title: data.title,
                slug,
                description: data.description,
                thumbnail_url: thumbnailUrl,
                is_published: isPublished,
                all_classes: data.all_classes ?? false,
                updated_at: new Date()
            }).where(eq(courses.id, courseId));
        } else {
            // M-1: Collision-resistant Slugs for Production scaling
            const existing = await tx.query.courses.findFirst({
                where: and(eq(courses.slug, slug), isNull(courses.deleted_at))
            });
            if (existing) {
                slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
            }

            const createdBy = data.created_by ?? data.userId ?? session.userId;
            if (!createdBy) throw new Error("Unauthorized: Cannot create course without user ID.");

            const [created] = await tx.insert(courses).values({
                title: data.title,
                slug,
                description: data.description,
                thumbnail_url: thumbnailUrl,
                is_published: isPublished,
                all_classes: data.all_classes ?? false,
                created_by: createdBy,
                total_lessons: 0,
                total_xp: 0,
            } as any).returning();
            courseId = created.id;
            isNew = true;
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

        // Internal call — we use tx-aware updates if this were refactored, 
        // but for now updateCourseTotals is standalone.
        // TODO: Move updateCourseTotals into a database trigger for perfect integrity.
        
        if (isNew) {
            analyticsService.incrementMetric('total_courses').catch(() => {});
        }

        const updatedCourse = await tx.query.courses.findFirst({ where: eq(courses.id, courseId!) });
        await updateCourseTotals(courseId!);

        return { 
            ...updatedCourse, 
            thumbnail: updatedCourse?.thumbnail_url, 
            published: updatedCourse?.is_published 
        };
    });
}

export async function deleteCourseAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
    await db.update(courses).set({ deleted_at: new Date(), updated_at: new Date() }).where(eq(courses.id, id));

    if (session && course) {
        analyticsService.decrementMetric('total_courses').catch(() => {});
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'delete',
            entity_type: 'course',
            entity_id: id,
            old_values: course
        } as any);
        await redis.del(CACHE_KEY);
    }
}
