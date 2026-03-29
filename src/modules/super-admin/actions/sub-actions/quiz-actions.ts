'use server';

import { db } from '@/lib/db';
import {
    quizzes, quizQuestions, quizOptions, quizAttempts, courses
} from '@/db/schema';
import { eq, asc, desc, sql, count, ilike, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/admin-guard';

export async function fetchQuizAdmin(lessonId: string) {
    const session = await requireSuperAdmin();
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.lesson_id, lessonId),
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
    return quiz;
}

const quizOptionSchema = z.union([
    z.string().min(1, 'Option text is required'),
    z.object({
        option_text: z.string().min(1, 'Option text is required'),
        is_correct: z.boolean(),
    }),
]);

const quizQuestionSchema = z.object({
    id: z.string().uuid().optional(),
    question_text: z.string().min(1, 'Question text is required').max(1000),
    question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'multi_select']).default('mcq'),
    explanation: z.string().optional().default(''),
    points: z.number().int().min(1, 'Points must be at least 1').max(100).default(1),
    time_limit_secs: z.number().int().min(0).default(0),
    correct_answer: z.union([z.number(), z.string()]).optional(),  // ✓ Accept number (index) or string
    options: z.array(quizOptionSchema).optional(),
});

const quizSchema = z.object({
    id: z.string().uuid().optional(),
    lesson_id: z.string().uuid().optional().nullable(),
    course_id: z.string().uuid('Invalid course ID format'),  // ✓ REQUIRED - must be valid UUID
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().default(''),
    time_limit_secs: z.number().int().min(0).default(0),
    pass_percentage: z.number().min(0, 'Pass percentage cannot be negative').max(100, 'Pass percentage cannot exceed 100').default(60),
    max_attempts: z.number().int().min(1, 'Must allow at least 1 attempt').default(3),
    xp_reward: z.number().int().min(0).default(20),
    is_published: z.boolean().optional().default(true),
    questions: z.array(quizQuestionSchema).optional(),
});

