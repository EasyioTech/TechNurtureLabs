'use server';

import { db } from '@/lib/db';
import { 
    quizzes, quizQuestions, quizOptions, courses
} from '@/db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
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

export async function saveQuizAdmin(quizData: any) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    let quizId = quizData.id;

    if (quizId) {
        await db.update(quizzes).set({
            title: quizData.title,
            description: quizData.description || '',
            time_limit_secs: quizData.time_limit_secs || 0,
            pass_percentage: quizData.pass_percentage?.toString() || '60.00',
            max_attempts: quizData.max_attempts || 3,
            xp_reward: quizData.xp_reward || 20,
            is_published: quizData.is_published ?? true,
            updated_at: new Date()
        }).where(eq(quizzes.id, quizId));
    } else {
        const [created] = await db.insert(quizzes).values({
            lesson_id: quizData.lesson_id,
            course_id: quizData.course_id,
            title: quizData.title,
            description: quizData.description || '',
            time_limit_secs: quizData.time_limit_secs || 0,
            pass_percentage: quizData.pass_percentage?.toString() || '60.00',
            max_attempts: quizData.max_attempts || 3,
            xp_reward: quizData.xp_reward || 20,
            is_published: quizData.is_published ?? true,
        } as any).returning();
        quizId = created.id;
    }

    if (quizData.questions && Array.isArray(quizData.questions)) {
        // Delete old questions (cascade will delete options)
        await db.delete(quizQuestions).where(eq(quizQuestions.quiz_id, quizId));
        
        for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            const [newQuestion] = await db.insert(quizQuestions).values({
                quiz_id: quizId,
                question_text: q.question_text,
                question_type: q.question_type || 'mcq',
                explanation: q.explanation || '',
                points: q.points || 1,
                time_limit_secs: q.time_limit_secs || 0,
                sequence_order: i + 1,
            }).returning();

            if (q.options && Array.isArray(q.options)) {
                await db.insert(quizOptions).values(
                    q.options.map((opt: any, optIdx: number) => ({
                        question_id: newQuestion.id,
                        option_text: typeof opt === 'string' ? opt : opt.option_text,
                        is_correct: typeof opt === 'string' ? (opt === q.correct_answer) : !!opt.is_correct,
                        sequence_order: optIdx + 1
                    }))
                );
            }
        }
    }

    return await fetchQuizAdmin(quizData.lesson_id);
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
 * Global Library: Fetch all quizzes across all courses
 */
export async function fetchGlobalQuizzes() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = await db.select({
        id: quizzes.id,
        title: quizzes.title,
        created_at: quizzes.created_at,
        course_title: courses.title,
        questions_count: sql<number>`(SELECT count(*) FROM ${quizQuestions} WHERE ${quizQuestions.quiz_id} = ${quizzes.id})`
    })
    .from(quizzes)
    .innerJoin(courses, eq(quizzes.course_id, courses.id))
    .where(sql`quizzes.deleted_at IS NULL`)
    .orderBy(desc(quizzes.created_at));

    return data;
}
