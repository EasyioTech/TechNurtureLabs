'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords } from '@/db/schema';
import { eq, and, desc, inArray, sql, isNotNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';

const LEADERBOARD_CACHE_TTL = 3600; // 1 hour for sync logic

export async function getStudentLeaderboard(scope: 'school' | 'class') {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    if (session.role !== 'student') {
        throw new Error('Access denied: Student access only');
    }

    const currentUser = await db.query.students.findFirst({
        where: and(eq(students.id, userId), sql`${students.deleted_at} IS NULL`),
        with: {
            academicRecords: {
                with: { academicClass: true },
                limit: 1,
            }
        }
    });

    if (!currentUser) throw new Error('Student profile not found');

    const schoolId = currentUser.school_id;
    const cacheKey = schoolId ? `lb:school:${schoolId}` : `lb:global`;

    // 1. Check if Redis has data for this scope
    let topUserIdsWithScores: string[] = [];
    try {
        const count = await redis.zcard(cacheKey);
        if (count === 0) {
            // Lazy sync: If Redis is empty, sync from DB
            const allInScope = await db.query.students.findMany({
                where: schoolId ? eq(students.school_id, schoolId) : undefined,
                orderBy: [desc(students.cumulative_xp)],
                limit: 1000 // Only sync top 1000
            });
            if (allInScope.length > 0) {
                const pipeline = redis.pipeline();
                allInScope.forEach(s => {
                    pipeline.zadd(cacheKey, Number(s.cumulative_xp) || 0, s.id);
                });
                await pipeline.exec();
            }
        }
        // Get top 50
        topUserIdsWithScores = await redis.zrevrange(cacheKey, 0, 49);
    } catch (err) {
        console.error("Redis leaderboard error:", err);
    }

    // 2. Fetch metadata from SQL for the top IDs
    if (topUserIdsWithScores.length > 0) {
        const dbStudents = await db.query.students.findMany({
            where: inArray(students.id, topUserIdsWithScores)
        });

        // Re-sort to match Redis order (by XP desc)
        const mapped = dbStudents.map(s => {
            const xp = Number(s.cumulative_xp) || 0;
            return {
                ...s,
                cumulative_xp: xp
            };
        }).sort((a, b) => b.cumulative_xp - a.cumulative_xp);

        return {
            scope: schoolId ? 'school' : 'global',
            data: serializeLeaderboard(mapped, userId),
            title: schoolId ? 'Institution Leaderboard' : 'Global Leaderboard'
        };
    }

    // Fallback to legacy SQL if Redis fails
    const fallbackStudents = await db.query.students.findMany({
        where: schoolId ? eq(students.school_id, schoolId) : undefined,
        orderBy: [desc(students.cumulative_xp)],
        limit: 50
    });
    return {
        scope: schoolId ? 'school' : 'global',
        data: serializeLeaderboard(fallbackStudents, userId),
        title: schoolId ? 'Institution Leaderboard (SQL)' : 'Global Leaderboard'
    };
}

function serializeLeaderboard(usersList: any[], currentUserId: string) {
    return usersList.map((u, i) => ({
        rank: i + 1,
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student',
        initials: (u.first_name?.[0] || 'S') + (u.last_name?.[0] || ''),
        xp: Number(u.cumulative_xp) || 0,
        level: Math.floor((Number(u.cumulative_xp) || 0) / 1000) + 1,
        isCurrentUser: u.id === currentUserId
    }));
}
