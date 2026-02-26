'use server';

import { db } from '@/lib/db';
import { profiles, courses, lessons, progressTracking } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function getLessonsByCourse(courseId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_index)]
    });

    return courseLessons;
}

export async function saveVideoProgress(lessonId: string, position: number) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Try to find existing
    const existing = await db.query.progressTracking.findFirst({
        where: and(
            eq(progressTracking.user_id, session.userId),
            eq(progressTracking.lesson_id, lessonId)
        )
    });

    if (existing) {
        await db.update(progressTracking)
            .set({ last_position: position.toString(), status: existing.status === 'completed' ? 'completed' : 'locked', updated_at: new Date() })
            .where(and(eq(progressTracking.user_id, session.userId), eq(progressTracking.lesson_id, lessonId)));
    } else {
        await db.insert(progressTracking).values({
            user_id: session.userId,
            lesson_id: lessonId,
            last_position: position.toString(),
            status: 'locked'
        });
    }
}

export async function markLessonComplete(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const existing = await db.query.progressTracking.findFirst({
        where: and(
            eq(progressTracking.user_id, session.userId),
            eq(progressTracking.lesson_id, lessonId)
        )
    });

    if (existing) {
        await db.update(progressTracking)
            .set({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
            .where(and(eq(progressTracking.user_id, session.userId), eq(progressTracking.lesson_id, lessonId)));
    } else {
        await db.insert(progressTracking).values({
            user_id: session.userId,
            lesson_id: lessonId,
            status: 'completed',
            completed_at: new Date()
        });
    }
}
