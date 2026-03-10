'use server';

import { getSystemHealth } from './redis-monitoring';
export { getSystemHealth };

import { db } from '@/lib/db';
import { z } from 'zod';
import { format, subDays, endOfDay, addMonths } from 'date-fns';
import { courses, lessons, paymentPlans, superAdmins, schoolAdmins, students, schools, lessonProgress, enrollments, schoolSubscriptions, paymentTransactions, courseProgress, classes, courseClassMapping, schoolClassMapping, quizzes, quizQuestions, studentAcademicRecords, academicSessions, promoCodes, auditLogs, platformSettings, platformMetricsDaily } from '@/db/schema';
import { eq, asc, desc, count, sql, and, lte, inArray } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redis, safeRedis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEYS = {
    STUDENTS: 'cache:admin:students',
    SCHOOLS: 'cache:admin:schools',
    COURSES: 'cache:admin:courses',
    META: 'cache:admin:meta' // Plans, Codes, Settings, Metrics
};

export async function invalidateAdminCache() {
    await redis.del(...Object.values(CACHE_KEYS));
}

export async function fetchAllAdminData() {
    // Attempt fragmented cache hit
    try {
        const [students, schools, courses, meta] = await Promise.all([
            safeRedis.get<any[]>(CACHE_KEYS.STUDENTS),
            safeRedis.get<any[]>(CACHE_KEYS.SCHOOLS),
            safeRedis.get<any[]>(CACHE_KEYS.COURSES),
            safeRedis.get<any>(CACHE_KEYS.META),
        ]);

        if (students && schools && courses && meta) {
            return { students, schools, courses, ...meta };
        }
    } catch (err) {
        console.error("Redis fragmented cache read error:", err);
    }

    // PRODUCTION GUARD: Cache Stampede Mutex (Wait if someone else is rebuilding)
    const lockKey = 'lock:admin:rebuild';
    const isLocked = await redis.set(lockKey, '1', 'EX', 10, 'NX');

    if (!isLocked) {
        // Wait 1s and try cache again before falling through to DB
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchAllAdminData();
    }

    let result: any = null;
    try {
        const studentsData = await db.query.students.findMany();
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
        const platformSettingsData = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });

        // Ensure we have real platform metrics
        let platformMetricsData = await db.query.platformMetricsDaily.findMany({
            orderBy: [asc(platformMetricsDaily.metric_date)],
            limit: 30
        });

        // If no metrics or very few, perform an on-the-fly aggregation and sync
        if (platformMetricsData.length < 5) {
            await syncPlatformMetrics();
            platformMetricsData = await db.query.platformMetricsDaily.findMany({
                orderBy: [asc(platformMetricsDaily.metric_date)],
                limit: 30
            });
        }

        // Count enrollments per course
        const enrollmentCounts = new Map<string, number>();
        enrollmentsData.forEach(e => {
            enrollmentCounts.set(e.course_id, (enrollmentCounts.get(e.course_id) || 0) + 1);
        });

        result = {
            students: studentsData.map(s => ({
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
            platformSettings: platformSettingsData || null,
            platformMetrics: platformMetricsData,
        };

        //Fragmented Cache Write for memory safety
        try {
            const { students, schools, courses, ...meta } = result;
            await Promise.all([
                safeRedis.set(CACHE_KEYS.STUDENTS, students, CACHE_TTL),
                safeRedis.set(CACHE_KEYS.SCHOOLS, schools, CACHE_TTL),
                safeRedis.set(CACHE_KEYS.COURSES, courses, CACHE_TTL),
                safeRedis.set(CACHE_KEYS.META, meta, CACHE_TTL),
            ]);
        } catch (err) {
            console.error("Redis fragmented cache write error:", err);
        }

    } finally {
        // Release lock
        await redis.del('lock:admin:rebuild');
    }

    return result;
}

export async function savePromoCode(data: any) {
    if (data.id) {
        const [updated] = await db.update(promoCodes).set({
            code: data.code,
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
            updated_at: new Date()
        }).where(eq(promoCodes.id, data.id)).returning();
        invalidateAdminCache();
        return [updated];
    } else {
        const [inserted] = await db.insert(promoCodes).values({
            code: data.code,
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
        }).returning();
        invalidateAdminCache();
        return [inserted];
    }
}

export async function deletePromoCode(id: string) {
    const session = await verifySession();
    const promo = await db.query.promoCodes.findFirst({ where: eq(promoCodes.id, id) });
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
    if (session && promo) {
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'delete',
            entity_type: 'promoCode',
            entity_id: id,
            old_values: promo
        } as any);
        invalidateAdminCache();
    }
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
            all_classes: courseData.all_classes ?? false,
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
            all_classes: courseData.all_classes ?? false,
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
    invalidateAdminCache();
}

