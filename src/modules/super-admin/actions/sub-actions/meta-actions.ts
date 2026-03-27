'use server';

import { db } from '@/lib/db';
import { 
    paymentPlans, promoCodes, classes, 
    platformSettings, platformMetricsDaily, 
    auditLogs, schoolSubscriptions, students, enrollments, schools, paymentTransactions, lessonProgress
} from '@/db/schema';
import { eq, asc, desc, count, sql, and, lte, inArray, not, isNull } from 'drizzle-orm';
import { z } from 'zod';
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
            return JSON.parse(cached);
        }
    } catch (_) { /* Best effort */ }

    // 2. Fetch from DB
    const [plansData, classesData, promoCodesData, settingsData, metricsData] = await Promise.all([
        db.query.paymentPlans.findMany({ 
            where: isNull(paymentPlans.deleted_at),
            orderBy: [asc(paymentPlans.price)] 
        }),
        db.query.classes.findMany({ 
            where: isNull(classes.deleted_at),
            orderBy: [asc(classes.level)] 
        }),
        db.select({
            id: promoCodes.id,
            code: promoCodes.code,
            discount_type: promoCodes.discount_type,
            discount_value: promoCodes.discount_value,
            max_uses: promoCodes.max_uses,
            current_uses: promoCodes.current_uses,
            valid_from: promoCodes.valid_from,
            valid_until: promoCodes.valid_until,
            is_active: promoCodes.is_active,
            created_at: promoCodes.created_at,
            updated_at: promoCodes.updated_at,
        }).from(promoCodes),
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

const promoCodeSchema = z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(3, 'Code must be at least 3 characters').max(50)
        .regex(/^[A-Z0-9_-]+$/i, 'Code may only contain letters, digits, hyphens, and underscores'),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().min(0),
    max_uses: z.number().int().min(1).optional().nullable(),
    valid_from: z.string().optional().nullable(),
    valid_until: z.string().optional().nullable(),
    is_active: z.boolean().optional().default(true),
}).refine(
    (data) => data.discount_type !== 'percentage' || data.discount_value <= 100,
    { message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] }
);

export async function savePromoCode(promoData: unknown) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = promoCodeSchema.parse(promoData);
    const code = data.code.toUpperCase();

    // Check for existing code before insert (explicit columns — deleted_at not in DB yet)
    const [existing] = await db.select({
        id: promoCodes.id, code: promoCodes.code, is_active: promoCodes.is_active,
        discount_type: promoCodes.discount_type, discount_value: promoCodes.discount_value,
        max_uses: promoCodes.max_uses, current_uses: promoCodes.current_uses,
        valid_from: promoCodes.valid_from, valid_until: promoCodes.valid_until,
        created_at: promoCodes.created_at, updated_at: promoCodes.updated_at,
    }).from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
    if (!data.id && existing) throw new Error(`Promo code "${code}" is already in use.`);
    if (data.id && existing && existing.id !== data.id) throw new Error(`Promo code "${code}" is already in use by another campaign.`);

    if (data.id) {
        const [updated] = await db.update(promoCodes).set({
            code,
            discount_type: data.discount_type,
            discount_value: data.discount_value.toString(),
            max_uses: data.max_uses ?? null,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
            updated_at: new Date()
        }).where(eq(promoCodes.id, data.id)).returning();
        
        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'update',
            entity_type: 'promoCode',
            entity_id: updated.id,
            old_values: existing,
            new_values: updated
        } as any);

        await redis.del(CACHE_KEY);
        return [updated];
    } else {
        const [inserted] = await db.insert(promoCodes).values({
            code,
            discount_type: data.discount_type,
            discount_value: data.discount_value.toString(),
            max_uses: data.max_uses ?? null,
            valid_from: data.valid_from ? new Date(data.valid_from) : null,
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            is_active: data.is_active ?? true,
        }).returning();

        await db.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: 'create',
            entity_type: 'promoCode',
            entity_id: inserted.id,
            new_values: inserted
        } as any);

        await redis.del(CACHE_KEY);
        return [inserted];
    }
}

