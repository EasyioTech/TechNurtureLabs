'use server';

import { db } from '@/lib/db';
import { students } from '@/db/schema';
import { desc, count, sql, and, isNull } from 'drizzle-orm';
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

    const [data, totalCount] = await Promise.all([
        db.query.students.findMany({
            where: and(...filters),
            orderBy: [desc(students.created_at)],
            limit,
            offset: page * limit
        }),
        db.select({ count: count() }).from(students).where(and(...filters))
    ]);

    const total = Number(totalCount[0].count);

    return {
        students: data.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
            level: Math.floor((Number(s.cumulative_xp) || 0) / 500) + 1,
        })),
        total,
        pages: Math.ceil(total / limit)
    };
}

export async function invalidateAdminCache() {
    const keys = ['cache:admin:stats', 'cache:admin:schools', 'cache:admin:courses', 'cache:admin:meta'];
    await redis.del(...keys);
}
