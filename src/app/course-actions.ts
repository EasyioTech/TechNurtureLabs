'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { profiles, courses, lessons, progressTracking, dailyChallenges, userDailyChallenges, achievements, userAchievements } from '@/db/schema';
import { eq, and, gt, inArray, lte } from 'drizzle-orm';

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
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_index)]
    });

    let formattedLessons = courseLessons.map((l, i) => ({
        ...l,
        xp_reward: l.xp_reward || 50,
        status: (i === 0 ? 'available' : 'locked') as 'locked' | 'available' | 'completed'
    }));

    const enrolledCountData = await db.select({ user_id: progressTracking.user_id }).from(progressTracking).where(inArray(progressTracking.lesson_id, courseLessons.map(l => l.id)));
    const uniqueUsers = new Set(enrolledCountData.map(d => d.user_id));
    const enrolledCount = uniqueUsers.size;

    if (courseLessons.length > 0) {
        const progressData = await db.query.progressTracking.findMany({
            where: and(
                eq(progressTracking.user_id, userId),
                inArray(progressTracking.lesson_id, courseLessons.map(l => l.id))
            )
        });

        const progressMap = new Map(progressData.map(p => [p.lesson_id, p.status]));

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
                xp_reward: l.xp_reward || 50,
                status: lessonStatus
            };
        });
    }

    return { course, lessons: formattedLessons, enrolledCount };
}

export async function getCourseJourneyData(courseId: string) {
    return await getCourseDetailsData(courseId); // Logic is identical for journey vs course details
}

export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId)
    });
    return lesson;
}

export async function completeLessonAndReward(lessonId: string, quizScore?: number, isPerfect?: boolean) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
    if (!existingProfile) return;

    const existingProgress = await db.query.progressTracking.findFirst({
        where: and(
            eq(progressTracking.user_id, userId),
            eq(progressTracking.lesson_id, lessonId),
            eq(progressTracking.status, 'completed')
        )
    });

    if (existingProgress) return;

    await db.insert(progressTracking).values({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date()
    }).onConflictDoUpdate({
        target: [progressTracking.user_id, progressTracking.lesson_id],
        set: { status: 'completed', completed_at: new Date() }
    });

    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    const xpToAdd = lesson?.xp_reward || 50;

    let newLessonsCompleted = (existingProfile.total_lessons_completed || 0) + 1;
    let newXp = (existingProfile.total_xp || 0) + xpToAdd;

    const today = new Date().toISOString().split('T')[0];

    const lessonChallenges = await db.query.dailyChallenges.findMany({
        where: and(eq(dailyChallenges.is_active, true), eq(dailyChallenges.challenge_type, 'lessons_completed'))
    });

    for (const challenge of lessonChallenges) {
        const userChallenge = await db.query.userDailyChallenges.findFirst({
            where: and(
                eq(userDailyChallenges.user_id, userId),
                eq(userDailyChallenges.challenge_id, challenge.id),
                eq(userDailyChallenges.challenge_date, today)
            )
        });

        if (userChallenge?.is_completed) continue;

        const newProgress = (userChallenge?.current_progress || 0) + 1;
        const isNowComplete = newProgress >= challenge.target_value;

        await db.insert(userDailyChallenges).values({
            user_id: userId,
            challenge_id: challenge.id,
            challenge_date: today,
            current_progress: newProgress,
            is_completed: isNowComplete,
            updated_at: new Date()
        }).onConflictDoUpdate({
            target: [userDailyChallenges.user_id, userDailyChallenges.challenge_id, userDailyChallenges.challenge_date],
            set: { current_progress: newProgress, is_completed: isNowComplete, updated_at: new Date() }
        });

        if (isNowComplete) {
            newXp += challenge.xp_reward;
        }
    }

    // Similar logic for quizzes
    if (quizScore !== undefined) {
        // simplified for brevity: grant XP straight if quiz is completed
        const scorePrcnt = quizScore;
        if (scorePrcnt >= 80) {
            // you could grant 80% score challenges here
        }
    }

    await db.update(profiles).set({
        total_xp: newXp,
        total_lessons_completed: newLessonsCompleted
    }).where(eq(profiles.id, userId));
}