export async function deletePromoCode(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const [promo] = await db.select({
        id: promoCodes.id, code: promoCodes.code, is_active: promoCodes.is_active,
        discount_type: promoCodes.discount_type, discount_value: promoCodes.discount_value,
        max_uses: promoCodes.max_uses, current_uses: promoCodes.current_uses,
        valid_from: promoCodes.valid_from, valid_until: promoCodes.valid_until,
        created_at: promoCodes.created_at, updated_at: promoCodes.updated_at,
    }).from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
    if (!promo) return;

    // Soft-delete: set is_active=false. deleted_at column not yet in DB (pending migration).
    await db.update(promoCodes).set({
        is_active: false,
        updated_at: new Date()
    }).where(eq(promoCodes.id, id));

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

const planSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Plan name is required').max(100),
    description: z.string().optional().default(''),
    price: z.number().min(0, 'Price cannot be negative'),
    billing_cycle: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']).default('monthly'),
    currency: z.string().max(3).default('INR'),
    features: z.record(z.string(), z.any()).optional().default({}),
    max_students: z.number().int().min(1, 'At least 1 student required'),
    trial_days: z.number().int().min(0).default(0),
    is_active: z.boolean().optional().default(true),
    is_popular: z.boolean().optional().default(false),
});

export async function savePlanAdmin(planData: unknown) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const data = planSchema.parse(planData);

    return await db.transaction(async (tx) => {
        // Unmark any previously-popular plan before setting a new one
        if (data.is_popular) {
            await tx.update(paymentPlans).set({ is_popular: false });
        }

        const planPayload = {
            name: data.name,
            description: data.description,
            price: data.price.toString(),
            billing_cycle: data.billing_cycle,
            currency: data.currency,
            features: data.features,
            max_students: data.max_students,
            trial_days: data.trial_days,
            is_active: data.is_active ?? true,
            is_popular: data.is_popular ?? false,
            updated_at: new Date(),
        };

        let result;
        if (data.id) {
            const oldPlan = await tx.query.paymentPlans.findFirst({ where: eq(paymentPlans.id, data.id) });
            const [updated] = await tx.update(paymentPlans).set(planPayload).where(eq(paymentPlans.id, data.id)).returning();
            
            await tx.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: 'update',
                entity_type: 'paymentPlan',
                entity_id: updated.id,
                old_values: oldPlan,
                new_values: updated
            } as any);
            
            result = updated;
        } else {
            const [created] = await tx.insert(paymentPlans).values(planPayload as any).returning();
            
            await tx.insert(auditLogs).values({
                user_id: session.userId,
                user_type: session.userType,
                action: 'create',
                entity_type: 'paymentPlan',
                entity_id: created.id,
                new_values: created
            } as any);
            
            result = created;
        }

        await redis.del(CACHE_KEY);
        return { ...result, price: Number(result.price) };
    });
}

