'use server';

import { db } from '@/lib/db';
import { courses, lessons, paymentPlans, users, schools, lessonProgress, enrollments, schoolSubscriptions, paymentTransactions, courseProgress, grades, courseGradeMapping, quizzes, quizQuestions } from '@/db/schema';
import { eq, asc, desc, count, sql, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { addMonths } from 'date-fns';

export async function fetchAllAdminData() {
    const students = await db.query.users.findMany({ where: (u, { eq }) => eq(u.role, 'student') });
    const schoolsData = await db.query.schools.findMany({ orderBy: [asc(schools.name)] });
    const coursesData = await db.query.courses.findMany({ orderBy: [desc(courses.created_at)] });
    const lessonsData = await db.query.lessons.findMany({ orderBy: [asc(lessons.sequence_order)] });
    const plansData = await db.query.paymentPlans.findMany({ orderBy: [asc(paymentPlans.price)] });
    const gradesData = await db.query.grades.findMany({ orderBy: [asc(grades.level)] });
    const courseGradeMappingsData = await db.query.courseGradeMapping.findMany();
    const progressData = await db.select().from(lessonProgress);
    const enrollmentsData = await db.select().from(enrollments);
    const subscriptionsData = await db.select().from(schoolSubscriptions);
    const transactionsData = await db.select().from(paymentTransactions);
    const courseProgressData = await db.select().from(courseProgress);

    // Count enrollments per course
    const enrollmentCounts = new Map<string, number>();
    enrollmentsData.forEach(e => {
        enrollmentCounts.set(e.course_id, (enrollmentCounts.get(e.course_id) || 0) + 1);
    });

    return {
        students: students.map(s => ({
            ...s,
            full_name: `${s.first_name} ${s.last_name}`,
            total_xp: Number(s.cumulative_xp),
            level: Math.floor((Number(s.cumulative_xp) || 0) / 500) + 1,
        })),
        schools: schoolsData,
        courses: coursesData.map(c => ({
            ...c,
            thumbnail: c.thumbnail_url,
            published: c.is_published,
            enrolled_count: enrollmentCounts.get(c.id) || 0,
        })),
        lessons: lessonsData.map(l => ({
            ...l,
            sequence_index: l.sequence_order,
            duration: l.duration_minutes || 10,
        })),
        grades: gradesData,
        courseGradeMappings: courseGradeMappingsData,
        plans: plansData.map(p => ({
            ...p,
            price: Number(p.price),
            trial_days: p.trial_days || 0,
            currency: p.currency || 'INR',
            features: Array.isArray(p.features) ? p.features : (typeof p.features === 'object' && p.features ? Object.values(p.features as Record<string, string>) : []),
        })),
        progress: progressData,
        enrollments: enrollmentsData,
        subscriptions: subscriptionsData,
        transactions: transactionsData,
        courseProgress: courseProgressData,
    };
}

export async function fetchCourseLessons(courseId: string) {
    const data = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: [asc(lessons.sequence_order)]
    });
    return data.map(l => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
    }));
}

export async function saveCourseAdmin(courseData: any) {
    const slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let courseId = courseData.id;

    if (courseId) {
        await db.update(courses).set({
            title: courseData.title,
            slug: slug,
            description: courseData.description || '',
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url || '',
            is_published: courseData.published ?? courseData.is_published ?? false,
        }).where(eq(courses.id, courseId));
    } else {
        const session = await verifySession();
        const createdBy = courseData.created_by || courseData.userId || session?.userId;
        if (!createdBy) throw new Error("Unauthorized: Cannot create course without user ID.");

        const [created] = await db.insert(courses).values({
            title: courseData.title,
            slug: slug,
            description: courseData.description || '',
            thumbnail_url: courseData.thumbnail || courseData.thumbnail_url || '',
            is_published: courseData.published ?? courseData.is_published ?? false,
            created_by: createdBy,
            total_lessons: 0,
            total_xp: 0,
        } as any).returning();
        courseId = created.id;
    }

    // Handle grade mappings if provided
    if (courseData.gradeIds && Array.isArray(courseData.gradeIds)) {
        // Clear existing
        await db.delete(courseGradeMapping).where(eq(courseGradeMapping.course_id, courseId));

        // Add new
        if (courseData.gradeIds.length > 0) {
            await db.insert(courseGradeMapping).values(
                courseData.gradeIds.map((gradeId: string) => ({
                    course_id: courseId,
                    grade_id: gradeId
                }))
            );
        }
    }

    // Auto-compute total_lessons and total_xp
    await updateCourseTotals(courseId);

    const updatedCourse = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    return { ...updatedCourse, thumbnail: updatedCourse?.thumbnail_url, published: updatedCourse?.is_published };
}

async function updateCourseTotals(courseId: string) {
    const courseLessons = await db.query.lessons.findMany({ where: eq(lessons.course_id, courseId) });
    const totalLessons = courseLessons.length;
    const totalXp = courseLessons.reduce((sum, l) => sum + (l.xp_reward || 0), 0);
    await db.update(courses).set({ total_lessons: totalLessons, total_xp: totalXp }).where(eq(courses.id, courseId));
}

export async function deleteCourseAdmin(id: string) {
    await db.delete(courses).where(eq(courses.id, id));
}

export async function fetchLessonAdmin(id: string) {
    return await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
}

