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
import { computeMediaUrl, getSecureMediaUrl } from '@/lib/media';
import { QuizData, Question } from '../types';

/**
 * Fetch detailed lesson data including quiz and user progress
 */
export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    // SCALE BREAKER A: Optimized lesson fetch using deep Drizzle relations.
    // This replaces 5 sequential queries (lesson, asset, progress, quiz, questions, options)
    // with a single optimized fetch, drastically reducing TTFB for students.
    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            asset: true,
            quiz: {
                with: {
                    questions: {
                        columns: { id: true }
                    }
                }
            },
            progress: {
                where: eq(lessonProgress.user_id, userId),
                limit: 1
            }
        }
    });

    if (!lesson) return null;

    // 1. Enrollment check (remains as is for logic isolation)
    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return null;

    // 2. Media Logic
    const useHls = lesson.content_type === 'video' && 
                   lesson.asset && 
                   (lesson.asset as any).processing_status === 'completed';
    
    // M-10: Secure Media Redirect flow
    const contentUrl = await getSecureMediaUrl(
        lesson.asset ? (lesson.asset as any) : { storage_type: 'local', file_path: lesson.content_url || '' },
        useHls ? 'hls' : 'original'
    );

    // 3. Optimized Quiz Logic Mapping
    let quizData: any = null;
    const quiz = lesson.quiz;
    
    if (quiz) {
        quizData = {
            quiz: {
                id: quiz.id,
                title: quiz.title,
                time_limit_secs: quiz.time_limit_secs,
                pass_percentage: Number(quiz.pass_percentage),
                max_attempts: quiz.max_attempts,
                xp_reward: quiz.xp_reward,
                is_locked: false,
                lock_reason: "",
                question_count: quiz.questions?.length ?? 0
            },
            questions: [] // EMPTY: to be fetched on-demand
        };
    }

    const firstProgress = lesson.progress[0];

    return {
        ...lesson,
        content_url: contentUrl,
        sequence_index: lesson.sequence_order,
        duration: lesson.duration_minutes || 10,
        quiz_data: quizData,
        processing_status: (lesson as any).asset?.processing_status || 'completed',
        user_progress: firstProgress ? {
            completed_at: firstProgress.completed_at,
            progress_pct: Number(firstProgress.progress_pct) || 0,
            last_position_secs: firstProgress.last_position_secs || 0,
            verified_watch_seconds: firstProgress.verified_watch_seconds
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

    // SCALE BREAKER C: Core Completion Write (The only synchronous DB hit)
    await db.transaction(async (tx) => {
        const existing = await tx.query.lessonProgress.findFirst({
            where: and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
        });

        if (existing) {
            await tx.update(lessonProgress).set({
                completed_at: new Date(),
                progress_pct: '100',
                xp_earned: xpToAdd,
                updated_at: new Date()
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
    });

    // 🚀 EVENT-DRIVEN OFFLOADING (Backgrounding 90% of the work)
    try {
        const { eventService } = await import('@/lib/services/event-service');
        
        // This single event triggers:
        // - XP Awarding
        // - Course Completion Calculation
        // - Achievement checks
        // - Streak updates
        // - Audit logging
        // - Cache invalidation
        await eventService.emit('student.lesson_completed_full', {
            userId,
            schoolId: existingUser.school_id || undefined,
            courseId: lesson.course_id,
            lessonId,
            xpAmount: xpToAdd,
            role,
            quizScore,
            isPerfect,
            timestamp: Date.now()
        });

    } catch (e) {
        console.error('[ScaleGuard] Failed to dispatch background processing:', e);
    }

    return { success: true };
}

/**
 * Save video playback progress
 */
export async function saveVideoProgress(lessonId: string, seconds: number, percentage: number) {
    const session = await verifySession();
    if (!session) return;

    // Rate-limit: allow at most one DB write per 5 seconds per user+lesson
    const rateLimitKey = `rl:video_progress:${session.userId}:${lessonId}`;
    const acquired = await redis.set(rateLimitKey, '1', 'EX', 5, 'NX');
    if (!acquired) return;

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
 * M-11: High-Performance Time Tracking via Redis to avoid DB write thrashing.
 * Instead of writing to PostgreSQL every 10s, we accumulate time in Redis
 * and a background worker flushes it to the DB every few minutes.
 */
export async function updateTimeSpent(lessonId: string, seconds: number) {
    const session = await verifySession();
    if (!session) return;

    const userId = session.userId;
    const statsKey = `stats:time_spent:user:${userId}`;
    const flushKey = `stats:needs_flush:time_spent`;

    try {
        // 1. Increment the counter in Redis (O(1))
        await redis.hincrby(statsKey, lessonId, seconds);
        
        // 2. Track that this user+lesson needs a flush
        // We use a set of keys that need flushing to avoid scanning all user keys
        await redis.sadd(flushKey, `${userId}:${lessonId}`);
        
        // 3. Set expiry on the stats key to avoid memory leaks (48h should be safe)
        await redis.expire(statsKey, 172800, 'NX');
    } catch (e) {
        console.error('[TimeTracking] Redis error:', e);
        // Fallback or ignore non-critical metric failure
    }
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

/**
 * Fetch full quiz questions and options on-demand
 * SCALE: This avoids loading massive JSON blobs for every student just scrolling through a syllabus.
 */
export async function getQuizData(quizId: string): Promise<QuizData> {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        with: {
            questions: {
                orderBy: [asc(quizQuestions.sequence_order)],
                with: {
                    options: {
                        orderBy: [asc(quizOptions.sequence_order)]
                    }
                }
            }
        }
    });

    if (!quiz) throw new Error('Quiz not found');

    // SECURITY: Verify enrollment before leaking questions
    const enrollment = await ensureEnrollment(userId, quiz.course_id);
    if (!enrollment) throw new Error('Enrollment required to access assessment content.');

    return {
        quiz: {
            id: quiz.id,
            title: quiz.title,
            time_limit_secs: quiz.time_limit_secs as number | null,
            pass_percentage: Number(quiz.pass_percentage),
            max_attempts: quiz.max_attempts,
            xp_reward: quiz.xp_reward,
        },
        questions: quiz.questions.map(q => ({
            id: q.id,
            text: q.question_text,
            question_type: q.question_type as string,
            options: q.options.map(opt => ({ id: opt.id, option_text: opt.option_text })),
            points: q.points,
            time_limit_secs: q.time_limit_secs as number | null,
        })) as Question[]
    };
}
