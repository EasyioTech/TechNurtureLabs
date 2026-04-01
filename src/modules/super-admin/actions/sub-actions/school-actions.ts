'use server';

import { db } from '@/lib/db';
import { 
    schools, schoolSubscriptions, paymentPlans, 
    students, schoolClassMapping, auditLogs, 
    schoolAdmins, promoCodes
} from '@/db/schema';
import { eq, count, sql, and, not, desc, asc, inArray, ilike, isNull } from 'drizzle-orm';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { addMonths } from 'date-fns';
import bcrypt from 'bcryptjs';
import { analyticsService } from '@/lib/services/analytics-service';

const CACHE_KEY = 'cache:admin:schools';

export async function fetchAdminSchools(page: number = 0, limit: number = 50, search?: string) {
    const session = await requireSuperAdmin();

    let query = db.select({
        id: schools.id,
        name: schools.name,
        email: schools.email,
        slug: schools.slug,
        phone: schools.phone,
        address: schools.address,
        city: schools.city,
        state: schools.state,
        country: schools.country,
        pincode: schools.pincode,
        logo_url: schools.logo_url,
        website: schools.website,
        is_active: schools.is_active,
        data_processing_consent: schools.data_processing_consent,
        minor_data_guardian_consent: schools.minor_data_guardian_consent,
        created_at: schools.created_at,
        plan_name: paymentPlans.name,
        subscription_status: schoolSubscriptions.status,
        student_count: sql<number>`(SELECT count(*) FROM ${students} WHERE ${students.school_id} = ${schools.id} AND ${students.deleted_at} IS NULL)`
    })
    .from(schools)
    // Join only the ACTIVE subscription — prevents duplicate rows when a school
    // has historical subscription records (cancelled, expired, etc.)
    .leftJoin(
        schoolSubscriptions,
        and(
            eq(schools.id, schoolSubscriptions.school_id),
            eq(schoolSubscriptions.status, 'active')
        )
    )
    .leftJoin(paymentPlans, eq(schoolSubscriptions.plan_id, paymentPlans.id))
    .$dynamic();

    const whereFilter = search
        ? and(isNull(schools.deleted_at), ilike(schools.name, `%${search}%`))
        : isNull(schools.deleted_at);

    query = query.where(whereFilter);

    const data = await query
        .orderBy(desc(schools.created_at))
        .limit(limit)
        .offset(page * limit);

    const totalRes = await db.select({ count: count() }).from(schools).where(whereFilter);
    const total = Number(totalRes[0].count);

    const schoolIds = data.map(s => s.id);
    let mappingData: any[] = [];
    if (schoolIds.length > 0) {
        mappingData = await db.select().from(schoolClassMapping).where(inArray(schoolClassMapping.school_id, schoolIds));
    }

    return {
        data: data.map(s => ({
            ...s,
            classIds: mappingData.filter(m => m.school_id === s.id).map(m => m.class_id),
            plan_name: s.plan_name || 'No Plan',
            subscription_status: s.subscription_status || 'inactive',
            student_count: Number(s.student_count || 0)
        })),
        total,
        pages: Math.ceil(total / limit)
    };
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const session = await requireSuperAdmin();
    
    const [oldSchool] = await db.select().from(schools).where(eq(schools.id, schoolId));
    const [updated] = await db.update(schools)
        .set({ is_active: isActive, updated_at: new Date() })
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
        await redis.del(CACHE_KEY);
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
    password: z.string().min(6, 'Password too short').optional().nullable(),
});

