'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { 
    students, schoolAdmins, superAdmins, lessons, lessonProgress, 
    quizzes, quizQuestions, auditLogs, lessonSubmissions, xpEvents, enrollments 
} from '@/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';
import { awardXP, incrementProgressCounter, handleStudentEngagement } from '@/lib/gamification';
import { redis } from '@/lib/redis';
import { ensureEnrollment, invalidateStudentDashboardCache } from './course-actions';

/**
 * Fetch detailed lesson data including quiz and user progress
 */
export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId)
    });

    if (!lesson) return null;

    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return null;

    const progress = await db.query.lessonProgress.findFirst({
        where: and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
    });

    let isQuizLocked = false;
    let lockReason = "";

    if (lesson.content_type === 'video') {
        const threshold = (lesson.duration_minutes || 0) * 60 * 0.75;
        const watched = progress?.verified_watch_seconds || 0;
        if (watched < threshold && !progress?.completed_at) {
            isQuizLocked = true;
            lockReason = `Please watch at least 75% of the video to unlock the assessment. (${Math.round(watched/60)}m / ${Math.round(threshold/60)}m watched)`;
        }
    }

    let quizData: any = null;
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.lesson_id, lessonId),
    });
    
    if (quiz) {
        const questions = await db.query.quizQuestions.findMany({
            where: eq(quizQuestions.quiz_id, quiz.id),
            orderBy: [asc(quizQuestions.sequence_order)]
        });
        quizData = {
            quiz: {
                id: quiz.id,
                title: quiz.title,
                time_limit_secs: quiz.time_limit_secs,
                pass_percentage: Number(quiz.pass_percentage),
                max_attempts: quiz.max_attempts,
                xp_reward: quiz.xp_reward,
                is_locked: isQuizLocked,
                lock_reason: lockReason
            },
            questions: isQuizLocked ? [] : questions.map(q => ({
                id: q.id,
                text: q.question_text,
                question_type: q.question_type,
                options: Array.isArray(q.options) ? q.options : [],
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                points: q.points,
                time_limit_secs: q.time_limit_secs,
            }))
        };
    }

    return {
        ...lesson,
        sequence_index: lesson.sequence_order,
        duration: lesson.duration_minutes || 10,
        quiz_data: quizData,
        user_progress: progress ? {
            completed_at: progress.completed_at,
            progress_pct: Number(progress.progress_pct) || 0,
            last_position_secs: progress.last_position_secs || 0,
            verified_watch_seconds: progress.verified_watch_seconds
        } : null
    };
}

/**
 * Handle lesson completion and reward logic
 */
export async function completeLessonAndReward(lessonId: string, quizScore?: number, isPerfect?: boolean) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;
    const role = session.userType;

    let existingUser: any = null;
    if (role === 'student') {
        existingUser = await db.query.students.findFirst({ where: eq(students.id, userId) });
    } else if (role === 'school_admin') {
        existingUser = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, userId) });
    } else {
        existingUser = await db.query.superAdmins.findFirst({ where: eq(superAdmins.id, userId) });
    }
    if (!existingUser) return { success: false, error: 'User not found' };

    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    if (!lesson) return { success: false, error: 'Lesson not found' };

    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return { success: false, error: 'Enrollment failed' };

    const existingProgress = await db.query.lessonProgress.findFirst({
        where: and(
            eq(lessonProgress.user_id, userId),
            eq(lessonProgress.lesson_id, lessonId),
            isNotNull(lessonProgress.completed_at)
        )
    });

    if (existingProgress) return { success: true, alreadyCompleted: true };

    const xpToAdd = lesson.xp_reward || 10;

    await db.transaction(async (tx) => {
        const existing = await tx.query.lessonProgress.findFirst({
            where: and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
        });

        if (existing) {
            await tx.update(lessonProgress).set({
                completed_at: new Date(),
                progress_pct: '100',
                xp_earned: xpToAdd,
            }).where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId)));
        } else {
            await tx.insert(lessonProgress).values({
                user_id: userId,
                lesson_id: lessonId,
                enrollment_id: enrollment.id,
                session_id: enrollment.session_id,
                school_id: enrollment.school_id,
                completed_at: new Date(),
                progress_pct: '100',
                xp_earned: xpToAdd,
            });
        }

        if (existingUser.school_id) {
            await tx.insert(xpEvents).values({
                user_id: userId,
                school_id: existingUser.school_id,
                source: 'lesson_completion',
                xp_amount: xpToAdd,
                reference_type: 'lesson',
                reference_id: lessonId,
            });
        }

        // Course Completion Check
        const allCourseLessons = await tx.select({ id: lessons.id }).from(lessons).where(eq(lessons.course_id, lesson.course_id));
        const completedCourseLessons = await tx.select({ id: lessonProgress.id })
            .from(lessonProgress)
            .where(and(
                eq(lessonProgress.user_id, userId),
                eq(lessonProgress.enrollment_id, enrollment.id),
                isNotNull(lessonProgress.completed_at)
            ));
        
        const courseProgressPct = (completedCourseLessons.length / allCourseLessons.length) * 100;
        
        if (courseProgressPct === 100) {
            await tx.update(enrollments)
                .set({ completed_at: new Date(), updated_at: new Date() })
                .where(eq(enrollments.id, enrollment.id));
        }
    });

    // Award XP and update stats
    const typeMap: any = { student: 'student', school_admin: 'school_admin', super_admin: 'super_admin' };
    await awardXP(userId, xpToAdd, existingUser.school_id, typeMap[role] || 'student');

    if (role === 'student') {
        await incrementProgressCounter(userId, 'lessons');
        if (quizScore !== undefined) {
            await incrementProgressCounter(userId, 'quizzes');
            if (isPerfect) await incrementProgressCounter(userId, 'perfect_quizzes');
        }
        await handleStudentEngagement(userId);
    }

    // Secondary triggers
    try {
        await db.insert(auditLogs).values({
            user_id: userId,
            school_id: existingUser.school_id,
            action: 'create',
            entity_type: 'lesson_progress',
            entity_id: lessonId,
            new_values: { lesson_title: lesson.title, xp_earned: xpToAdd }
        } as any);

        const { checkAndAwardAchievements } = await import('./achievement-actions');
        await checkAndAwardAchievements();

        const { updateDailyChallengeProgress } = await import('./challenge-actions');
        await updateDailyChallengeProgress(userId, 'quiz_complete', xpToAdd);
        await updateDailyChallengeProgress(userId, 'xp_gain', xpToAdd);

        await redis.del(`cache:student:${userId}:course:${lesson.course_id}`);
        await invalidateStudentDashboardCache(userId);
    } catch (e) {
        console.error('Failed to process post-completion triggers:', e);
    }

    return { success: true };
}

