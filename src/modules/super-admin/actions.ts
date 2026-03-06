'use server';

import { db } from '@/lib/db';
import { courses, lessons, paymentPlans, users, schools, lessonProgress, enrollments, schoolSubscriptions, paymentTransactions, courseProgress, classes, courseClassMapping, schoolClassMapping, quizzes, quizQuestions, studentAcademicRecords, academicSessions, promoCodes } from '@/db/schema';
import { eq, asc, desc, count, sql, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { addMonths } from 'date-fns';
import bcrypt from 'bcryptjs';

export async function fetchAllAdminData() {
    const students = await db.query.users.findMany({ where: (u, { eq }) => eq(u.role, 'student') });
    const schoolsData = await db.query.schools.findMany({ orderBy: [asc(schools.name)] });
    const coursesData = await db.query.courses.findMany({ orderBy: [desc(courses.created_at)] });
    const lessonsData = await db.query.lessons.findMany({ orderBy: [asc(lessons.sequence_order)] });
    const plansData = await db.query.paymentPlans.findMany({ orderBy: [asc(paymentPlans.price)] });
    const classesData = await db.query.classes.findMany({ orderBy: [asc(classes.level)] });
    const courseClassMappingsData = await db.query.courseClassMapping.findMany();
    const schoolClassMappingsData = await db.query.schoolClassMapping.findMany();
    const progressData = await db.select().from(lessonProgress);
    const enrollmentsData = await db.select().from(enrollments);
    const subscriptionsData = await db.select().from(schoolSubscriptions);
    const transactionsData = await db.select().from(paymentTransactions);
    const courseProgressData = await db.select().from(courseProgress);
    const promoCodesData = await db.select().from(promoCodes);

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
        schools: schoolsData.map(s => ({
            ...s,
            classIds: schoolClassMappingsData.filter(m => m.school_id === s.id).map(m => m.class_id)
        })),
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
        classes: classesData,
        courseClassMappings: courseClassMappingsData,
        plans: plansData.map(p => ({
            ...p,
            price: Number(p.price),
            trial_days: p.trial_days || 0,
            currency: p.currency || 'INR',
            is_active: p.is_active ?? true,
            is_popular: p.is_popular ?? false,
            features: Array.isArray(p.features) ? p.features : (typeof p.features === 'object' && p.features ? Object.values(p.features as Record<string, string>) : []),
        })),
        progress: progressData,
        enrollments: enrollmentsData,
        subscriptions: subscriptionsData,
        transactions: transactionsData,
        courseProgress: courseProgressData,
        promoCodes: promoCodesData,
    };
}

export async function savePromoCode(data: any) {
    if (data.id) {
        return await db.update(promoCodes).set({
            code: data.code,
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
            updated_at: new Date()
        }).where(eq(promoCodes.id, data.id)).returning();
    } else {
        return await db.insert(promoCodes).values({
            code: data.code,
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
        }).returning();
    }
}

export async function deletePromoCode(id: string) {
    return await db.delete(promoCodes).where(eq(promoCodes.id, id));
}