export async function saveSchoolAdmin(schoolData: any) {
    const session = await requireSuperAdmin();

    const validatedData = schoolAdminSchema.parse(schoolData);
    const email = validatedData.email.toLowerCase().trim();
    let slug = validatedData.slug || validatedData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await db.transaction(async (tx) => {
        let schoolId = validatedData.id;

        // Check for existing platform admin with this email
        const conflictAdmin = await tx.query.schoolAdmins.findFirst({
            where: and(eq(schoolAdmins.email, email), isNull(schoolAdmins.deleted_at))
        });

        if (!schoolId && conflictAdmin) throw new Error('A school administrator with this email already exists on the platform.');
        if (schoolId && conflictAdmin && conflictAdmin.school_id !== schoolId) throw new Error('This email is already taken by another school.');

        if (schoolId) {
            const [oldSchool] = await tx.select().from(schools).where(eq(schools.id, schoolId));
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
                updated_at: new Date(),
            }).where(eq(schools.id, schoolId));

            // H-10: Update/Sync School Admin Record
            const adminUpdatePayload: any = {
                first_name: validatedData.name.split(' ')[0] || 'Admin',
                last_name: validatedData.name.split(' ').slice(1).join(' ') || '',
                email: email,
                is_active: validatedData.is_active,
                updated_at: new Date(),
            };

            if (validatedData.password) {
                adminUpdatePayload.password_hash = await bcrypt.hash(validatedData.password, 10);
            }

            await tx.update(schoolAdmins)
                .set(adminUpdatePayload)
                .where(eq(schoolAdmins.school_id, schoolId));
        } else {
            // M-1: Ensure Slug Uniqueness
            const existingSlug = await tx.query.schools.findFirst({
                where: and(eq(schools.slug, slug), isNull(schools.deleted_at))
            });
            if (existingSlug) {
                slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
            }

            const [created] = await tx.insert(schools).values({
                name: validatedData.name,
                email: email,
                slug: slug,
                phone: validatedData.phone || null,
                country: validatedData.country,
                is_active: validatedData.is_active,
            } as any).returning();
            schoolId = created.id;

            // H-10: Create Primary School Admin Account
            const hashedPassword = await bcrypt.hash(validatedData.password || 'Welcome@123', 10);
            await tx.insert(schoolAdmins).values({
                school_id: schoolId,
                first_name: validatedData.name.split(' ')[0] || 'Admin',
                last_name: validatedData.name.split(' ').slice(1).join(' ') || '',
                email: email,
                password_hash: hashedPassword,
                is_active: true,
            });

            analyticsService.incrementMetric('total_schools').catch(() => {});
        }

        if (validatedData.classIds) {
            await tx.delete(schoolClassMapping).where(eq(schoolClassMapping.school_id, schoolId));
            if (validatedData.classIds.length > 0) {
                await tx.insert(schoolClassMapping).values(
                    validatedData.classIds.map(classId => ({
                        school_id: schoolId,
                        class_id: classId
                    }))
                );
            }
        }

        await tx.insert(auditLogs).values({
            user_id: session.userId,
            user_type: session.userType,
            action: validatedData.id ? 'update' : 'create',
            entity_type: 'school',
            entity_id: schoolId,
            new_values: validatedData,
        } as any);

        await redis.del(CACHE_KEY);
        return { success: true, id: schoolId };
    });
}

export async function assignPlanToSchool(schoolId: string, planId: string, billingMonths: number = 12, promoCodeId?: string | null) {
    const session = await requireSuperAdmin();
    
    const safeBillingMonths = Math.max(1, Math.min(120, Math.floor(billingMonths || 12)));
    const now = new Date();
    const periodEnd = addMonths(now, safeBillingMonths);

    return await db.transaction(async (tx) => {
        if (promoCodeId) {
            const [promo] = await tx.select({
                id: promoCodes.id, is_active: promoCodes.is_active,
                valid_until: promoCodes.valid_until, max_uses: promoCodes.max_uses,
                current_uses: promoCodes.current_uses,
            }).from(promoCodes).where(eq(promoCodes.id, promoCodeId)).limit(1);
            if (!promo) throw new Error('Promo code not found');
            if (!promo.is_active) throw new Error('Promo code is no longer active');
            if (promo.valid_until && new Date(promo.valid_until) < now) throw new Error('Promo code has expired');
            if (promo.max_uses != null && Number(promo.current_uses) >= promo.max_uses) {
                throw new Error('Promo code has reached its usage limit');
            }
            await tx.update(promoCodes)
                .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
                .where(eq(promoCodes.id, promoCodeId));
        }

        const existing = await tx.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.school_id, schoolId),
        });

        let subscriptionId = existing?.id;
        if (existing) {
            await tx.update(schoolSubscriptions).set({
                plan_id: planId,
                promo_code_id: promoCodeId || null,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now,
            }).where(eq(schoolSubscriptions.id, existing.id));
        } else {
            const [created] = await tx.insert(schoolSubscriptions).values({
                school_id: schoolId,
                plan_id: planId,
                promo_code_id: promoCodeId || null,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                auto_renew: true,
            } as any).returning();
            subscriptionId = created.id;
        }

        // H-20: Manual Revenue Tracking
        // If a plan with a price (> 0) is assigned, record a "captured" transaction
        // so that dashboard metrics correctly reflect the platform revenue.
        const [plan] = await tx.select().from(paymentPlans).where(eq(paymentPlans.id, planId)).limit(1);
        if (plan && Number(plan.price) > 0 && subscriptionId) {
            await tx.insert(paymentTransactions).values({
                school_id: schoolId,
                subscription_id: subscriptionId,
                amount: plan.price.toString(),
                currency: plan.currency,
                status: 'captured',
                gateway_response: { method: 'manual', note: 'Assigned by Super Admin' },
            } as any);
            
            // Increment global revenue counter in Redis for immediate feedback 
            // (stats fallback to DB if cache cold, but this keeps heatmaps/vitals warm)
            analyticsService.incrementMetric('total_revenue', Number(plan.price)).catch(() => {});
        }

        await redis.del(CACHE_KEY);
        return { success: true };
    });
}