/**
 * Save video playback progress
 */
export async function saveVideoProgress(lessonId: string, seconds: number, percentage: number) {
    const session = await verifySession();
    if (!session) return;

    const existing = await db.query.lessonProgress.findFirst({
        where: and(eq(lessonProgress.user_id, session.userId), eq(lessonProgress.lesson_id, lessonId))
    });

    if (existing) {
        await db.update(lessonProgress)
            .set({
                progress_pct: percentage.toFixed(2),
                last_position_secs: Math.floor(seconds),
                updated_at: new Date()
            })
            .where(and(eq(lessonProgress.user_id, session.userId), eq(lessonProgress.lesson_id, lessonId)));
    } else {
        const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
        if (!lesson) return;
        const enrollment = await ensureEnrollment(session.userId, lesson.course_id);
        if (!enrollment) return;

        await db.insert(lessonProgress).values({
            user_id: session.userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            session_id: enrollment.session_id,
            school_id: enrollment.school_id,
            progress_pct: percentage.toFixed(2),
            last_position_secs: Math.floor(seconds),
        });
    }
}

/**
 * Update active time spent on a lesson
 */
export async function updateTimeSpent(lessonId: string, seconds: number) {
    const session = await verifySession();
    if (!session) return;

    await db.update(lessonProgress)
        .set({
            time_spent_secs: sql`${lessonProgress.time_spent_secs} + ${seconds}`,
            updated_at: new Date()
        })
        .where(and(eq(lessonProgress.user_id, session.userId), eq(lessonProgress.lesson_id, lessonId)));
}

/**
 * Handle student assignment submission
 */
export async function submitAssignment(lessonId: string, assetId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const existing = await db.query.lessonSubmissions.findFirst({
        where: and(eq(lessonSubmissions.user_id, userId), eq(lessonSubmissions.lesson_id, lessonId))
    });

    if (existing) {
        await db.update(lessonSubmissions)
            .set({ asset_id: assetId, status: 'submitted', updated_at: new Date() })
            .where(eq(lessonSubmissions.id, existing.id));
    } else {
        await db.insert(lessonSubmissions).values({
            user_id: userId,
            lesson_id: lessonId,
            asset_id: assetId,
            status: 'submitted',
        });
    }

    await completeLessonAndReward(lessonId);
    return { success: true };
}

export async function getSubmissionStatus(lessonId: string) {
    const session = await verifySession();
    if (!session) return null;

    return await db.query.lessonSubmissions.findFirst({
        where: and(eq(lessonSubmissions.user_id, session.userId), eq(lessonSubmissions.lesson_id, lessonId)),
        with: { asset: true }
    });
}
