'use server';

import { db } from '@/lib/db';
import { students, schools, lessonProgress } from '@/db/schema';
import { desc, count, sql, and, isNull, eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';

export async function fetchAdminStudents(page: number = 0, limit: number = 25, search?: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const filters = [isNull(students.deleted_at)];
    if (search) {
        filters.push(sql`(${students.first_name} ILIKE ${'%' + search + '%'} OR ${students.last_name} ILIKE ${'%' + search + '%'} OR ${students.email} ILIKE ${'%' + search + '%'})`);
    }

    const whereClause = and(...filters);

    const [data, totalCount] = await Promise.all([
        db.select({
            id: students.id,
            first_name: students.first_name,
            last_name: students.last_name,
            email: students.email,
            cumulative_xp: students.cumulative_xp,
            current_streak: students.current_streak,
            longest_streak: students.longest_streak,
            last_active_at: students.last_active_at,
            created_at: students.created_at,
            school_name: schools.name,
            lessons_completed: sql<number>`(SELECT count(*) FROM "lesson_progress" WHERE "lesson_progress"."user_id" = "students"."id" AND "lesson_progress"."completed_at" IS NOT NULL)`,
        })
        .from(students)
        .leftJoin(schools, eq(students.school_id, schools.id))
        .where(whereClause)
        .orderBy(desc(students.created_at))
        .limit(limit)
        .offset(page * limit),

        db.select({ count: count() }).from(students).where(whereClause)
    ]);

    const total = Number(totalCount[0].count);

    return {
        students: data.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
            level: Math.floor((Number(s.cumulative_xp) || 0) / 500) + 1,
            school_name: s.school_name ?? 'Unknown',
            lessons_completed: Number(s.lessons_completed || 0),
        })),
        total,
        pages: Math.ceil(total / limit)
    };
}

export async function invalidateAdminCache() {
    const keys = ['cache:admin:stats', 'cache:admin:schools', 'cache:admin:courses', 'cache:admin:meta'];
    await redis.del(...keys);
}