export async function deleteCourseAdmin(id: string) {
    const session = await verifySession();
    const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
    await db.delete(courses).where(eq(courses.id, id));
    if (session && course) {
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'delete',
            entity_type: 'course',
            entity_id: id,
            old_values: course
        } as any);
        invalidateAdminCache();
    }
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
    const session = await verifySession();
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
    await db.delete(lessons).where(eq(lessons.id, id));
    if (lesson) {
        await updateCourseTotals(lesson.course_id);
        if (session) {
            await db.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: 'delete',
                entity_type: 'lesson',
                entity_id: id,
                old_values: lesson
            } as any);
        }
    }
}

export async function saveLessonOrderAdmin(updates: any[]) {
    for (const update of updates) {
        await db.update(lessons)
            .set({ sequence_order: update.sequence_index || update.sequence_order })
            .where(eq(lessons.id, update.id));
    }
    invalidateAdminCache();
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
        const result = { ...updated, price: Number(updated.price) };
        invalidateAdminCache();
        return result;
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
        const result = { ...created, price: Number(created.price) };
        invalidateAdminCache();
        return result;
    }
}

export async function deletePlanAdmin(id: string) {
    const activeSubs = await db.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.plan_id, id));
    if (activeSubs.length > 0) {
        throw new Error("Cannot delete plan: This tier is currently being utilized by active institutions.");
    }
    const session = await verifySession();
    const plan = await db.query.paymentPlans.findFirst({ where: eq(paymentPlans.id, id) });
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
    if (session && plan) {
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'delete',
            entity_type: 'paymentPlan',
            entity_id: id,
            old_values: plan
        } as any);
        invalidateAdminCache();
    }
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const session = await verifySession();
    const oldSchool = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });

    const [updated] = await db.update(schools)
        .set({ is_active: isActive })
        .where(eq(schools.id, schoolId))
        .returning();

    if (session && oldSchool) {
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'update',
            entity_type: 'school',
            entity_id: schoolId,
            old_values: oldSchool,
            new_values: updated
        } as any);
        invalidateAdminCache();
    }
    return updated;
}

const schoolAdminSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, 'Institution name too short'),
    email: z.string().email('Invalid contact email'),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().default('IN'),
    pincode: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable().or(z.literal('')),
    website: z.string().url().optional().nullable().or(z.literal('')),
    is_active: z.boolean().default(true),
    data_processing_consent: z.boolean().default(false),
    minor_data_guardian_consent: z.boolean().default(false),
    classIds: z.array(z.string().uuid()).optional(),
    slug: z.string().optional(),
});

