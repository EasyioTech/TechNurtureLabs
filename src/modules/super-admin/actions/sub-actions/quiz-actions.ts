'use server';

import { db } from '@/lib/db';
import { 
    quizzes, quizQuestions, courses
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
                orderBy: [asc(quizQuestions.sequence_order)]
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
        await db.delete(quizQuestions).where(eq(quizQuestions.quiz_id, quizId));
        if (quizData.questions.length > 0) {
            await db.insert(quizQuestions).values(
                quizData.questions.map((q: any, idx: number) => ({
                    quiz_id: quizId,
                    question_text: q.question_text,
                    question_type: q.question_type || 'mcq',
                    options: q.options || [],
                    correct_answer: q.correct_answer,
                    explanation: q.explanation || '',
                    points: q.points || 1,
                    time_limit_secs: q.time_limit_secs || 0,
                    sequence_order: idx + 1,
                }))
            );
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

export async function cloneQuizAction(quizId: string, targetLessonId: string, targetCourseId: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    return await db.transaction(async (tx) => {
        const sourceQuiz = await tx.query.quizzes.findFirst({
            where: eq(quizzes.id, quizId),
            with: { questions: true }
        });

        if (!sourceQuiz) throw new Error("Source quiz not found");

        const [clonedQuiz] = await tx.insert(quizzes).values({
            lesson_id: targetLessonId,
            course_id: targetCourseId,
            title: `${sourceQuiz.title} (Copy)`,
            description: sourceQuiz.description,
            time_limit_secs: sourceQuiz.time_limit_secs,
            pass_percentage: sourceQuiz.pass_percentage,
            max_attempts: sourceQuiz.max_attempts,
            xp_reward: sourceQuiz.xp_reward,
            is_published: sourceQuiz.is_published,
        } as any).returning();

        if (sourceQuiz.questions && sourceQuiz.questions.length > 0) {
            await tx.insert(quizQuestions).values(
                sourceQuiz.questions.map(q => ({
                    quiz_id: clonedQuiz.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    points: q.points,
                    time_limit_secs: q.time_limit_secs,
                    sequence_order: q.sequence_order,
                }))
            );
        }

        return clonedQuiz;
    });
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
