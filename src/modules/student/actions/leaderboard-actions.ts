'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords, quizAttempts, lessonProgress, quizzes, lessons, courses, schoolClassMapping, courseClassMapping } from '@/db/schema';
import { eq, and, desc, inArray, sql, isNotNull, isNull, count, sum } from 'drizzle-orm';
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
        // SECURITY: Fetch userStats fresh — never serve from shared cache
        const { getStudentProfileData } = await import('@/modules/student/actions/profile-actions');
        const profileData = await getStudentProfileData();
        return {
            scope,
            data: JSON.parse(cached),
            title: scope === 'class' ? 'Class Leaderboard' : 'School Leaderboard',
            userStats: profileData.stats,
            cached: true
        };
    }

    // 2. Query DB with joins for stats
    // We fetch top students in the scope
    let query;
    if (scope === 'class') {
        const classStudentIds = await db.select({ id: studentAcademicRecords.user_id })
            .from(studentAcademicRecords)
            .where(and(
                eq(studentAcademicRecords.class_id, classId as string),
                eq(studentAcademicRecords.school_id, schoolId as string)
            ));

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

    // CRITICAL FIX #7: Get school's valid course IDs via class mappings
    // (courses are scoped to schools via schoolClassMapping → courseClassMapping)
    let scopedCourseIds: string[] = [];
    if (scope === 'school' && schoolId) {
        const schoolClassIds = await db.select({ class_id: schoolClassMapping.class_id })
            .from(schoolClassMapping)
            .where(eq(schoolClassMapping.school_id, schoolId))
            .then(results => results.map(r => r.class_id));

        if (schoolClassIds.length > 0) {
            const mappings = await db.select({ course_id: courseClassMapping.course_id })
                .from(courseClassMapping)
                .where(inArray(courseClassMapping.class_id, schoolClassIds));
            scopedCourseIds = Array.from(new Set(mappings.map(m => m.course_id)));
        }
    }

    // Fetch accuracy and progress stats in parallel using Drizzle query builder
    // CRITICAL FIX #7: Verify quizzes and lessons belong to school-scoped courses
    const [accuracyStats, progressStats] = await Promise.all([
        // Accuracy: avg quiz score, but ONLY for quizzes in this school's courses
        scopedCourseIds.length > 0 ?
        db.select({
            user_id: quizAttempts.user_id,
            avg_accuracy: sql<number>`AVG(${quizAttempts.score}::float / NULLIF(${quizAttempts.max_score}::float, 0) * 100)`
        })
        .from(quizAttempts)
        .innerJoin(quizzes, eq(quizAttempts.quiz_id, quizzes.id))
        .innerJoin(lessons, eq(quizzes.lesson_id, lessons.id))
        .where(and(
            inArray(quizAttempts.user_id, leaderIds),
            inArray(lessons.course_id, scopedCourseIds)
        ))
        .groupBy(quizAttempts.user_id)
        : Promise.resolve([]),

        // Progress: lessons completed, but ONLY for lessons in this school's courses
        scopedCourseIds.length > 0 ?
        db.select({
            user_id: lessonProgress.user_id,
            lessons_completed: count(),
            total_time: sum(lessonProgress.time_spent_secs)
        })
        .from(lessonProgress)
        .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
        .where(and(
            inArray(lessonProgress.user_id, leaderIds),
            inArray(lessons.course_id, scopedCourseIds),
            isNotNull(lessonProgress.completed_at)
        ))
        .groupBy(lessonProgress.user_id)
        : Promise.resolve([])
    ]);

    const accuracyMap = new Map<string, number>(
        accuracyStats.map(r => [String(r.user_id), Number(r.avg_accuracy) || 0])
    );
    const progressMap = new Map<string, { count: number, time: number }>(
        progressStats.map(r => [String(r.user_id), {
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
            accuracy: accuracy,
            efficiency: efficiency,
            isCurrentUser: u.id === userId
        };
    });

    // 4. Cache only the shared leaderboard data (NOT userStats)
    const sharedData = {
        scope,
        data: finalData,
        title: scope === 'class' ? 'Class Leaderboard' : 'School Leaderboard'
    };

    if (finalData.length > 0) {
        try { await redis.set(cacheKey, JSON.stringify(sharedData), 'EX', 600); } catch (_) { /* non-critical */ }
    }

    // 5. Fetch user profile stats AFTER cache write — never stored in shared cache
    const { getStudentProfileData } = await import('@/modules/student/actions/profile-actions');
    const profileData = await getStudentProfileData();

    return {
        ...sharedData,
        userStats: profileData.stats
    };
}
