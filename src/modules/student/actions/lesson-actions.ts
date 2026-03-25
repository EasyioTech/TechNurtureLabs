'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { 
    students, schoolAdmins, superAdmins, lessons, lessonProgress, 
    quizzes, quizQuestions, quizOptions, auditLogs, lessonSubmissions, xpEvents, enrollments,
    quizAttempts, quizAttemptAnswers
} from '@/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';
import { awardXP, incrementProgressCounter, handleStudentEngagement } from '@/lib/gamification';
import { redis } from '@/lib/redis';
import { ensureEnrollment, invalidateStudentDashboardCache } from './course-actions';
import { computeMediaUrl } from '@/lib/media';

/**
 * Fetch detailed lesson data including quiz and user progress
 */
export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            asset: true
        }
    });

    if (!lesson) return null;

    const useHls = lesson.content_type === 'video' && 
                   lesson.asset && 
                   (lesson.asset as any).processing_status === 'completed';
    
    const contentUrl = useHls
        ? computeMediaUrl(lesson.asset as any, 'hls')
        : (lesson.asset ? computeMediaUrl(lesson.asset as any) : lesson.content_url);

    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return null;

    const progress = await db.query.lessonProgress.findFirst({
        where: and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
    });

    let isQuizLocked = false;
    let lockReason = "";

    if (lesson.content_type === 'video') {
        // Threshold removed as per user request
    }

    let quizData: any = null;
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.lesson_id, lessonId),
    });
    
    if (quiz) {
        const questions = await db.query.quizQuestions.findMany({
            where: eq(quizQuestions.quiz_id, quiz.id),
            orderBy: [asc(quizQuestions.sequence_order)],
            with: {
                options: {
                    orderBy: [asc(quizOptions.sequence_order)]
                }
            }
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
            questions: isQuizLocked ? [] : questions.map(q => {
                return {
                    id: q.id,
                    text: q.question_text,
                    question_type: q.question_type,
                    options: q.options.map(opt => ({ id: opt.id, option_text: opt.option_text })),
                    // Security: Hide correct_answer and explanation from student payload
                    points: q.points,
                    time_limit_secs: q.time_limit_secs,
                };
            })
        };
    }

    return {
        ...lesson,
        content_url: contentUrl,
        sequence_index: lesson.sequence_order,
        duration: lesson.duration_minutes || 10,
        quiz_data: quizData,
        processing_status: (lesson as any).asset?.processing_status || 'completed',
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

    // Watch threshold check removed as per user request to allow immediate completion

    if (lesson.content_type === 'quiz' && quizScore === undefined) {
        return { success: false, error: 'Quizzes must be submitted via the assessment engine.' };
    }

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

    // 🚀 EVENT-DRIVEN SECONDARY TRIGGERS
    // We emit events to Redis. The EventWorker handles the heavy lifting (achievements, streaks, challenges).
    try {
        const { eventService } = await import('@/lib/services/event-service');
        
        // 1. Core Completion Event
        await eventService.emit('student.lesson_completed', {
            userId,
            schoolId: existingUser.school_id || undefined,
            courseId: lesson.course_id,
            lessonId: lessonId,
            amount: xpToAdd,
            timestamp: Date.now()
        });

        // 2. XP Gain Event (triggers level checks & xp challenges)
        await eventService.emit('student.xp_gained', {
            userId,
            schoolId: existingUser.school_id || undefined,
            amount: xpToAdd,
            timestamp: Date.now()
        });

        // 3. Perfect Quiz Event if applicable
        if (quizScore !== undefined && isPerfect) {
            await eventService.emit('student.quiz_perfect', {
                userId,
                schoolId: existingUser.school_id || undefined,
                timestamp: Date.now()
            });
        }

        // 4. Maintenance / Metadata
        await db.insert(auditLogs).values({
            user_id: userId,
            school_id: existingUser.school_id,
            action: 'create',
            entity_type: 'lesson_progress',
            entity_id: lessonId,
            new_values: { lesson_title: lesson.title, xp_earned: xpToAdd }
        } as any);

        await redis.del(`cache:student:${userId}:course:${lesson.course_id}`);
        await invalidateStudentDashboardCache(userId);
    } catch (e) {
        console.error('Failed to dispatch platform events:', e);
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

    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    const verifiedSeconds = Math.floor(seconds);

    if (existing) {
        await db.update(lessonProgress)
            .set({
                progress_pct: clampedPercentage.toFixed(2),
                last_position_secs: Math.floor(seconds),
                // Simple verification: if they are reporting a further position, we count it as verified for now
                // to keep the system simple and "working properly" as requested.
                verified_watch_seconds: Math.max(existing.verified_watch_seconds || 0, verifiedSeconds),
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
            verified_watch_seconds: verifiedSeconds,
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

    const submission = await db.query.lessonSubmissions.findFirst({
        where: and(eq(lessonSubmissions.user_id, session.userId), eq(lessonSubmissions.lesson_id, lessonId)),
        with: { asset: true }
    });

    if (submission && submission.asset) {
        const { computeMediaUrl } = await import('@/lib/media');
        return {
            ...submission,
            asset: {
                ...submission.asset,
                file_url: computeMediaUrl(submission.asset)
            }
        };
    }

    return submission;
}

/**
 * Server-side Quiz Grading & Recording (High Integrity)
 */
export async function submitQuizAttempt(quizId: string, responses: Record<string, string>) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        with: { questions: { with: { options: true } } }
    });

    if (!quiz) throw new Error('Quiz not found');

    const enrollment = await ensureEnrollment(userId, quiz.course_id);
    if (!enrollment) throw new Error('Enrollment not found');

    const previousAttempts = await db.query.quizAttempts.findMany({
        where: and(eq(quizAttempts.user_id, userId), eq(quizAttempts.quiz_id, quizId))
    });

    if (previousAttempts.length >= quiz.max_attempts) {
        throw new Error('Maximum attempts reached');
    }

    let earnedScore = 0;
    let totalScorePossible = 0;
    const answerRecords: any[] = [];
    const feedback: any[] = [];

    for (const q of quiz.questions) {
        totalScorePossible += q.points;
        const studentOptionId = responses[q.id];
        const correctOption = q.options.find(opt => opt.is_correct);
        const isCorrect = studentOptionId === correctOption?.id;
        
        if (isCorrect) earnedScore += q.points;

        answerRecords.push({
            question_id: q.id,
            option_id: studentOptionId || null,
            is_correct: isCorrect,
            created_at: new Date()
        });

        feedback.push({
            question_id: q.id,
            is_correct: isCorrect,
            correct_option_id: correctOption?.id,
            explanation: q.explanation
        });
    }

    const percentage = Math.round((earnedScore / totalScorePossible) * 100);
    const passed = percentage >= Number(quiz.pass_percentage);

    // Determine actual XP that will be awarded so we can store it and return it
    let xpEarned = 0;
    if (passed && quiz.lesson_id) {
        const lessonData = await db.query.lessons.findFirst({
            where: eq(lessons.id, quiz.lesson_id),
            columns: { xp_reward: true }
        });
        xpEarned = lessonData?.xp_reward || 10;
    }

    const attemptId = await db.transaction(async (tx) => {
        const [attempt] = await tx.insert(quizAttempts).values({
            user_id: userId,
            quiz_id: quizId,
            enrollment_id: enrollment.id,
            attempt_number: previousAttempts.length + 1,
            score: earnedScore.toString(),
            max_score: totalScorePossible.toString(),
            passed: passed,
            xp_earned: xpEarned,
            completed_at: new Date()
        }).returning({ id: quizAttempts.id });

        if (answerRecords.length > 0) {
            await tx.insert(quizAttemptAnswers).values(
                answerRecords.map(ar => ({ ...ar, attempt_id: attempt.id }))
            );
        }

        return attempt.id;
    });

    if (passed && quiz.lesson_id) {
        await completeLessonAndReward(quiz.lesson_id, percentage, percentage === 100);
    }

    return {
        success: true,
        score: earnedScore,
        total: totalScorePossible,
        percentage,
        passed,
        xp_earned: xpEarned,
        feedback
    };
}
