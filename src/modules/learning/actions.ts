'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, courses, lessons, lessonProgress, enrollments, xpEvents, quizzes, quizQuestions, academicSessions, studentAcademicRecords, courseClassMapping } from '@/db/schema';
import { eq, and, inArray, asc, desc, isNotNull } from 'drizzle-orm';

// Auto-enroll a student in a course if not already enrolled
async function ensureEnrollment(userId: string, courseId: string) {
    const existingEnrollment = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.user_id, userId), eq(enrollments.course_id, courseId))
    });

    if (existingEnrollment) return existingEnrollment;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.school_id) return null;

    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, user.school_id), eq(academicSessions.is_current, true))
    });

    if (!currentSession) return null;

    if (user.role === 'student') {
        const course = await db.query.courses.findFirst({
            where: and(eq(courses.id, courseId), eq(courses.is_published, true))
        });
        if (!course) return null;

        if (!course.all_classes) {
            const currentRecord = await db.query.studentAcademicRecords.findFirst({
                where: and(eq(studentAcademicRecords.user_id, userId), eq(studentAcademicRecords.session_id, currentSession.id)),
                orderBy: (records, { desc }) => [desc(records.created_at)]
            });

            if (!currentRecord?.class_id) return null;

            const mapping = await db.query.courseClassMapping.findFirst({
                where: and(eq(courseClassMapping.class_id, currentRecord.class_id), eq(courseClassMapping.course_id, courseId))
            });

            if (!mapping) return null; // Not allowed to enroll
        }
    }

    const [newEnrollment] = await db.insert(enrollments).values({
        user_id: userId,
        course_id: courseId,
        school_id: user.school_id,
        session_id: currentSession.id,
        is_active: true,
    } as any).returning();

    return newEnrollment;
}

export async function getCourseDetailsData(courseId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new Error('User not found');

    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
    });

    if (!course) throw new Error('Course not found');

    // If not super admin, must be published
    if (user.role !== 'super_admin' && !course.is_published) {
        throw new Error('Course not found');
    }

    if (user.role === 'student') {
        // Validate access
        const existingEnrollment = await db.query.enrollments.findFirst({
            where: and(eq(enrollments.user_id, userId), eq(enrollments.course_id, courseId))
        });

        if (!existingEnrollment && !course.all_classes) {
            const currentRecord = await db.query.studentAcademicRecords.findFirst({
                where: eq(studentAcademicRecords.user_id, userId),
                orderBy: (records, { desc }) => [desc(records.created_at)]
            });

            if (!currentRecord?.class_id) {
                throw new Error('Course not found');
            }

            const mapping = await db.query.courseClassMapping.findFirst({
                where: and(eq(courseClassMapping.class_id, currentRecord.class_id), eq(courseClassMapping.course_id, courseId))
            });

            if (!mapping) {
                throw new Error('Course not found');
            }
        }
    }

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    // Enrolled count from enrollments table
    const enrollmentData = await db.select().from(enrollments).where(eq(enrollments.course_id, courseId));
    const enrolledCount = enrollmentData.length;

    let formattedLessons = courseLessons.map((l, i) => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
        xp_reward: l.xp_reward || 10,
        status: (i === 0 ? 'available' : 'locked') as 'locked' | 'available' | 'completed'
    }));

    if (courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id);
        const progressData = await db.select().from(lessonProgress).where(
            and(
                eq(lessonProgress.user_id, userId),
                inArray(lessonProgress.lesson_id, lessonIds)
            )
        );

        const progressMap = new Map(progressData.map(p => [p.lesson_id, p.completed_at ? 'completed' : 'in_progress']));

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
                sequence_index: l.sequence_order,
                duration: l.duration_minutes || 10,
                xp_reward: l.xp_reward || 10,
                status: lessonStatus
            };
        });
    }

    return {
        course: {
            ...course,
            thumbnail: course.thumbnail_url,
            published: course.is_published,
        },
        lessons: formattedLessons,
        enrolledCount
    };
}

export async function getCourseJourneyData(courseId: string) {
    return await getCourseDetailsData(courseId);
}

export async function getLessonData(lessonId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId)
    });

    if (!lesson) return null;

    // Ensure enrollment exists so completion tracking works
    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return null;

    // Fetch quiz data if this is a quiz lesson
    let quizData: any = null;
    if (lesson.content_type === 'quiz') {
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
                },
                questions: questions.map(q => ({
                    id: q.id,
                    text: q.question_text,
                    question_type: q.question_type,
                    options: Array.isArray(q.options) ? q.options : [],
                    correct_answer: q.correct_answer, // could be index (number) or string
                    explanation: q.explanation,
                    points: q.points,
                }))
            };
        }
    }

    return {
        ...lesson,
        sequence_index: lesson.sequence_order,
        duration: lesson.duration_minutes || 10,
        quiz_data: quizData,
    };
}

export async function completeLessonAndReward(lessonId: string, quizScore?: number, isPerfect?: boolean) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!existingUser) return;

    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
    if (!lesson) return;

    // Auto-enroll if needed
    const enrollment = await ensureEnrollment(userId, lesson.course_id);
    if (!enrollment) return; // No school/session found — cannot enroll

    // Check if already completed
    const existingProgress = await db.select().from(lessonProgress).where(
        and(
            eq(lessonProgress.user_id, userId),
            eq(lessonProgress.lesson_id, lessonId),
            isNotNull(lessonProgress.completed_at)
        )
    );

    if (existingProgress.length > 0) return; // Already completed

    // Upsert lesson progress
    const existing = await db.select().from(lessonProgress).where(
        and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
    );

    if (existing.length > 0) {
        await db.update(lessonProgress).set({
            completed_at: new Date(),
            progress_pct: '100',
            xp_earned: lesson.xp_reward || 10,
        }).where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId)));
    } else {
        await db.insert(lessonProgress).values({
            user_id: userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            completed_at: new Date(),
            progress_pct: '100',
            xp_earned: lesson.xp_reward || 10,
        });
    }

    const xpToAdd = lesson.xp_reward || 10;

    // Record XP event
    if (existingUser.school_id) {
        await db.insert(xpEvents).values({
            user_id: userId,
            school_id: existingUser.school_id,
            source: 'lesson_completion',
            xp_amount: xpToAdd,
            reference_type: 'lesson',
            reference_id: lessonId,
        });
    }

    // Update cumulative XP on user
    const newXp = (Number(existingUser.cumulative_xp) || 0) + xpToAdd;
    await db.update(users).set({ cumulative_xp: newXp }).where(eq(users.id, userId));
}

export async function getLessonsByCourse(courseId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const enrollment = await ensureEnrollment(session.userId, courseId);
    if (!enrollment) return [];

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    return courseLessons.map(l => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
    }));
}

export async function saveVideoProgress(lessonId: string, position: number) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const existing = await db.select().from(lessonProgress).where(
        and(
            eq(lessonProgress.user_id, session.userId),
            eq(lessonProgress.lesson_id, lessonId)
        )
    );

    if (existing.length > 0) {
        await db.update(lessonProgress)
            .set({ progress_pct: position.toString(), time_spent_secs: Math.round(position) })
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
            progress_pct: position.toString(),
        });
    }
}

export async function markLessonComplete(lessonId: string) {
    return completeLessonAndReward(lessonId);
}
