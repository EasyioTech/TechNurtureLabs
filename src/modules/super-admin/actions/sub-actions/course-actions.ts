'use server';

import { db } from '@/lib/db';
import { 
    courses, lessons, enrollments, 
    courseClassMapping, auditLogs 
} from '@/db/schema';
import { eq, count, sql, and, desc, asc, inArray } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'cache:admin:courses';

export async function fetchAdminCourses() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    // Optimized course fetch with enrollment counts via SQL
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
    .orderBy(desc(courses.created_at));

    return coursesData.map(c => ({
        ...c,
        thumbnail: c.thumbnail_url,
        published: c.is_published,
        enrolled_count: Number(c.enrolled_count || 0),
    }));
}

export async function updateCourseTotals(courseId: string) {
    // Optimization: Calculate in DB without loading objects
    const stats = await db.select({
        count: count(),
        xp: sql<number>`sum(${lessons.xp_reward})`
    })
    .from(lessons)
    .where(eq(lessons.course_id, courseId));

    const totalLessons = Number(stats[0].count);
    const totalXp = Number(stats[0].xp || 0);

    await db.update(courses)
        .set({ total_lessons: totalLessons, total_xp: totalXp, updated_at: new Date() })
        .where(eq(courses.id, courseId));
    
    await redis.del(CACHE_KEY);
    await redis.del('cache:admin:meta');
}

export async function saveCourseAdmin(courseData: any) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let courseId = courseData.id;

    if (courseId) {
        await db.update(courses).set({
            title: courseData.title,
            slug: slug,
            description: courseData.description || '',
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url || '',
            is_published: courseData.published ?? courseData.is_published ?? false,
            all_classes: courseData.all_classes ?? false,
            updated_at: new Date()
        }).where(eq(courses.id, courseId));
    } else {
        const createdBy = courseData.created_by || courseData.userId || session?.userId;
        if (!createdBy) throw new Error("Unauthorized: Cannot create course without user ID.");

        const [created] = await db.insert(courses).values({
            title: courseData.title,
            slug: slug,
            description: courseData.description || '',
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url || '',
            is_published: courseData.published ?? courseData.is_published ?? false,
            all_classes: courseData.all_classes ?? false,
            created_by: createdBy,
            total_lessons: 0,
            total_xp: 0,
        } as any).returning();
        courseId = created.id;
    }

    if (courseData.classIds && Array.isArray(courseData.classIds)) {
        await db.delete(courseClassMapping).where(eq(courseClassMapping.course_id, courseId));
        if (courseData.classIds.length > 0) {
            await db.insert(courseClassMapping).values(
                courseData.classIds.map((classId: string) => ({
                    course_id: courseId,
                    class_id: classId
                }))
            );
        }
    }

    await updateCourseTotals(courseId);
    
    const updatedCourse = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    return { ...updatedCourse, thumbnail: updatedCourse?.thumbnail_url, published: updatedCourse?.is_published };
}

export async function deleteCourseAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
    await db.delete(courses).where(eq(courses.id, id));
    
    if (session && course) {
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
