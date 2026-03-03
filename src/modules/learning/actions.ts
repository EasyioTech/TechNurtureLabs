'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, courses, lessons, lessonProgress, enrollments, xpEvents } from '@/db/schema';
import { eq, and, inArray, asc, isNotNull } from 'drizzle-orm';

export async function getCourseDetailsData(courseId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
    });

    if (!course) throw new Error('Course not found');

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    let formattedLessons = courseLessons.map((l, i) => ({
        ...l,
        // Backward-compatible aliases
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
        xp_reward: l.xp_reward || 50,
        status: (i === 0 ? 'available' : 'locked') as 'locked' | 'available' | 'completed'
    }));

    // Enrolled count from enrollments table
    const enrollmentData = await db.select().from(enrollments).where(eq(enrollments.course_id, courseId));
    const enrolledCount = enrollmentData.length;

    if (courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id);
        const progressData = await db.select().from(lessonProgress).where(
            and(
                eq(lessonProgress.user_id, userId),
                inArray(lessonProgress.lesson_id, lessonIds)
            )
        );

        const progressMap = new Map(progressData.map(p => [p.lesson_id, p.completed_at ? 'completed' : 'in_progress']));

        let foundIncomplete = false;
        formattedLessons = courseLessons.map((l, i) => {
            const status = progressMap.get(l.id);
            let lessonStatus: 'locked' | 'available' | 'completed' = 'locked';

            if (status === 'completed') {
                lessonStatus = 'completed';
            } else if (!foundIncomplete) {
                lessonStatus = 'available';
                foundIncomplete = true;
            }

            return {
                ...l,
                sequence_index: l.sequence_order,
                duration: l.duration_minutes || 10,
                xp_reward: l.xp_reward || 50,
                status: lessonStatus
            };
        });
    }

    return {
        course: {
            ...course,
            thumbnail: course.thumbnail_url,
            published: course.is_published,
        },
        lessons: formattedLessons,
        enrolledCount
    };
}

export async function getCourseJourneyData(courseId: string) {
    return await getCourseDetailsData(courseId);
}

export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId)
    });

    if (!lesson) return null;

    return {
        ...lesson,
        sequence_index: lesson.sequence_order,
        duration: lesson.duration_minutes || 10,
    };
}

export async function completeLessonAndReward(lessonId: string, quizScore?: number, isPerfect?: boolean) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!existingUser) return;

    // Find enrollment for this lesson's course
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    if (!lesson) return;

    const enrollment = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.user_id, userId), eq(enrollments.course_id, lesson.course_id))
    });
    if (!enrollment) return;

    // Check if already completed
    const existingProgress = await db.select().from(lessonProgress).where(
        and(
            eq(lessonProgress.user_id, userId),
            eq(lessonProgress.lesson_id, lessonId),
            isNotNull(lessonProgress.completed_at)
        )
    );

    if (existingProgress.length > 0) return;

    // Upsert lesson progress
    const existing = await db.select().from(lessonProgress).where(
        and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
    );

    if (existing.length > 0) {
        await db.update(lessonProgress).set({
            completed_at: new Date(),
            progress_pct: '100',
            xp_earned: lesson.xp_reward || 50,
        }).where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId)));
    } else {
        await db.insert(lessonProgress).values({
            user_id: userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            completed_at: new Date(),
            progress_pct: '100',
            xp_earned: lesson.xp_reward || 50,
        });
    }

    const xpToAdd = lesson.xp_reward || 50;

    // Record XP event
    if (existingUser.school_id) {
        await db.insert(xpEvents).values({
            user_id: userId,
            school_id: existingUser.school_id,
            source: 'lesson_completion',
            xp_amount: xpToAdd,
            reference_type: 'lesson',
            reference_id: lessonId,
        });
    }

    // Update cumulative XP on user
    let newXp = (Number(existingUser.cumulative_xp) || 0) + xpToAdd;

    await db.update(users).set({
        cumulative_xp: newXp,
    }).where(eq(users.id, userId));
}

export async function getLessonsByCourse(courseId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    return courseLessons.map(l => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
    }));
}

export async function saveVideoProgress(lessonId: string, position: number) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const existing = await db.select().from(lessonProgress).where(
        and(
            eq(lessonProgress.user_id, session.userId),
            eq(lessonProgress.lesson_id, lessonId)
        )
    );

    if (existing.length > 0) {
        await db.update(lessonProgress)
            .set({ progress_pct: position.toString(), time_spent_secs: Math.round(position) })
            .where(and(eq(lessonProgress.user_id, session.userId), eq(lessonProgress.lesson_id, lessonId)));
    } else {
        // Need enrollment to create progress
        const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
        if (!lesson) return;

        const enrollment = await db.query.enrollments.findFirst({
            where: and(eq(enrollments.user_id, session.userId), eq(enrollments.course_id, lesson.course_id))
        });
        if (!enrollment) return;

        await db.insert(lessonProgress).values({
            user_id: session.userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            progress_pct: position.toString(),
        });
    }
}

export async function markLessonComplete(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const existing = await db.select().from(lessonProgress).where(
        and(
            eq(lessonProgress.user_id, session.userId),
            eq(lessonProgress.lesson_id, lessonId)
        )
    );

    if (existing.length > 0) {
        await db.update(lessonProgress)
            .set({ completed_at: new Date(), progress_pct: '100' })
            .where(and(eq(lessonProgress.user_id, session.userId), eq(lessonProgress.lesson_id, lessonId)));
    } else {
        const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
        if (!lesson) return;

        const enrollment = await db.query.enrollments.findFirst({
            where: and(eq(enrollments.user_id, session.userId), eq(enrollments.course_id, lesson.course_id))
        });
        if (!enrollment) return;

        await db.insert(lessonProgress).values({
            user_id: session.userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            completed_at: new Date(),
            progress_pct: '100',
        });
    }
}