export async function saveSchoolAdmin(schoolData: any) {
    const session = await verifySession();
    if (!session || session.userType !== 'super_admin') throw new Error('Unauthorized');

    const validatedData = schoolAdminSchema.parse(schoolData);
    const email = validatedData.email.toLowerCase().trim();
    const slug = validatedData.slug || validatedData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await db.transaction(async (tx) => {
        let schoolId = validatedData.id;
        let oldSchool = null;

        if (schoolId) {
            oldSchool = await tx.query.schools.findFirst({ where: eq(schools.id, schoolId) });
            await tx.update(schools).set({
                name: validatedData.name,
                email: email,
                phone: validatedData.phone || null,
                address: validatedData.address || null,
                city: validatedData.city || null,
                state: validatedData.state || null,
                country: validatedData.country,
                pincode: validatedData.pincode || null,
                logo_url: validatedData.logo_url || null,
                website: validatedData.website || null,
                is_active: validatedData.is_active,
                data_processing_consent: validatedData.data_processing_consent,
                minor_data_guardian_consent: validatedData.minor_data_guardian_consent,
                updated_at: new Date(),
            }).where(eq(schools.id, schoolId));
        } else {
            // Create School
            const [created] = await tx.insert(schools).values({
                name: validatedData.name,
                slug: slug,
                email: email,
                phone: validatedData.phone || null,
                address: validatedData.address || null,
                city: validatedData.city || null,
                state: validatedData.state || null,
                country: validatedData.country,
                pincode: validatedData.pincode || null,
                logo_url: validatedData.logo_url || null,
                website: validatedData.website || null,
                is_active: validatedData.is_active,
                data_processing_consent: validatedData.data_processing_consent,
                minor_data_guardian_consent: validatedData.minor_data_guardian_consent,
            } as any).returning();
            schoolId = created.id;

            // Create Initial Academic Session
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
        if (validatedData.classIds) {
            await tx.delete(schoolClassMapping).where(eq(schoolClassMapping.school_id, schoolId!));
            if (validatedData.classIds.length > 0) {
                await tx.insert(schoolClassMapping).values(
                    validatedData.classIds.map((cid: string) => ({
                        school_id: schoolId,
                        class_id: cid,
                        is_active: true
                    }))
                );
            }
        }

        const updated = await tx.query.schools.findFirst({ where: eq(schools.id, schoolId!) });

        // Audit Logging
        if (session && updated) {
            await tx.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: validatedData.id ? 'update' : 'create',
                entity_type: 'institution',
                entity_id: updated.id,
                old_values: oldSchool,
                new_values: updated
            } as any);
        }

        invalidateAdminCache();
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
                    time_limit_secs: q.time_limit_secs || 0,
                    sequence_order: idx + 1,
                }))
            );
        }
    }

    invalidateAdminCache();
    return await fetchQuizAdmin(quizData.lesson_id);
}

export async function deleteQuizAdmin(quizId: string) {
    // quiz_questions cascade via FK — only need to delete the quiz
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
    invalidateAdminCache();
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

        invalidateAdminCache();

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
                    time_limit_secs: q.time_limit_secs,
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

export async function syncPlatformMetrics() {
    try {
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const d = subDays(new Date(), i);
            last30Days.push(format(d, 'yyyy-MM-dd'));
        }

        // Optimized grouping queries
        const revenueByDay = await db.select({
            date: sql`DATE(${paymentTransactions.created_at})::text`,
            total: sql`SUM(CAST(amount AS NUMERIC))`
        }).from(paymentTransactions)
            .where(eq(paymentTransactions.status, 'captured'))
            .groupBy(sql`DATE(${paymentTransactions.created_at})`);

        const activeByDay = await db.select({
            date: sql`DATE(${lessonProgress.updated_at})::text`,
            count: count(sql`DISTINCT ${lessonProgress.user_id}`)
        }).from(lessonProgress)
            .groupBy(sql`DATE(${lessonProgress.updated_at})`);

        // Get all students/enrollments/schools to compute cumulative counts in memory (efficient for current scale)
        const allStudents = await db.select({ created_at: students.created_at }).from(students).where(eq(students.is_active, true));
        const allEnrollments = await db.select({ enrolled_at: enrollments.enrolled_at }).from(enrollments);
        const allSchools = await db.select({ created_at: schools.created_at, is_active: schools.is_active }).from(schools);

        for (const dateStr of last30Days) {
            const dayEnd = endOfDay(new Date(dateStr));

            const totalStudents = allStudents.filter(s => new Date(s.created_at) <= dayEnd).length;
            const totalEnrollments = allEnrollments.filter(e => new Date(e.enrolled_at) <= dayEnd).length;
            const totalSchoolsCount = allSchools.filter(s => new Date(s.created_at) <= dayEnd).length;
            const activeSchoolsCount = allSchools.filter(s => s.is_active && new Date(s.created_at) <= dayEnd).length;

            const revenueDay = revenueByDay.find(r => r.date === dateStr);
            const activeDay = activeByDay.find(a => a.date === dateStr);

            await db.insert(platformMetricsDaily).values({
                metric_date: dateStr,
                total_students: totalStudents,
                active_students: Number(activeDay?.count || 0),
                total_enrollments: totalEnrollments,
                revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                total_schools: totalSchoolsCount,
                active_schools: activeSchoolsCount,
            } as any).onConflictDoUpdate({
                target: platformMetricsDaily.metric_date,
                set: {
                    total_students: totalStudents,
                    active_students: Number(activeDay?.count || 0),
                    total_enrollments: totalEnrollments,
                    revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                    total_schools: totalSchoolsCount,
                    active_schools: activeSchoolsCount,
                    created_at: new Date()
                }
            });
        }
        invalidateAdminCache();
        return { success: true };
    } catch (error) {
        console.error("Error syncing platform metrics:", error);
        return { success: false, error };
    }
}