export async function validatePromoCode(code: string) {
    const promo = await db.query.promoCodes.findFirst({
        where: eq(promoCodes.code, code.toUpperCase()),
    });

    if (!promo) return { success: false, error: 'Invalid promo code' };
    if (!promo.is_active) return { success: false, error: 'Promo code is inactive' };
    if (promo.max_uses && promo.current_uses >= promo.max_uses) return { success: false, error: 'Promo code usage limit reached' };

    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) return { success: false, error: 'Promo code is not yet valid' };
    if (promo.valid_until && new Date(promo.valid_until) < now) return { success: false, error: 'Promo code has expired' };

    return { success: true, promo };
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

    // Handle class mappings if provided
    if (courseData.classIds && Array.isArray(courseData.classIds)) {
        // Clear existing
        await db.delete(courseClassMapping).where(eq(courseClassMapping.course_id, courseId));

        // Add new
        if (courseData.classIds.length > 0) {
            await db.insert(courseClassMapping).values(
                courseData.classIds.map((classId: string) => ({
                    course_id: courseId,
                    class_id: classId
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
    if (planData.is_popular) {
        // Only one plan can be featured
        await db.update(paymentPlans).set({ is_popular: false });
    }

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
            is_popular: planData.is_popular ?? false,
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
            is_popular: planData.is_popular ?? false,
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
    if (!schoolData.name || !schoolData.email) {
        throw new Error('Institution name and email are required.');
    }

    const email = schoolData.email.toLowerCase().trim();
    const slug = schoolData.slug || schoolData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await db.transaction(async (tx) => {
        let schoolId = schoolData.id;

        if (schoolData.id) {
            // Update School
            await tx.update(schools).set({
                name: schoolData.name,
                email: email,
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
                updated_at: new Date(),
            }).where(eq(schools.id, schoolData.id));
        } else {
            // Create School
            const [created] = await tx.insert(schools).values({
                name: schoolData.name,
                slug: slug,
                email: email,
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
            schoolId = created.id;

            // Create Initial Academic Session for new schools
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(startDate.getFullYear() + 1);
            await tx.insert(academicSessions).values({
                name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
                school_id: schoolId,
                is_current: true,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            } as any);
        }

        // Handle Class Mappings
        if (schoolData.classIds) {
            await tx.delete(schoolClassMapping).where(eq(schoolClassMapping.school_id, schoolId));
            if (schoolData.classIds.length > 0) {
                await tx.insert(schoolClassMapping).values(
                    schoolData.classIds.map((cid: string) => ({
                        school_id: schoolId,
                        class_id: cid,
                        is_active: true
                    }))
                );
            }
        }

        const updated = await tx.query.schools.findFirst({ where: eq(schools.id, schoolId) });
        return updated;
    });
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

export async function assignPlanToSchool(schoolId: string, planId: string, billingMonths: number = 12, promoCodeId?: string | null) {
    const now = new Date();
    const periodEnd = addMonths(now, billingMonths);

    return await db.transaction(async (tx) => {
        // Increment promo code usage if applicable
        if (promoCodeId) {
            await tx.update(promoCodes)
                .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
                .where(eq(promoCodes.id, promoCodeId));
        }

        // Check if subscription already exists for this school
        const existing = await tx.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.school_id, schoolId),
        });

        if (existing) {
            const [updated] = await tx.update(schoolSubscriptions).set({
                plan_id: planId,
                promo_code_id: promoCodeId || null,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now,
            }).where(eq(schoolSubscriptions.id, existing.id)).returning();
            return updated;
        } else {
            const [created] = await tx.insert(schoolSubscriptions).values({
                school_id: schoolId,
                plan_id: planId,
                promo_code_id: promoCodeId ? promoCodeId : null,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                auto_renew: true,
            } as any).returning();
            return created;
        }
    });
}

export async function saveStudentAdmin(userData: any) {
    const email = userData.email.toLowerCase().trim();

    return await db.transaction(async (tx) => {
        let userId = userData.id;

        if (userData.id) {
            // Update
            const checkEmail = await tx.query.users.findFirst({
                where: and(eq(users.email, email), sql`${users.id} != ${userData.id}`)
            });
            if (checkEmail) throw new Error("A user with this email already exists.");

            const updateData: any = {
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: email,
                school_id: userData.school_id,
            };
            if (userData.password) {
                updateData.password_hash = await bcrypt.hash(userData.password, 10);
            }

            await tx.update(users).set(updateData).where(eq(users.id, userData.id));
        } else {
            // Create
            const checkEmail = await tx.query.users.findFirst({ where: eq(users.email, email) });
            if (checkEmail) throw new Error("A user with this email already exists.");

            if (!userData.password) throw new Error("Password is required for new students.");
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [created] = await tx.insert(users).values({
                email: email,
                password_hash: hashedPassword,
                first_name: userData.first_name,
                last_name: userData.last_name,
                school_id: userData.school_id,
                role: 'student',
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
            } as any).returning();
            userId = created.id;
        }

        // Handle session and academic record
        if (userData.class_id && userData.school_id) {
            let session = await tx.query.academicSessions.findFirst({
                where: and(
                    eq(academicSessions.school_id, userData.school_id),
                    eq(academicSessions.is_current, true)
                )
            });

            if (!session) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(startDate.getFullYear() + 1);

                const [newSession] = await tx.insert(academicSessions).values({
                    name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
                    school_id: userData.school_id,
                    is_current: true,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                } as any).returning();
                session = newSession;
            }

            const existingRecord = await tx.query.studentAcademicRecords.findFirst({
                where: and(
                    eq(studentAcademicRecords.user_id, userId),
                    eq(studentAcademicRecords.school_id, userData.school_id),
                    eq(studentAcademicRecords.session_id, session.id)
                )
            });

            if (existingRecord) {
                await tx.update(studentAcademicRecords)
                    .set({ class_id: userData.class_id })
                    .where(eq(studentAcademicRecords.id, existingRecord.id));
            } else {
                await tx.insert(studentAcademicRecords).values({
                    user_id: userId,
                    school_id: userData.school_id,
                    session_id: session.id,
                    class_id: userData.class_id,
                } as any).onConflictDoNothing();
            }
        }

        const updated = await tx.query.users.findFirst({ where: eq(users.id, userId) });
        return {
            ...updated,
            full_name: `${updated?.first_name} ${updated?.last_name}`,
            total_xp: Number(updated?.cumulative_xp),
            level: Math.floor((Number(updated?.cumulative_xp) || 0) / 500) + 1,
        } as any;
    });
}

/**
 * FETCH GLOBAL ENTITIES FOR REUSE
 */

export async function fetchGlobalLessons() {
    const data = await db.query.lessons.findMany({
        with: {
            course: true
        },
        orderBy: [desc(lessons.created_at)]
    });
    return data.map(l => ({
        ...l,
        course_title: (l as any).course?.title || 'Unknown Course'
    }));
}

export async function fetchGlobalQuizzes() {
    const data = await db.query.quizzes.findMany({
        with: {
            course: true,
            lesson: true
        }
    });
    return data.map(q => ({
        ...q,
        course_title: (q as any).course?.title || 'Unknown Course',
        lesson_title: (q as any).lesson?.title || 'Unknown Lesson'
    }));
}

/**
 * DEEP CLONING LOGIC
 */

export async function cloneQuizAction(quizId: string, targetLessonId: string, targetCourseId: string) {
    return await db.transaction(async (tx) => {
        const sourceQuiz = await tx.query.quizzes.findFirst({
            where: eq(quizzes.id, quizId),
            with: { questions: true }
        });

        if (!sourceQuiz) throw new Error("Source quiz not found");

        // 1. Create New Quiz
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

        // 2. Clone Questions
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
                    sequence_order: q.sequence_order,
                }))
            );
        }

        return clonedQuiz;
    });
}