export async function saveQuizAdmin(quizData: unknown) {
    const session = await requireSuperAdmin();

    let data;
    try {
        data = quizSchema.parse(quizData);
    } catch (validationError) {
        // Re-throw with clear message
        if (validationError instanceof z.ZodError) {
            const errorDetail = validationError.issues[0];
            if (errorDetail) {
                throw new Error(`Validation error: ${errorDetail.message} (${errorDetail.path.join('.')})`);
            }
        }
        throw validationError;
    }

    // ✓ Ensure course_id is always present (required by database)
    if (!data.course_id) {
        throw new Error('Course ID is required to save a quiz');
    }

    let quizId = data.id;
    // Convert pass_percentage to proper format (numeric(5,2) expects "XX.XX" format)
    const passPercentage = (data.pass_percentage ?? 60).toFixed(2);

    return await db.transaction(async (tx) => {
        try {
            if (quizId) {
                await tx.update(quizzes).set({
                    title: data.title,
                    description: data.description,
                    time_limit_secs: data.time_limit_secs,
                    pass_percentage: passPercentage,
                    max_attempts: data.max_attempts,
                    xp_reward: data.xp_reward,
                    is_published: data.is_published ?? true,
                    updated_at: new Date()
                }).where(eq(quizzes.id, quizId));
            } else {
                const [created] = await tx.insert(quizzes).values({
                    lesson_id: data.lesson_id || null,  // ✓ Changed from ?? to || for consistency
                    course_id: data.course_id,  // ✓ Always has value (validated above)
                    title: data.title,
                    description: data.description,
                    time_limit_secs: data.time_limit_secs,
                    pass_percentage: passPercentage,
                    max_attempts: data.max_attempts,
                    xp_reward: data.xp_reward,
                    is_published: data.is_published ?? true,
                } as any).returning();
                quizId = created.id;
            }
        } catch (dbError) {
            // Provide clear DB error messages
            const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
            if (errorMsg.includes('course_id')) {
                throw new Error('Failed to save quiz: Course information is missing or invalid');
            }
            throw new Error(`Failed to save quiz: ${errorMsg.slice(0, 100)}`);
        }

        if (data.questions && data.questions.length > 0) {
            // Guard: if students have already attempted this quiz, preserve questions to avoid
            // cascading deletion of quizAttemptAnswers (which reference question IDs).
            const attemptCount = await tx.select({ val: count() })
                .from(quizAttempts)
                .where(eq(quizAttempts.quiz_id, quizId!));
            const hasAttempts = Number(attemptCount[0]?.val || 0) > 0;

            if (hasAttempts) {
                // Return quiz as-is — question edits are blocked to protect student records
                return await tx.query.quizzes.findFirst({
                    where: eq(quizzes.id, quizId!),
                    with: {
                        questions: {
                            orderBy: [asc(quizQuestions.sequence_order)],
                            with: { options: { orderBy: [asc(quizOptions.sequence_order)] } }
                        }
                    }
                });
            }

            // No student attempts — safe to delete and recreate questions
            await tx.delete(quizQuestions).where(eq(quizQuestions.quiz_id, quizId!));

            // M-4: Efficient Batch Inserting to avoid N+1 I/O
            const questionsToInsert = data.questions.map((q, i) => ({
                quiz_id: quizId!,
                question_text: q.question_text,
                question_type: q.question_type,
                explanation: q.explanation,
                points: q.points,
                time_limit_secs: q.time_limit_secs,
                sequence_order: i + 1,
            }));
            const insertedQuestions = await tx.insert(quizQuestions).values(questionsToInsert).returning();

            const allOptionsToInsert = [];
            for (let i = 0; i < data.questions.length; i++) {
                const q = data.questions[i];
                const insertedQId = insertedQuestions[i].id;
                if (q.options && q.options.length > 0) {
                    allOptionsToInsert.push(...q.options.map((opt, optIdx) => ({
                        question_id: insertedQId,
                        option_text: typeof opt === 'string' ? opt : opt.option_text,
                        is_correct: typeof opt === 'string' ? (opt === q.correct_answer) : opt.is_correct,
                        sequence_order: optIdx + 1,
                    })));
                }
            }

            if (allOptionsToInsert.length > 0) {
                await tx.insert(quizOptions).values(allOptionsToInsert);
            }
        }

        return await tx.query.quizzes.findFirst({
            where: eq(quizzes.id, quizId!),
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
    });
}

export async function deleteQuizAdmin(quizId: string) {
    const session = await requireSuperAdmin();
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
}

export async function cloneQuizAction(quizId: string, targetLessonId: string | null | undefined, targetCourseId?: string | null) {
    const session = await requireSuperAdmin();

    try {
        return await db.transaction(async (tx) => {
            // H-4: Integrated Eager Loading for options to eliminate N+1 queries during clone
            const sourceQuiz = await tx.query.quizzes.findFirst({
                where: eq(quizzes.id, quizId),
                with: { 
                    questions: {
                        with: { options: true }
                    } 
                }
            });

            if (!sourceQuiz) {
                throw new Error("Source quiz not found");
            }

            // Determine target course ID: use provided one, or fall back to source quiz's course_id
            const finalCourseId = targetCourseId || sourceQuiz.course_id;

            if (!finalCourseId) {
                throw new Error("Destination course ID is required");
            }

            const [clonedQuiz] = await tx.insert(quizzes).values({
                lesson_id: targetLessonId || null,
                course_id: finalCourseId,
                title: `${sourceQuiz.title} (Copy)`,
                description: sourceQuiz.description || '',
                time_limit_secs: sourceQuiz.time_limit_secs || 0,
                pass_percentage: sourceQuiz.pass_percentage || '60.00',
                max_attempts: sourceQuiz.max_attempts || 3,
                xp_reward: sourceQuiz.xp_reward || 20,
                is_published: sourceQuiz.is_published ?? false,
            } as any).returning();

            if (sourceQuiz.questions && sourceQuiz.questions.length > 0) {
                // Batch insert all cloned questions
                const questionsToInsert = sourceQuiz.questions.map(q => ({
                    quiz_id: clonedQuiz.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    explanation: q.explanation || '',
                    points: q.points || 1,
                    time_limit_secs: q.time_limit_secs || 0,
                    sequence_order: q.sequence_order,
                }));
                const insertedQuestions = await tx.insert(quizQuestions).values(questionsToInsert).returning();

                // Flatten all options to clone in a single batch insert
                const allClonedOptions = [];
                for (let i = 0; i < sourceQuiz.questions.length; i++) {
                    const sourceQ = sourceQuiz.questions[i];
                    const targetQId = insertedQuestions[i].id;
                    if (sourceQ.options && sourceQ.options.length > 0) {
                        for (const opt of sourceQ.options) {
                            allClonedOptions.push({
                                question_id: targetQId,
                                option_text: opt.option_text,
                                is_correct: opt.is_correct,
                                sequence_order: opt.sequence_order
                            });
                        }
                    }
                }

                if (allClonedOptions.length > 0) {
                    await tx.insert(quizOptions).values(allClonedOptions);
                }
            }

            return clonedQuiz;
        });
    } catch (error: any) {
        throw error;
    }
}

/**
 * Global Library: Fetch quizzes across all courses with server-side pagination + search.
 * Mirrors the lesson fetcher — previously unbounded, now capped to `limit` rows (default 50,
 * max 200) with an optional title search pushed down to Postgres.
 */
export async function fetchGlobalQuizzes({
    page = 1,
    limit = 50,
    search = '',
}: { page?: number; limit?: number; search?: string } = {}) {
    const session = await requireSuperAdmin();

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const searchFilter = search.trim().length >= 2
        ? ilike(quizzes.title, `%${search.trim()}%`)
        : undefined;

    const baseWhere = searchFilter
        ? and(sql`quizzes.deleted_at IS NULL`, searchFilter)
        : sql`quizzes.deleted_at IS NULL`;

    const [data, countResult] = await Promise.all([
        db.select({
            id: quizzes.id,
            title: quizzes.title,
            created_at: quizzes.created_at,
            course_title: courses.title,
            questions_count: sql<number>`(SELECT count(*) FROM ${quizQuestions} WHERE ${quizQuestions.quiz_id} = ${quizzes.id})`,
        })
        .from(quizzes)
        .innerJoin(courses, eq(quizzes.course_id, courses.id))
        .where(baseWhere)
        .orderBy(desc(quizzes.created_at))
        .limit(safeLimit)
        .offset(offset),

        db.select({ total: count() })
        .from(quizzes)
        .where(baseWhere),
    ]);

    const total = Number(countResult[0]?.total ?? 0);
    return { data, total, pages: Math.ceil(total / safeLimit), page: safePage };
}