export async function deletePlanAdmin(id: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    const activeSubs = await db.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.plan_id, id));
    // Soft deletion allows keeping the record for historical sub-relation integrity, 
    // but we block it if there are active users for UI cleanliness.
    if (activeSubs.some(s => s.status === 'active' || s.status === 'trialing')) {
        throw new Error("Cannot deactivate plan: This tier is currently being utilized by active institutions.");
    }
    const plan = await db.query.paymentPlans.findFirst({ where: eq(paymentPlans.id, id) });
    if (!plan) return;

    await db.update(paymentPlans).set({ 
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date()
    }).where(eq(paymentPlans.id, id));

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
    const SYNC_LOCK_KEY = 'lock:sync-metrics';
    const LOCK_EXPIRY = 600; // 10 minutes limit for safety

    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    try {
        // M-10: Prevention of parallel metrics scan
        const alreadyRunning = await redis.get(SYNC_LOCK_KEY);
        if (alreadyRunning) {
            return { success: false, error: "Metrics sync is already in progress. Please wait a few minutes." };
        }
        await redis.setex(SYNC_LOCK_KEY, LOCK_EXPIRY, 'running');

        const last30Days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = subDays(today, i);
            last30Days.push(format(d, 'yyyy-MM-dd'));
        }

        // C-3: Fixed memory load by moving all counts into optimized SQL queries
        // instead of loading all objects and filtering in Node.js
        const [revenueByDay, activeByDay, studentsByDay, enrollByDay, schoolsByDay] = await Promise.all([
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

            // Count new students per day
            db.select({
                date: sql`DATE(${students.created_at})::text`,
                count: count()
            }).from(students).where(eq(students.is_active, true)).groupBy(sql`DATE(${students.created_at})`),

            // Count new enrollments per day
            db.select({
                date: sql`DATE(${enrollments.enrolled_at})::text`,
                count: count()
            }).from(enrollments).groupBy(sql`DATE(${enrollments.enrolled_at})`),

            // Count new schools per day
            db.select({
                date: sql`DATE(${schools.created_at})::text`,
                total_count: count(),
                active_count: sql`count(*) filter (where ${schools.is_active} = true)`
            }).from(schools).groupBy(sql`DATE(${schools.created_at})`)
        ]);

        // Helper to sum up historical totals per day efficiently
        // Note: For true production accuracy at scale, "total count" should be indexed counters,
        // but this SQL approach is O(30) which is drastically better than O(N) memory load.
        const thirtyDaysAgoIso = subDays(today, 30).toISOString();
        let runningTotalStudents = Number((await db.select({ count: count() }).from(students).where(and(eq(students.is_active, true), sql`${students.created_at} <= ${thirtyDaysAgoIso}`)))[0].count);
        let runningTotalEnrollments = Number((await db.select({ count: count() }).from(enrollments).where(sql`${enrollments.enrolled_at} <= ${thirtyDaysAgoIso}`))[0].count);
        let runningTotalSchools = Number((await db.select({ count: count() }).from(schools).where(sql`${schools.created_at} <= ${thirtyDaysAgoIso}`))[0].count);
        let runningActiveSchools = Number((await db.select({ count: count() }).from(schools).where(and(eq(schools.is_active, true), sql`${schools.created_at} <= ${thirtyDaysAgoIso}`)))[0].count);

        for (const dateStr of last30Days) {
            const dayStudents = studentsByDay.find(s => s.date === dateStr);
            const dayEnroll = enrollByDay.find(e => e.date === dateStr);
            const daySchools = schoolsByDay.find(s => s.date === dateStr);
            
            runningTotalStudents += Number(dayStudents?.count || 0);
            runningTotalEnrollments += Number(dayEnroll?.count || 0);
            runningTotalSchools += Number(daySchools?.total_count || 0);
            runningActiveSchools += Number((daySchools as any)?.active_count || 0);

            const revenueDay = revenueByDay.find(r => r.date === dateStr);
            const activeDay = activeByDay.find(a => a.date === dateStr);

            await db.insert(platformMetricsDaily).values({
                metric_date: dateStr,
                total_students: runningTotalStudents,
                active_students: Number(activeDay?.count || 0),
                total_enrollments: runningTotalEnrollments,
                revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                total_schools: runningTotalSchools,
                active_schools: runningActiveSchools,
            } as any).onConflictDoUpdate({
                target: platformMetricsDaily.metric_date,
                set: {
                    total_students: runningTotalStudents,
                    active_students: Number(activeDay?.count || 0),
                    total_enrollments: runningTotalEnrollments,
                    revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                    total_schools: runningTotalSchools,
                    active_schools: runningActiveSchools,
                    updated_at: new Date()
                }
            });
        }
        
        await redis.del(SYNC_LOCK_KEY);
        await redis.del(CACHE_KEY);
        return { success: true };
    } catch (error) {
        await redis.del(SYNC_LOCK_KEY);
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
        const mappings = await db.select({ id: schools.id }).from(schools)
            .where(sql`${schools.id} IN (SELECT school_id FROM school_class_mapping WHERE class_id = ${classId})`);
        if (mappings.length > 0) return { success: false, error: `Class in use by ${mappings.length} schools` };

        // Soft delete the class
        await db.update(classes).set({ 
            deleted_at: new Date() 
        }).where(eq(classes.id, classId));
        
        await redis.del(CACHE_KEY);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function validatePromoCode(code: string) {
    // PUBLIC ACTION - No session check required for registration validation
    try {
        const [promo] = await db.select({
            id: promoCodes.id, code: promoCodes.code, is_active: promoCodes.is_active,
            discount_type: promoCodes.discount_type, discount_value: promoCodes.discount_value,
            max_uses: promoCodes.max_uses, current_uses: promoCodes.current_uses,
            valid_from: promoCodes.valid_from, valid_until: promoCodes.valid_until,
            created_at: promoCodes.created_at, updated_at: promoCodes.updated_at,
        }).from(promoCodes).where(and(
            eq(promoCodes.code, code.toUpperCase()),
            eq(promoCodes.is_active, true)
        )).limit(1);

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
