'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords } from '@/db/schema';
import { eq, and, desc, inArray, sql, isNotNull, isNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';

import { leaderboardService } from '@/lib/services/leaderboard-service';

const LEADERBOARD_CACHE_TTL = 3600; // 1 hour for sync logic

export async function getStudentLeaderboard(scope: 'school' | 'class') {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }
    const userId = session.userId;

    const profile = await db.query.students.findFirst({
        where: eq(students.id, userId),
        columns: { school_id: true }
    });

    const currentUserRecord = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, userId),
    });

    const schoolId = profile?.school_id || currentUserRecord?.school_id;
    const classId = currentUserRecord?.class_id;

    if (!schoolId && scope === 'school') {
        return { scope, data: [], title: 'School Leaderboard' };
    }
    if (!classId && scope === 'class') {
        return { scope, data: [], title: 'Class Leaderboard' };
    }

    const finalScopeKey = scope === 'class' ? `lb:class:${classId}` : `lb:school:${schoolId}`;
    const cacheKey = `lb:cache:${finalScopeKey}`;

    // 1. Try Cache
    let cached: string | null = null;
    try { cached = await redis.get(cacheKey); } catch (_) { /* Redis unavailable — will query DB */ }
    if (cached) {
        return {
            scope,
            data: JSON.parse(cached),
            title: scope === 'class' ? 'Class Leaderboard' : 'School Leaderboard',
            cached: true
        };
    }

    // 2. Query DB with joins for stats
    // We fetch top students in the scope
    let query;
    if (scope === 'class') {
        const classStudentIds = await db.select({ id: studentAcademicRecords.user_id })
            .from(studentAcademicRecords)
            .where(eq(studentAcademicRecords.class_id, classId as string));
        
        const ids = classStudentIds.map(s => s.id);
        if (ids.length === 0) return { scope, data: [], title: 'Class Leaderboard' };

        query = db.query.students.findMany({
            where: and(
                inArray(students.id, ids),
                isNull(students.deleted_at)
            ),
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });
    } else {
        query = db.query.students.findMany({
            where: and(
                eq(students.school_id, schoolId as string),
                isNull(students.deleted_at)
            ),
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });
    }

    const leaders = await query;

    // 3. For these top students, fetch accuracy and efficiency
    // Accuracy: avg score from quiz attempts
    // Efficiency: XP / (days since created or active days) - simplified to XP / (1 + lessons completed)
    const leaderIds = leaders.map(l => l.id);

    if (leaderIds.length === 0) {
        return { scope, data: [], title: scope === 'class' ? 'Class Leaderboard' : 'School Leaderboard' };
    }

    // Fetch accuracy stats
    const accuracyStats = await db.execute(sql`
        SELECT user_id, AVG(score / NULLIF(max_score, 0) * 100) as avg_accuracy
        FROM quiz_attempts
        WHERE user_id = ANY(${leaderIds}) 
        GROUP BY user_id
    `);

    // Fetch lessons completed for efficiency
    const progressStats = await db.execute(sql`
        SELECT user_id, COUNT(*) as lessons_completed, SUM(time_spent_secs) as total_time
        FROM lesson_progress
        WHERE user_id = ANY(${leaderIds}) AND completed_at IS NOT NULL
        GROUP BY user_id
    `);

    const accuracyMap = new Map<string, number>(
        (accuracyStats as any[]).map((r: any) => [String(r.user_id), Number(r.avg_accuracy) || 0])
    );
    const progressMap = new Map<string, { count: number, time: number }>(
        (progressStats as any[]).map((r: any) => [String(r.user_id), { 
            count: Number(r.lessons_completed) || 0,
            time: Number(r.total_time) || 0
        }])
    );

    const finalData = leaders.map((u, i) => {
        const userIdStr = String(u.id);
        const accuracy = Math.round(accuracyMap.get(userIdStr) ?? 0);
        const prog = progressMap.get(userIdStr) ?? { count: 0, time: 0 };
        
        // Efficiency calculation: XP per lesson completed (weighted)
        const xpNum = Number(u.cumulative_xp) || 0;
        const efficiency = prog.count > 0 ? Math.min(100, Math.round((xpNum / (prog.count * 50)) * 100)) : 0;

        return {
            rank: i + 1,
            id: u.id,
            full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student',
            initials: (u.first_name?.[0] || 'S') + (u.last_name?.[0] || ''),
            xp: xpNum,
            level: Math.floor(xpNum / 1000) + 1,
            accuracy: accuracy || 85, // Default/Fallback if no quizzes
            efficiency: efficiency || 75, // Default/Fallback
            isCurrentUser: u.id === userId
        };
    });

    // 4. Cache and Return
    const result = {
        scope,
        data: finalData,
        title: scope === 'class' ? 'Class Leaderboard' : 'School Leaderboard'
    };
    try { await redis.set(cacheKey, JSON.stringify(result), 'EX', 600); } catch (_) { /* non-critical */ }

    // 5. Add non-cached current user stats for UI sidebars
    const { getStudentProfileData } = await import('@/modules/student/actions/profile-actions');
    const profileData = await getStudentProfileData();

    return {
        ...result,
        userStats: profileData.stats
    };
}
