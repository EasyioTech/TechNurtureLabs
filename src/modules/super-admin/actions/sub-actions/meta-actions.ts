'use server';

import { db } from '@/lib/db';
import { 
    paymentPlans, promoCodes, classes, 
    platformSettings, platformMetricsDaily, 
    auditLogs, schoolSubscriptions, students, enrollments, schools, paymentTransactions, lessonProgress
} from '@/db/schema';
import { eq, asc, desc, count, sql, and, lte, inArray, not, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { redis } from '@/lib/redis';
import { format, subDays, endOfDay } from 'date-fns';

const CACHE_KEY = 'cache:admin:meta';

export async function fetchAdminMetadata() {
    const session = await requireSuperAdmin();

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

/**
 * Fetches real-time Redis-only overview data: login heatmap.
 * Pure RAM reads — zero DB queries, zero VPS load.
 */
export async function fetchAdminOverviewExtras(): Promise<{
    loginHeatmap: number[][];
}> {
    const session = await requireSuperAdmin();

    const { analyticsService } = await import('@/lib/services/analytics-service');
    const loginHeatmap = await analyticsService.getLoginHeatmap();
    return { loginHeatmap };
}

const promoCodeSchema = z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(3, 'Code must be at least 3 characters').max(50)
        .regex(/^[A-Z0-9_-]+$/i, 'Code may only contain letters, digits, hyphens, and underscores'),
    discount_type: z.enum(['percentage', 'fixed']),
    // coerce handles HTML input values that arrive as strings (e.g. "10" → 10)
    discount_value: z.coerce.number().min(0),
    max_uses: z.coerce.number().int().min(1).optional().nullable(),
    valid_from: z.string().optional().nullable(),
    valid_until: z.string().optional().nullable(),
    is_active: z.boolean().optional().default(true),
}).refine(
    (data) => data.discount_type !== 'percentage' || data.discount_value <= 100,
    { message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] }
);

export async function savePromoCode(promoData: unknown) {
    const session = await requireSuperAdmin();

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
    const session = await requireSuperAdmin();
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
    features: z.array(z.string()).optional().default([]),
    max_students: z.number().int().min(1).optional().nullable(),
    trial_days: z.number().int().min(0).default(0),
    is_active: z.boolean().optional().default(true),
    is_popular: z.boolean().optional().default(false),
});

export async function savePlanAdmin(planData: unknown) {
    const session = await requireSuperAdmin();

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
    const session = await requireSuperAdmin();
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

    const session = await requireSuperAdmin();

    const redisAvailable = redis && (redis as any).status === 'ready';

    try {
        // M-10: Prevention of parallel metrics scan
        if (redisAvailable) {
            const alreadyRunning = await redis.get(SYNC_LOCK_KEY);
            if (alreadyRunning) {
                return { success: false, error: "Metrics sync already in progress." };
            }
            await redis.setex(SYNC_LOCK_KEY, LOCK_EXPIRY, 'running');
        }

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

            // Capture today's live PCU from Redis for the daily snapshot
            const isToday = dateStr === format(today, 'yyyy-MM-dd');
            let peakConcurrent = 0;
            if (isToday) {
                try {
                    const { analyticsService } = await import('@/lib/services/analytics-service');
                    peakConcurrent = await analyticsService.getPCU();
                } catch (_) { /* best effort */ }
            }

            await db.insert(platformMetricsDaily).values({
                metric_date: dateStr,
                total_students: runningTotalStudents,
                active_students: Number(activeDay?.count || 0),
                total_enrollments: runningTotalEnrollments,
                revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                total_schools: runningTotalSchools,
                active_schools: runningActiveSchools,
                ...(isToday ? { peak_concurrent: peakConcurrent } : {}),
            } as any).onConflictDoUpdate({
                target: platformMetricsDaily.metric_date,
                set: {
                    total_students: runningTotalStudents,
                    active_students: Number(activeDay?.count || 0),
                    total_enrollments: runningTotalEnrollments,
                    revenue_total: revenueDay?.total ? revenueDay.total.toString() : '0',
                    total_schools: runningTotalSchools,
                    active_schools: runningActiveSchools,
                    ...(isToday ? { peak_concurrent: peakConcurrent } : {}),
                    updated_at: new Date()
                }
            });
        }

        if (redisAvailable) {
            await redis.del(SYNC_LOCK_KEY);
            await redis.del(CACHE_KEY);
        }
        return { success: true };
    } catch (error: any) {
        if (redisAvailable) {
            await redis.del(SYNC_LOCK_KEY);
        }
        console.error("[syncPlatformMetrics] ERROR:", error.message || error);
        return { success: false, error: error.message || "Metrics sync failed internally" };
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
    const session = await requireSuperAdmin();
    return await db.select().from(classes).orderBy(asc(classes.level));
}

