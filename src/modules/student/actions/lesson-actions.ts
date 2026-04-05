'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import {
    students, schoolAdmins, superAdmins, lessons, lessonProgress,
    quizzes, quizQuestions, quizOptions, auditLogs, xpEvents, enrollments,
    quizAttempts, quizAttemptAnswers, academicSessions
} from '@/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';
import { awardXP, incrementProgressCounter, handleStudentEngagement, calculateLevel } from '@/lib/gamification';
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

    // 1. CRITICAL SECURITY: Student school-id scoping MUST happen first
    // Fetch student's school_id and active status in single query
    const student = await db.query.students.findFirst({
        where: and(eq(students.id, userId), eq(students.is_active, true))
    });

    if (!student) {
        throw new Error('Unauthorized: Student account invalid');
    }

    // 2. Enrollment check with school-id validation
    // SECURITY: ensureEnrollment also validates school subscription
    const enrollment = await ensureEnrollment(lesson.course_id);
    if (!enrollment) return null;

    // 3. CRITICAL: Verify enrollment is in the same school as the student
    // This prevents students from accessing courses in other schools
    // Enrollment.school_id is set during course enrollment and must match student.school_id
    if (student.school_id !== enrollment.school_id) {
        throw new Error('Unauthorized: Cross-school access denied');
    }

    // 4. CRITICAL: Verify lesson belongs to the enrolled course AND school
    // This is a defense-in-depth check: lesson should already belong to the course
    // But we verify the lesson's course_id matches the enrollment's course_id
    if (lesson.course_id !== enrollment.course_id) {
        throw new Error('Unauthorized: Lesson not in enrolled course');
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
    const xpResult = await db.transaction(async (tx) => {
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

        // SECURITY: Award XP inside transaction (not outside) to prevent partial writes
        // If outer transaction rolls back, XP award is also rolled back
        const student = await tx.query.students.findFirst({
            where: eq(students.id, userId),
            columns: { cumulative_xp: true, school_id: true }
        });

        if (!student) {
            throw new Error('Student not found');
        }

        const oldXp = student.cumulative_xp || 0;
        const newXp = oldXp + xpToAdd;
        const oldLevelData = calculateLevel(oldXp);
        const newLevelData = calculateLevel(newXp);
        const leveledUp = newLevelData.level > oldLevelData.level;

        // Update XP inside transaction
        await tx.update(students)
            .set({
                cumulative_xp: sql`cumulative_xp + ${xpToAdd}`,
                updated_at: new Date()
            })
            .where(eq(students.id, userId));

        const result = {
            leveledUp,
            oldLevel: oldLevelData.level,
            newLevel: newLevelData.level
        };

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
            leveledUp: result?.leveledUp,
            newLevel: result?.newLevel,
            timestamp: Date.now()
        });

        return result;
    });

    // Update leaderboards and caches AFTER transaction commits (OK if these fail)
    if (xpResult && xpToAdd > 0) {
        const pipeline = redis.pipeline();
        pipeline.zincrby('lb:global', xpToAdd, userId);
        pipeline.expire('lb:global', 86400 * 7); // 7 days

        const targetSchoolId = existingUser.school_id;
        if (targetSchoolId) {
            pipeline.zincrby(`lb:school:${targetSchoolId}`, xpToAdd, userId);
            pipeline.expire(`lb:school:${targetSchoolId}`, 86400 * 7);
        }

        pipeline.setex(`user:${userId}:achievements_dirty`, 3600, '1');
        await pipeline.exec().catch(() => {}); // Non-critical, ignore failures

        await invalidateStudentDashboardCache(userId).catch(() => {});
    }

    return {
        success: true,
        leveledUp: xpResult?.leveledUp,
        newLevel: xpResult?.newLevel,
        xpEarned: xpToAdd
    };
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

    // SECURITY: Don't check attempt limit here — will check inside transaction
    // to prevent race condition where two concurrent requests both pass the check

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
        // SECURITY: Recount attempts inside transaction to prevent race condition
        const attemptCountResult = await tx.select({ count: sql<number>`COUNT(*)::integer` })
            .from(quizAttempts)
            .where(and(eq(quizAttempts.user_id, userId), eq(quizAttempts.quiz_id, quizId)));

        const previousAttemptCount = attemptCountResult[0]?.count || 0;

        // Check limit inside transaction — no other transaction can insert between count and insert
        if (previousAttemptCount >= quiz.max_attempts) {
            throw new Error('Maximum attempts reached');
        }

        const [attempt] = await tx.insert(quizAttempts).values({
            user_id: userId,
            quiz_id: quizId,
            enrollment_id: enrollment.id,
            attempt_number: previousAttemptCount + 1,
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
    if (session.userType !== 'student') {
        throw new Error('Only students can access quiz content');
    }
    const userId = session.userId;

    // SECURITY FIX #6A: Fetch full quiz data in ONE query to avoid double-fetch
    // Includes lesson for authorization + questions/options for rendering
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        with: {
            lesson: {
                columns: { id: true, course_id: true, content_type: true }
            },
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

    if (!quiz || !quiz.lesson) {
        throw new Error('Quiz not found or invalid');
    }

    // SECURITY FIX #6B: Verify enrollment before anything else
    const enrollment = await ensureEnrollment(quiz.lesson.course_id);
    if (!enrollment) {
        throw new Error('Enrollment required to access assessment content.');
    }

    // SECURITY FIX #6C: Verify student belongs to enrollment's school
    const student = await db.query.students.findFirst({
        where: and(eq(students.id, userId), eq(students.is_active, true)),
        columns: { school_id: true }
    });

    if (!student || student.school_id !== enrollment.school_id) {
        throw new Error('Unauthorized: Cross-school access denied');
    }

    // SECURITY FIX #6D: Check quiz hasn't been completed (prevent retakes beyond limit)
    const attemptCount = await db.query.quizAttempts.findMany({
        where: and(
            eq(quizAttempts.quiz_id, quizId),
            eq(quizAttempts.user_id, userId)
        ),
        columns: { id: true }
    });

    if (quiz.max_attempts && attemptCount.length >= quiz.max_attempts) {
        throw new Error(`Maximum attempts (${quiz.max_attempts}) exceeded for this assessment`);
    }

    // SECURITY FIX #6E: Verify lesson content type allows quiz access
    if (quiz.lesson.content_type !== 'quiz') {
        throw new Error('This lesson does not contain a quiz');
    }

    return {
        quiz: {
            id: quiz.id,
            title: quiz.title,
            time_limit_secs: quiz.time_limit_secs as number | null,
            pass_percentage: Number(quiz.pass_percentage),
            max_attempts: quiz.max_attempts,
            xp_reward: quiz.xp_reward,
        },
        questions: (quiz.questions || []).map(q => ({
            id: q.id,
            text: q.question_text,
            question_type: q.question_type as string,
            // SECURITY: DO NOT leak correct answers in question options
            // Only return option IDs and text; answers are validated server-side
            options: q.options.map(opt => ({
                id: opt.id,
                option_text: opt.option_text,
                // Intentionally omit: is_correct, feedback (these stay server-side)
            })),
            points: q.points,
            time_limit_secs: q.time_limit_secs as number | null,
        })) as Question[]
    };
}