export async function saveLessonAdmin(lessonData: any) {
    if (lessonData.id) {
        const [updated] = await db.update(lessons).set({
            title: lessonData.title,
            description: lessonData.description || '',
            content_type: lessonData.content_type,
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 10,
            duration_minutes: lessonData.duration || lessonData.duration_minutes || 10,
            is_published: lessonData.is_published ?? true,
        }).where(eq(lessons.id, lessonData.id)).returning();

        await updateCourseTotals(updated.course_id);
        return { ...updated, sequence_index: updated.sequence_order, duration: updated.duration_minutes };
    } else {
        const courseLessons = await db.query.lessons.findMany({ where: eq(lessons.course_id, lessonData.course_id) });
        const maxOrder = courseLessons.reduce((max, l) => Math.max(max, l.sequence_order), 0);
        const newOrder = maxOrder + 1;

        const [created] = await db.insert(lessons).values({
            course_id: lessonData.course_id,
            title: lessonData.title,
            description: lessonData.description || '',
            content_type: lessonData.content_type || 'video',
            content_url: lessonData.content_url || '',
            xp_reward: lessonData.xp_reward || 10,
            duration_minutes: lessonData.duration || lessonData.duration_minutes || 10,
            sequence_order: newOrder,
            is_published: lessonData.is_published ?? true,
        } as any).returning();

        await updateCourseTotals(created.course_id);
        return { ...created, sequence_index: created.sequence_order, duration: created.duration_minutes };
    }
}

export async function deleteLessonAdmin(id: string) {
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
    await db.delete(lessons).where(eq(lessons.id, id));
    if (lesson) await updateCourseTotals(lesson.course_id);
}

export async function saveLessonOrderAdmin(updates: any[]) {
    for (const update of updates) {
        await db.update(lessons)
            .set({ sequence_order: update.sequence_index || update.sequence_order })
            .where(eq(lessons.id, update.id));
    }
}

export async function savePlanAdmin(planData: any) {
    if (planData.id) {
        const [updated] = await db.update(paymentPlans).set({
            name: planData.name,
            description: planData.description || '',
            price: planData.price.toString(),
            billing_cycle: planData.billing_cycle || 'monthly',
            currency: planData.currency || 'INR',
            features: planData.features || {},
            max_students: planData.max_students,
            trial_days: planData.trial_days || 0,
            is_active: planData.is_active ?? true,
        }).where(eq(paymentPlans.id, planData.id)).returning();
        return { ...updated, price: Number(updated.price) };
    } else {
        const [created] = await db.insert(paymentPlans).values({
            name: planData.name,
            description: planData.description || '',
            price: planData.price.toString(),
            billing_cycle: planData.billing_cycle || 'monthly',
            currency: planData.currency || 'INR',
            features: planData.features || {},
            max_students: planData.max_students,
            trial_days: planData.trial_days || 0,
            is_active: planData.is_active ?? true,
        } as any).returning();
        return { ...created, price: Number(created.price) };
    }
}

export async function deletePlanAdmin(id: string) {
    const activeSubs = await db.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.plan_id, id));
    if (activeSubs.length > 0) {
        throw new Error("Cannot delete plan: This tier is currently being utilized by active institutions.");
    }
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const [updated] = await db.update(schools)
        .set({ is_active: isActive })
        .where(eq(schools.id, schoolId))
        .returning();
    return updated;
}

export async function saveSchoolAdmin(schoolData: any) {
    const slug = schoolData.slug || schoolData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (schoolData.id) {
        const [updated] = await db.update(schools).set({
            name: schoolData.name,
            email: schoolData.email,
            phone: schoolData.phone || null,
            address: schoolData.address || null,
            city: schoolData.city || null,
            state: schoolData.state || null,
            country: schoolData.country || 'IN',
            pincode: schoolData.pincode || null,
            logo_url: schoolData.logo_url || null,
            website: schoolData.website || null,
            is_active: schoolData.is_active ?? true,
            data_processing_consent: schoolData.data_processing_consent ?? false,
            minor_data_guardian_consent: schoolData.minor_data_guardian_consent ?? false,
        }).where(eq(schools.id, schoolData.id)).returning();
        return updated;
    } else {
        const [created] = await db.insert(schools).values({
            name: schoolData.name,
            slug: slug,
            email: schoolData.email,
            phone: schoolData.phone || null,
            address: schoolData.address || null,
            city: schoolData.city || null,
            state: schoolData.state || null,
            country: schoolData.country || 'IN',
            pincode: schoolData.pincode || null,
            logo_url: schoolData.logo_url || null,
            website: schoolData.website || null,
            is_active: schoolData.is_active ?? true,
            data_processing_consent: schoolData.data_processing_consent ?? false,
            minor_data_guardian_consent: schoolData.minor_data_guardian_consent ?? false,
        } as any).returning();
        return created;
    }
}

export async function fetchQuizAdmin(lessonId: string) {
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
                    sequence_order: idx + 1,
                }))
            );
        }
    }

    return await fetchQuizAdmin(quizData.lesson_id);
}

export async function deleteQuizAdmin(quizId: string) {
    // quiz_questions cascade via FK — only need to delete the quiz
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
}

export async function assignPlanToSchool(schoolId: string, planId: string, billingMonths: number = 12) {
    const now = new Date();
    const periodEnd = addMonths(now, billingMonths);

    // Check if subscription already exists for this school
    const existing = await db.query.schoolSubscriptions.findFirst({
        where: eq(schoolSubscriptions.school_id, schoolId),
    });

    if (existing) {
        const [updated] = await db.update(schoolSubscriptions).set({
            plan_id: planId,
            status: 'active',
            current_period_start: now,
            current_period_end: periodEnd,
            updated_at: now,
        }).where(eq(schoolSubscriptions.id, existing.id)).returning();
        return updated;
    } else {
        const [created] = await db.insert(schoolSubscriptions).values({
            school_id: schoolId,
            plan_id: planId,
            status: 'active',
            current_period_start: now,
            current_period_end: periodEnd,
            auto_renew: true,
        } as any).returning();
        return created;
    }
}
