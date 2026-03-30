import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { finalizeAndCompleteLesson } from '@/lib/services/learning-session';
import { cacheService } from '@/lib/cache';
import { db } from '@/lib/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handles the final completion of a lesson.
 * Enforces verified time spent and 75% progress threshold.
 *
 * CRITICAL FIX #4: Cache invalidation on lesson completion
 * Invalidates user progress, leaderboard, achievements, and XP caches
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId, sessionToken } = await req.json();

        if (!lessonId || !sessionToken) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await finalizeAndCompleteLesson(lessonId, sessionToken);

        if (result.error) {
            return NextResponse.json({
                error: result.error,
                code: result.code
            }, { status: 403 });
        }

        // CRITICAL FIX #4: Invalidate all affected caches after successful completion
        // This ensures leaderboard, progress, and achievement data are fresh
        const userId = session.userId;
        try {
            // Get lesson details to find course_id for cache invalidation
            const lesson = await db.query.lessons.findFirst({
                where: eq(lessons.id, lessonId)
            });

            if (lesson) {
                // 1. Invalidate user progress (lesson completion changed it)
                await cacheService.invalidateTag(`user:${userId}:progress`);

                // 2. Invalidate leaderboard (XP earned changed rank)
                await cacheService.invalidateTag(`user:${userId}:leaderboard`);
                await cacheService.invalidateTag(`course:${lesson.course_id}:leaderboard`);

                // 3. Invalidate achievements (lesson might unlock new badge)
                await cacheService.invalidateTag(`user:${userId}:achievements`);

                // 4. Invalidate XP total
                await cacheService.invalidateTag(`user:${userId}:xp`);

                // 5. Invalidate user stats
                await cacheService.invalidateTag(`user:${userId}:stats`);

                // 6. Invalidate dashboard
                await cacheService.invalidateTag(`user:${userId}:dashboard`);
            }
        } catch (cacheErr) {
            // Non-critical: Cache invalidation failure doesn't block completion
            console.warn('[Learning Complete] Cache invalidation error:', (cacheErr as any).message);
        }

        return NextResponse.json({ success: true, message: 'Lesson marked complete' });
    } catch (error: any) {
        console.error('[Learning Complete Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
