import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { finalizeAndCompleteLesson } from '@/lib/services/learning-session';
import { cacheService } from '@/lib/cache';
import { db } from '@/lib/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Handles the final completion of a lesson.
 * Enforces verified time spent and 75% progress threshold.
 *
 * CRITICAL FIX #4: Cache invalidation on lesson completion
 * Invalidates user progress, leaderboard, achievements, and XP caches
 */
const completeSchema = z.object({
    lessonId: z.string().uuid('Invalid lesson ID'),
    sessionToken: z.string().min(1, 'Session token is required')
});

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = completeSchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json(
                { error: body.error.issues[0]?.message ?? 'Invalid request' },
                { status: 400 }
            );
        }

        const { lessonId, sessionToken } = body.data;
        const result = await finalizeAndCompleteLesson(lessonId, sessionToken);

        if (result.error) {
            return NextResponse.json({
                error: result.error,
                code: result.code
            }, { status: 403 });
        }

        // CRITICAL FIX #4: Invalidate all affected caches after successful completion
        // This ensures leaderboard, progress, and achievement data are fresh across all views
        const userId = session.userId;
        try {
            // Get lesson details to find course_id for cache invalidation
            const lesson = await db.query.lessons.findFirst({
                where: eq(lessons.id, lessonId),
                columns: { course_id: true }
            });

            if (lesson) {
                // 1. Invalidate user progress (lesson completion changed it)
                await cacheService.invalidateTag(`user:${userId}:progress`);

                // 2. Invalidate leaderboards at multiple levels (user, course)
                // XP earned changes rank in all contexts
                await cacheService.invalidateTag(`user:${userId}:leaderboard`);
                await cacheService.invalidateTag(`course:${lesson.course_id}:leaderboard`);

                // 3. Invalidate achievements (lesson might unlock new badge)
                await cacheService.invalidateTag(`user:${userId}:achievements`);

                // 4. Invalidate XP total
                await cacheService.invalidateTag(`user:${userId}:xp`);

                // 5. Invalidate user stats and analytics
                await cacheService.invalidateTag(`user:${userId}:stats`);

                // 6. Invalidate dashboard and learning summary
                await cacheService.invalidateTag(`user:${userId}:dashboard`);
                await cacheService.invalidateTag(`user:${userId}:learning-summary`);

                // 7. Invalidate course progress cache
                await cacheService.invalidateTag(`course:${lesson.course_id}:progress`);
            }
        } catch (cacheErr) {
            // Non-critical: Cache invalidation failure doesn't block completion
            console.warn('[Learning Complete] Cache invalidation error:', (cacheErr as any).message);
        }

        return NextResponse.json({ success: true, message: 'Lesson marked complete' });
    } catch (error: any) {
        // Log only in development to avoid information leakage
        if (process.env.NODE_ENV === 'development') {
            console.error('[Learning Complete Error]:', error);
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