export async function cloneLessonAction(lessonId: string, targetCourseId: string) {
    return await db.transaction(async (tx) => {
        const sourceLesson = await tx.query.lessons.findFirst({
            where: eq(lessons.id, lessonId)
        });

        if (!sourceLesson) throw new Error("Source lesson not found");

        const courseLessons = await tx.query.lessons.findMany({ where: eq(lessons.course_id, targetCourseId) });
        const maxOrder = courseLessons.reduce((max, l) => Math.max(max, l.sequence_order), 0);

        // 1. Clone Lesson
        const [clonedLesson] = await tx.insert(lessons).values({
            course_id: targetCourseId,
            title: `${sourceLesson.title} (Copy)`,
            description: sourceLesson.description,
            content_type: sourceLesson.content_type,
            content_url: sourceLesson.content_url,
            xp_reward: sourceLesson.xp_reward,
            duration_minutes: sourceLesson.duration_minutes,
            sequence_order: maxOrder + 1,
            is_published: sourceLesson.is_published,
        } as any).returning();

        // 2. If it has a quiz, clone that too
        const sourceQuiz = await tx.query.quizzes.findFirst({
            where: eq(quizzes.lesson_id, lessonId)
        });

        if (sourceQuiz) {
            await cloneQuizAction(sourceQuiz.id, clonedLesson.id, targetCourseId);
        }

        await updateCourseTotals(targetCourseId);
        return clonedLesson;
    });
}
