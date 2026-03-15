'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords } from '@/db/schema';
import { eq, and, desc, inArray, sql, isNotNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';

import { leaderboardService } from '@/lib/services/leaderboard-service';

const LEADERBOARD_CACHE_TTL = 3600; // 1 hour for sync logic

export async function getStudentLeaderboard(scope: 'school' | 'class') {
    const session = await verifySession();
    if (!session) {
        redirect('/login');
    }
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

    if (!currentUser) {
        console.warn(`Leaderboard access attempt by missing/deleted student: ${userId}`);
        redirect('/login');
    }

    const schoolId = currentUser.school_id;
    const finalScope = schoolId ? 'school' : 'global';

    // 1. High-level Serialized Cache Check
    const cachedLeaderboard = await leaderboardService.getCachedLeaderboard(finalScope, schoolId);
    if (cachedLeaderboard) {
        return {
            scope: finalScope,
            data: cachedLeaderboard,
            title: schoolId ? 'Institution Leaderboard' : 'Global Leaderboard',
            cached: true
        };
    }

    const cacheKey = schoolId ? `lb:school:${schoolId}` : `lb:global`;

    // 2. Fallback to Redis ZSET
    let topUserIdsWithScores: string[] = [];
    try {
        const countRes = await redis.zcard(cacheKey);
        if (countRes === 0) {
            // Lazy sync: If Redis is empty, sync from DB
            const allInScope = await db.query.students.findMany({
                where: and(
                    schoolId ? eq(students.school_id, schoolId) : undefined,
                    sql`${students.deleted_at} IS NULL`
                ),
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

    let finalData = [];

    // 3. Fetch metadata from SQL for the top IDs
    if (topUserIdsWithScores.length > 0) {
        const dbStudents = await db.query.students.findMany({
            where: and(
                inArray(students.id, topUserIdsWithScores),
                sql`${students.deleted_at} IS NULL`
            )
        });

        // Re-sort to match Redis order (by XP desc)
        const mapped = dbStudents.map(s => {
            const xp = Number(s.cumulative_xp) || 0;
            return {
                ...s,
                cumulative_xp: xp
            };
        }).sort((a, b) => b.cumulative_xp - a.cumulative_xp);

        finalData = serializeLeaderboard(mapped, userId);
    } else {
        // Fallback to legacy SQL if Redis fails
        const fallbackStudents = await db.query.students.findMany({
            where: and(
                schoolId ? eq(students.school_id, schoolId) : undefined,
                sql`${students.deleted_at} IS NULL`
            ),
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });
        finalData = serializeLeaderboard(fallbackStudents, userId);
    }

    // 4. Update High-level Serialized Cache
    if (finalData.length > 0) {
        leaderboardService.setCachedLeaderboard(finalScope, finalData, schoolId).catch(() => {});
    }

    return {
        scope: finalScope,
        data: finalData,
        title: schoolId ? 'Institution Leaderboard' : 'Global Leaderboard'
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
