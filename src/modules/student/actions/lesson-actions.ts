'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import {
    students, schoolAdmins, superAdmins, lessons, lessonProgress,
    quizzes, quizQuestions, quizOptions, auditLogs, xpEvents, enrollments,
    quizAttempts, quizAttemptAnswers, academicSessions
} from '@/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';
import { awardXP, incrementProgressCounter, handleStudentEngagement } from '@/lib/gamification';
import { redis } from '@/lib/redis';
import { ensureEnrollment, invalidateStudentDashboardCache } from './course-actions';
import { computeMediaUrl, getSecureMediaUrl } from '@/lib/media';
import { QuizData, Question } from '../types';

/**
 * Fetch detailed lesson data including quiz and user progress
 * SECURITY: Validates student belongs to lesson's school and has active subscription
 */
export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    // SECURITY FIX: Only students can access lesson data
    if (session.userType !== 'student') {
        throw new Error('Unauthorized');
    }

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
                where: and(
                    eq(lessonProgress.user_id, userId),
                    eq(lessonProgress.session_id, sql`(SELECT id FROM academic_sessions WHERE school_id = (SELECT school_id FROM students WHERE id = ${userId}::uuid) AND is_current = true LIMIT 1)`)
                ),
                limit: 1
            }
        }
    });

    if (!lesson) return null;

    // 1. Enrollment check (remains as is for logic isolation)
    // SECURITY: ensureEnrollment also validates school subscription
    const enrollment = await ensureEnrollment(lesson.course_id);
    if (!enrollment) return null;

    // SECURITY FIX: Verify student's school matches lesson's school
    // Fetch student's school_id once to avoid repeated DB lookups
    const student = await db.query.students.findFirst({
        where: eq(students.id, userId),
        columns: { school_id: true }
    });

    if (!student || student.school_id !== enrollment.school_id) {
        throw new Error('Unauthorized: Student not in lesson school');
    }

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

    const enrollment = await ensureEnrollment(lesson.course_id);
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

        // 🚀 EVENT-DRIVEN OFFLOADING (Backgrounding 90% of the work)
        // SCALE BREAKER C: We emit the event INSIDE the transaction to ensure 
        // it's delivered if the DB write commits. If the event pusher fails, 
        // the transaction rolls back, preventing "orphaned" lesson completions.
        const { eventService } = await import('@/lib/services/event-service');
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
    });

    return { success: true };
}

/**
 * Save video playback progress
 * SCALE BREAKER D: High-Performance Atomic Upsert
 * Replaces "find then update" (2 ROUNDTRIPS) with a single atomic DB hit.
 */
export async function saveVideoProgress(lessonId: string, seconds: number, percentage: number) {
    const session = await verifySession();
    if (!session) return;

    // Rate-limit: allow at most one DB write per 5 seconds per user+lesson
    const rateLimitKey = `rl:video_progress:${session.userId}:${lessonId}`;
    const acquired = await redis.set(rateLimitKey, '1', 'EX', 5, 'NX');
    if (!acquired) return;

    const clampedPercentage = Math.min(100, Math.max(0, percentage)).toFixed(2);
    const verifiedSeconds = Math.floor(seconds);

    try {
        // Atomic Upsert: Efficient single-query execution.
        await db.execute(sql`
            INSERT INTO lesson_progress (
                id, user_id, lesson_id, enrollment_id, session_id, school_id, 
                progress_pct, last_position_secs, verified_watch_seconds, 
                created_at, updated_at
            )
            SELECT
                gen_random_uuid(),
                ${session.userId}::uuid,
                ${lessonId}::uuid,
                e.id,
                e.session_id,
                e.school_id,
                ${clampedPercentage}::numeric,
                ${verifiedSeconds}::integer,
                ${verifiedSeconds}::integer,
                NOW(),
                NOW()
            FROM enrollments e
            WHERE e.user_id = ${session.userId}::uuid
              AND e.course_id = (SELECT course_id FROM lessons WHERE id = ${lessonId}::uuid)
              AND e.is_active = true
              AND e.session_id = (SELECT id FROM academic_sessions WHERE school_id = e.school_id AND is_current = true LIMIT 1)
            LIMIT 1
            ON CONFLICT (user_id, lesson_id, enrollment_id)
            DO UPDATE SET
                progress_pct = EXCLUDED.progress_pct,
                last_position_secs = EXCLUDED.last_position_secs,
                verified_watch_seconds = GREATEST(lesson_progress.verified_watch_seconds, EXCLUDED.verified_watch_seconds),
                updated_at = NOW()
        `);
    } catch (err) {
        console.error('[ProgressSave] Atomic upsert failed:', err);
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
 * Server-side Quiz Grading & Recording (High Integrity)
 * CRITICAL FIX #4: Cache invalidation after quiz submission
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

    const enrollment = await ensureEnrollment(quiz.course_id);
    if (!enrollment) throw new Error('Enrollment not found');

    // SECURITY: Validate all submitted option IDs belong to this quiz
    const validOptionIds = new Set(quiz.questions.flatMap(q => q.options.map(o => o.id)));
    for (const [, optionId] of Object.entries(responses)) {
        if (optionId && !validOptionIds.has(optionId)) {
            throw new Error('Invalid option submitted');
        }
    }

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

    // CRITICAL FIX #4: Invalidate cache after quiz submission
    try {
        const { cacheService } = await import('@/lib/cache');

        // Invalidate all user-specific caches affected by quiz submission
        await cacheService.invalidateTag(`user:${userId}:progress`);
        await cacheService.invalidateTag(`user:${userId}:leaderboard`);
        await cacheService.invalidateTag(`user:${userId}:stats`);
        await cacheService.invalidateTag(`user:${userId}:dashboard`);

        // If passed, also invalidate achievement cache (quiz pass might unlock badges)
        if (passed) {
            await cacheService.invalidateTag(`user:${userId}:achievements`);
            // Invalidate course leaderboard since XP was earned
            await cacheService.invalidateTag(`course:${quiz.course_id}:leaderboard`);
        }
    } catch (err) {
        console.warn('[Quiz Submit] Cache invalidation error:', (err as any).message);
        // Non-fatal: Cache invalidation failure doesn't block quiz submission
    }

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
    const enrollment = await ensureEnrollment(quiz.course_id);
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
