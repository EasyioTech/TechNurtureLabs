'use server';

import { db } from '@/lib/db';
import { 
    quizzes, quizQuestions, quizOptions, courses
} from '@/db/schema';
import { eq, asc, desc, sql, count, ilike, and } from 'drizzle-orm';
import { z } from 'zod';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function fetchQuizAdmin(lessonId: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
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
    z.string(),
    z.object({
        option_text: z.string(),
        is_correct: z.boolean(),
    }),
]);

const quizQuestionSchema = z.object({
    question_text: z.string().min(1, 'Question text is required'),
    question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'multi_select']).default('mcq'),
    explanation: z.string().optional().default(''),
    points: z.number().int().min(0).default(1),
    time_limit_secs: z.number().int().min(0).default(0),
    correct_answer: z.string().optional(),
    options: z.array(quizOptionSchema).optional(),
});

const quizSchema = z.object({
    id: z.string().uuid().optional(),
    lesson_id: z.string().uuid().optional().nullable(),
    course_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().default(''),
    time_limit_secs: z.number().int().min(0).default(0),
    pass_percentage: z.number().min(0).max(100).optional(),
    max_attempts: z.number().int().min(1).default(3),
    xp_reward: z.number().int().min(0).default(20),
    is_published: z.boolean().optional().default(true),
    questions: z.array(quizQuestionSchema).optional(),
});

export async function saveQuizAdmin(quizData: unknown) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = quizSchema.parse(quizData);
    const passPercentage = (data.pass_percentage ?? 60).toString();
    let quizId = data.id;

    if (quizId) {
        await db.update(quizzes).set({
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
        const [created] = await db.insert(quizzes).values({
            lesson_id: data.lesson_id ?? null,
            course_id: data.course_id ?? null,
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

    if (data.questions && data.questions.length > 0) {
        // Delete old questions (cascade will delete options)
        await db.delete(quizQuestions).where(eq(quizQuestions.quiz_id, quizId!));

        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            const [newQuestion] = await db.insert(quizQuestions).values({
                quiz_id: quizId!,
                question_text: q.question_text,
                question_type: q.question_type,
                explanation: q.explanation,
                points: q.points,
                time_limit_secs: q.time_limit_secs,
                sequence_order: i + 1,
            }).returning();

            if (q.options && q.options.length > 0) {
                await db.insert(quizOptions).values(
                    q.options.map((opt, optIdx) => ({
                        question_id: newQuestion.id,
                        option_text: typeof opt === 'string' ? opt : opt.option_text,
                        is_correct: typeof opt === 'string' ? (opt === q.correct_answer) : opt.is_correct,
                        sequence_order: optIdx + 1,
                    }))
                );
            }
        }
    }

    return await fetchQuizAdmin(data.lesson_id ?? '');
}

export async function deleteQuizAdmin(quizId: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
}

export async function cloneQuizAction(quizId: string, targetLessonId: string | null | undefined, targetCourseId?: string | null) {
    console.log(`[cloneQuizAction] Starting clone for quizId: ${quizId}, targetLessonId: ${targetLessonId}, targetCourseId: ${targetCourseId}`);
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        console.error(`[cloneQuizAction] Unauthorized access attempt by ${session?.userId}`);
        redirect('/admin-portal/login');
    }

    try {
        return await db.transaction(async (tx) => {
            console.log(`[cloneQuizAction] Fetching source quiz...`);
            const sourceQuiz = await tx.query.quizzes.findFirst({
                where: eq(quizzes.id, quizId),
                with: { questions: true }
            });

            if (!sourceQuiz) {
                console.error(`[cloneQuizAction] Source quiz ${quizId} not found`);
                throw new Error("Source quiz not found");
            }

            // Determine target course ID: use provided one, or fall back to source quiz's course_id
            const finalCourseId = targetCourseId || sourceQuiz.course_id;
            
            if (!finalCourseId) {
                console.error(`[cloneQuizAction] Could not determine target course ID`);
                throw new Error("Destination course ID is required");
            }

            console.log(`[cloneQuizAction] Inserting cloned quiz for course ${finalCourseId}...`);
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

            console.log(`[cloneQuizAction] Cloned quiz created with ID: ${clonedQuiz.id}. Found ${sourceQuiz.questions?.length || 0} questions.`);

            if (sourceQuiz.questions && sourceQuiz.questions.length > 0) {
                for (const q of sourceQuiz.questions) {
                    console.log(`[cloneQuizAction] Cloning question: ${q.question_text.substring(0, 30)}...`);
                    const [clonedQuestion] = await tx.insert(quizQuestions).values({
                        quiz_id: clonedQuiz.id,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        explanation: q.explanation || '',
                        points: q.points || 1,
                        time_limit_secs: q.time_limit_secs || 0,
                        sequence_order: q.sequence_order,
                    }).returning();

                    const sourceOptions = await tx.query.quizOptions.findMany({
                        where: eq(quizOptions.question_id, q.id)
                    });

                    if (sourceOptions.length > 0) {
                        console.log(`[cloneQuizAction] Inserting ${sourceOptions.length} options for question ${clonedQuestion.id}`);
                        await tx.insert(quizOptions).values(
                            sourceOptions.map(opt => ({
                                question_id: clonedQuestion.id,
                                option_text: opt.option_text,
                                is_correct: opt.is_correct,
                                sequence_order: opt.sequence_order
                            }))
                        );
                    }
                }
            }

            console.log(`[cloneQuizAction] Successfully cloned quiz ${quizId} to ${clonedQuiz.id}`);
            return clonedQuiz;
        });
    } catch (error: any) {
        console.error(`[cloneQuizAction] Error cloning quiz:`, error);
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
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

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
