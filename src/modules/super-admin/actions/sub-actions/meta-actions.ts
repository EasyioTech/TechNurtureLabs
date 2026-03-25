'use server';

import { db } from '@/lib/db';
import { 
    paymentPlans, promoCodes, classes, 
    platformSettings, platformMetricsDaily, 
    auditLogs, schoolSubscriptions, students, enrollments, schools, paymentTransactions, lessonProgress
} from '@/db/schema';
import { eq, asc, desc, count, sql, and, lte, inArray, not, isNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';
import { format, subDays, endOfDay } from 'date-fns';

const CACHE_KEY = 'cache:admin:meta';

export async function fetchAdminMetadata() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    // 1. Try to serve from cache
    try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            console.log('[Metadata] Serving from cache...');
            return JSON.parse(cached);
        }
    } catch (_) { /* Best effort */ }

    // 2. Fetch from DB
    console.log('[Metadata] Fetching from DB...');
    const [plansData, classesData, promoCodesData, settingsData, metricsData] = await Promise.all([
        db.query.paymentPlans.findMany({ orderBy: [asc(paymentPlans.price)] }),
        db.query.classes.findMany({ orderBy: [asc(classes.level)] }),
        db.select().from(promoCodes),
        db.query.platformSettings.findFirst({ where: eq(platformSettings.id, 'global') }),
        db.query.platformMetricsDaily.findMany({ 
            orderBy: [desc(platformMetricsDaily.metric_date)], 
            limit: 30 
        })
    ]);

    const result = {
        plans: plansData.map(p => ({
            ...p,
            price: Number(p.price),
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
        })),
        classes: classesData,
        promoCodes: promoCodesData,
        platformSettings: settingsData || null,
        platformMetrics: metricsData.reverse(),
    };

    // 3. Store in cache for 10 mins
    try {
        await redis.setex(CACHE_KEY, 600, JSON.stringify(result));
    } catch (_) { /* Best effort */ }

    return result;
}

export async function savePromoCode(data: any) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    if (data.id) {
        const [updated] = await db.update(promoCodes).set({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
            updated_at: new Date()
        }).where(eq(promoCodes.id, data.id)).returning();
        await redis.del(CACHE_KEY);
        return [updated];
    } else {
        const [inserted] = await db.insert(promoCodes).values({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value?.toString(),
            max_uses: data.max_uses,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
        }).returning();
        await redis.del(CACHE_KEY);
        return [inserted];
    }
}

export async function deletePromoCode(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
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
        await redis.del(CACHE_KEY);
    }
}

export async function savePlanAdmin(planData: any) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    if (planData.is_popular) {
        await db.update(paymentPlans).set({ is_popular: false });
    }

    const planPayload = {
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
        updated_at: new Date()
    };

    if (planData.id) {
        const [updated] = await db.update(paymentPlans).set(planPayload).where(eq(paymentPlans.id, planData.id)).returning();
        await redis.del(CACHE_KEY);
        return { ...updated, price: Number(updated.price) };
    } else {
        const [created] = await db.insert(paymentPlans).values(planPayload as any).returning();
        await redis.del(CACHE_KEY);
        return { ...created, price: Number(created.price) };
    }
}

export async function deletePlanAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const activeSubs = await db.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.plan_id, id));
    if (activeSubs.length > 0) {
        throw new Error("Cannot delete plan: This tier is currently being utilized by active institutions.");
    }
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
        await redis.del(CACHE_KEY);
    }
}