// ============================================================================
// CLASS MANAGEMENT
// ============================================================================

const DEFAULT_CLASSES = Array.from({ length: 12 }, (_, i) => ({
    name: `Class ${i + 1}`,
    level: i + 1,
}));

/**
 * Auto-seed: ensures Class 1–12 always exist.
 * Safe to call repeatedly (skips existing names).
 */
export async function ensureDefaultClasses() {
    try {
        const existing = await db.select({ name: classes.name }).from(classes);
        const existingNames = new Set(existing.map(c => c.name));
        const missing = DEFAULT_CLASSES.filter(c => !existingNames.has(c.name));

        if (missing.length > 0) {
            await db.insert(classes).values(
                missing.map(c => ({ name: c.name, level: c.level }))
            );
            console.log(`✅ Auto-seeded ${missing.length} default classes`);
        }
        return { success: true, seeded: missing.length };
    } catch (error: any) {
        console.error('Failed to auto-seed classes:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchAllClasses() {
    try {
        const allClasses = await db.select().from(classes).orderBy(asc(classes.level));
        return allClasses;
    } catch (error: any) {
        console.error('Failed to fetch classes:', error);
        return [];
    }
}

export async function createClass(name: string, level: number) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized' };
        }

        if (!name || !name.trim()) {
            return { success: false, error: 'Class name is required' };
        }
        if (!level || level < 0) {
            return { success: false, error: 'A valid level number is required' };
        }

        // Check duplicates
        const existing = await db.select().from(classes)
            .where(eq(classes.name, name.trim()));
        if (existing.length > 0) {
            return { success: false, error: `A class named "${name.trim()}" already exists` };
        }

        const existingLevel = await db.select().from(classes)
            .where(eq(classes.level, level));
        if (existingLevel.length > 0) {
            return { success: false, error: `Level ${level} is already assigned to "${existingLevel[0].name}"` };
        }

        const [newClass] = await db.insert(classes).values({
            name: name.trim(),
            level: level,
        }).returning();

        return { success: true, data: newClass };
    } catch (error: any) {
        console.error('Failed to create class:', error);
        return { success: false, error: error.message || 'Failed to create class' };
    }
}

export async function deleteClass(classId: string) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if any school is using this class
        const mappings = await db.select().from(schoolClassMapping)
            .where(eq(schoolClassMapping.class_id, classId));

        if (mappings.length > 0) {
            return {
                success: false,
                error: `This class is assigned to ${mappings.length} school(s). Unassign it from all schools first.`
            };
        }

        // Check if any student academic records reference this class
        const studentRecords = await db.select().from(studentAcademicRecords)
            .where(eq(studentAcademicRecords.class_id, classId));

        if (studentRecords.length > 0) {
            return {
                success: false,
                error: `This class has ${studentRecords.length} student record(s). It cannot be deleted.`
            };
        }

        await db.delete(classes).where(eq(classes.id, classId));
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete class:', error);
        return { success: false, error: error.message || 'Failed to delete class' };
    }
}