export async function createClass(name: string, level: number) {
    await requireSuperAdmin();
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
    await requireSuperAdmin();
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

import { DiagnosticsResult } from '../../types';

export async function runDatabaseDiagnostics(): Promise<DiagnosticsResult> {
    'use server';
    await requireSuperAdmin();

    try {
        const issues: string[] = [];
        let tablesChecked = 0;
        let cleanedCount = 0;

        // Check for orphaned lesson_progress (lesson deleted, but progress remains)
        const orphanedProgress = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM lesson_progress lp
            WHERE NOT EXISTS (
                SELECT 1 FROM lessons l WHERE l.id = lp.lesson_id
            )
        `);
        const progressCount = (orphanedProgress[0] as any)?.count || 0;
        tablesChecked++;
        if (progressCount > 0) {
            issues.push(`${progressCount} orphaned lesson_progress records (deleted lesson)`);
            cleanedCount += progressCount;
        }

        // Check for orphaned course_enrollments (course deleted, but enrollment remains)
        try {
            const orphanedEnrollments = await db.execute(sql`
                SELECT COUNT(*) as count
                FROM course_enrollments ce
                WHERE NOT EXISTS (
                    SELECT 1 FROM courses c WHERE c.id = ce.course_id
                ) AND ce.deleted_at IS NULL
            `);
            const enrollmentCount = (orphanedEnrollments[0] as any)?.count || 0;
            tablesChecked++;
            if (enrollmentCount > 0) {
                issues.push(`${enrollmentCount} orphaned course_enrollments records (deleted course)`);
                cleanedCount += enrollmentCount;
            }
        } catch (err: any) {
            // Table doesn't exist - skip check
            if (err.message?.includes('does not exist')) {
                console.warn('[Diagnostics] course_enrollments table not found - skipping check');
            } else {
                throw err;
            }
        }

        // Check for orphaned user_xp (user deleted, but XP record remains)
        try {
            const orphanedXp = await db.execute(sql`
                SELECT COUNT(*) as count
                FROM user_xp ux
                WHERE NOT EXISTS (
                    SELECT 1 FROM users u WHERE u.id = ux.user_id
                )
            `);
            const xpCount = (orphanedXp[0] as any)?.count || 0;
            tablesChecked++;
            if (xpCount > 0) {
                issues.push(`${xpCount} orphaned user_xp records (deleted user)`);
                cleanedCount += xpCount;
            }
        } catch (err: any) {
            if (err.message?.includes('does not exist')) {
                console.warn('[Diagnostics] user_xp table not found - skipping check');
            } else {
                throw err;
            }
        }

        // Check for orphaned school_admin_profiles (school deleted, but profile remains)
        try {
            const orphanedAdminProfiles = await db.execute(sql`
                SELECT COUNT(*) as count
                FROM school_admin_profiles sap
                WHERE NOT EXISTS (
                    SELECT 1 FROM schools s WHERE s.id = sap.school_id
                ) AND sap.deleted_at IS NULL
            `);
            const adminProfileCount = (orphanedAdminProfiles[0] as any)?.count || 0;
            tablesChecked++;
            if (adminProfileCount > 0) {
                issues.push(`${adminProfileCount} orphaned school_admin_profiles records (deleted school)`);
                cleanedCount += adminProfileCount;
            }
        } catch (err: any) {
            if (err.message?.includes('does not exist')) {
                console.warn('[Diagnostics] school_admin_profiles table not found - skipping check');
            } else {
                throw err;
            }
        }

        // Check soft-deleted records across key tables
        const softDeletedCount = await db.execute(sql`
            SELECT
                (SELECT COUNT(*) FROM courses WHERE deleted_at IS NOT NULL) +
                (SELECT COUNT(*) FROM lessons WHERE deleted_at IS NOT NULL) +
                (SELECT COUNT(*) FROM schools WHERE deleted_at IS NOT NULL) +
                (SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL)
            as total
        `);
        const softDeleted = (softDeletedCount[0] as any)?.total || 0;
        tablesChecked++;
        if (softDeleted > 0) {
            issues.push(`${softDeleted} soft-deleted records across courses, lessons, schools, users`);
        }

        return {
            status: issues.length > 0 ? 'issues_found' : 'ok',
            tablesChecked,
            issues,
            cleanedCount
        };
    } catch (error: any) {
        console.error('[Database Diagnostics] Error:', error);
        throw new Error(`Diagnostics failed: ${error.message}`);
    }
}