export async function syncPlatformMetrics() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    try {
        const last30Days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = subDays(today, i);
            last30Days.push(format(d, 'yyyy-MM-dd'));
        }

        const [revenueByDay, activeByDay, allStudents, allEnrollments, allSchools] = await Promise.all([
            db.select({
                date: sql`DATE(${paymentTransactions.created_at})::text`,
                total: sql`SUM(CAST(amount AS NUMERIC))`
            }).from(paymentTransactions)
                .where(eq(paymentTransactions.status, 'captured'))
                .groupBy(sql`DATE(${paymentTransactions.created_at})`),

            db.select({
                date: sql`DATE(${lessonProgress.updated_at})::text`,
                count: count(sql`DISTINCT ${lessonProgress.user_id}`)
            }).from(lessonProgress)
                .groupBy(sql`DATE(${lessonProgress.updated_at})`),

            db.select({ created_at: students.created_at }).from(students).where(eq(students.is_active, true)),
            db.select({ enrolled_at: enrollments.enrolled_at }).from(enrollments),
            db.select({ created_at: schools.created_at, is_active: schools.is_active }).from(schools)
        ]);

        for (const dateStr of last30Days) {
            const dayEnd = endOfDay(new Date(dateStr));
            const totalStudentsCount = allStudents.filter(s => new Date(s.created_at) <= dayEnd).length;
            const totalEnrollmentsCount = allEnrollments.filter(e => new Date(e.enrolled_at) <= dayEnd).length;
            const totalSchoolsCount = allSchools.filter(s => new Date(s.created_at) <= dayEnd).length;
            const activeSchoolsCount = allSchools.filter(s => s.is_active && new Date(s.created_at) <= dayEnd).length;
            
            // For revenue, we need to match the date string exactly (YYYY-MM-DD)
            const revenueDay = revenueByDay.find(r => r.date === dateStr);
            // Active students is unique per day
            const activeDay = activeByDay.find(a => a.date === dateStr);

            await db.insert(platformMetricsDaily).values({
                metric_date: dateStr,
                total_students: totalStudentsCount,
                active_students: Number(activeDay?.count || 0),
                total_enrollments: totalEnrollmentsCount,
                revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                total_schools: totalSchoolsCount,
                active_schools: activeSchoolsCount,
            } as any).onConflictDoUpdate({
                target: platformMetricsDaily.metric_date,
                set: {
                    total_students: totalStudentsCount,
                    active_students: Number(activeDay?.count || 0),
                    total_enrollments: totalEnrollmentsCount,
                    revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                    total_schools: totalSchoolsCount,
                    active_schools: activeSchoolsCount,
                    updated_at: new Date()
                }
            });
        }
        await redis.del(CACHE_KEY);
        return { success: true };
    } catch (error) {
        console.error("Error syncing platform metrics:", error);
        return { success: false, error };
    }
}

const DEFAULT_CLASSES = Array.from({ length: 12 }, (_, i) => ({
    name: `Class ${i + 1}`,
    level: i + 1,
}));

export async function ensureDefaultClasses() {
    try {
        const existing = await db.select({ name: classes.name }).from(classes);
        const existingNames = new Set(existing.map(c => c.name));
        const missing = DEFAULT_CLASSES.filter(c => !existingNames.has(c.name));

        if (missing.length > 0) {
            await db.insert(classes).values(
                missing.map(c => ({ name: c.name, level: c.level }))
            );
        }
        return { success: true, seeded: missing.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchAllClasses() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    return await db.select().from(classes).orderBy(asc(classes.level));
}

export async function createClass(name: string, level: number) {
    const session = await verifySession();
    if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    try {
        if (!name || !name.trim()) return { success: false, error: 'Class name is required' };
        
        const existing = await db.select().from(classes).where(eq(classes.name, name.trim()));
        if (existing.length > 0) return { success: false, error: `Class "${name.trim()}" already exists` };

        const [newClass] = await db.insert(classes).values({
            name: name.trim(),
            level: level,
        }).returning();

        return { success: true, data: newClass };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteClass(classId: string) {
    const session = await verifySession();
    if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    try {
        const mappings = await db.select().from(schools).where(sql`${schools.id} IN (SELECT school_id FROM school_class_mapping WHERE class_id = ${classId})`);
        if (mappings.length > 0) return { success: false, error: `Class in use by ${mappings.length} schools` };

        await db.delete(classes).where(eq(classes.id, classId));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function validatePromoCode(code: string) {
    // PUBLIC ACTION - No session check required for registration validation
    try {
        const promo = await db.query.promoCodes.findFirst({
            where: and(
                eq(promoCodes.code, code.toUpperCase()),
                eq(promoCodes.is_active, true)
            )
        });

        if (!promo) {
            return { success: false, error: 'Invalid or expired promo code' };
        }

        const now = new Date();
        if (promo.valid_from && now < new Date(promo.valid_from)) {
            return { success: false, error: 'Promo code is not yet active' };
        }
        if (promo.valid_until && now > new Date(promo.valid_until)) {
            return { success: false, error: 'Promo code has expired' };
        }
        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
            return { success: false, error: 'Promo code use limit reached' };
        }

        return { 
            success: true, 
            promo: {
                ...promo,
                discount_value: Number(promo.discount_value)
            } 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
