'use server';

import { db } from '@/lib/db';
import { 
    schools, schoolSubscriptions, paymentPlans, 
    students, schoolClassMapping, auditLogs, 
    schoolAdmins, promoCodes
} from '@/db/schema';
import { eq, count, sql, and, not, desc, asc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { addMonths } from 'date-fns';

const CACHE_KEY = 'cache:admin:schools';

export async function fetchAdminSchools(page: number = 0, limit: number = 50, search?: string) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const baseQuery = db.select({
        id: schools.id,
        name: schools.name,
        email: schools.email,
        slug: schools.slug,
        is_active: schools.is_active,
        created_at: schools.created_at,
        plan_name: paymentPlans.name,
        subscription_status: schoolSubscriptions.status,
        student_count: sql<number>`(SELECT count(*) FROM ${students} WHERE ${students.school_id} = ${schools.id} AND ${students.deleted_at} IS NULL)`
    })
    .from(schools)
    .leftJoin(schoolSubscriptions, eq(schools.id, schoolSubscriptions.school_id))
    .leftJoin(paymentPlans, eq(schoolSubscriptions.plan_id, paymentPlans.id));

    if (search) {
        baseQuery.where(sql`${schools.name} ILIKE ${'%' + search + '%'}`);
    }

    const data = await baseQuery
        .orderBy(desc(schools.created_at))
        .limit(limit)
        .offset(page * limit);

    const schoolIds = data.map(s => s.id);
    let mappingData: any[] = [];
    if (schoolIds.length > 0) {
        mappingData = await db.select().from(schoolClassMapping).where(sql`${schoolClassMapping.school_id} IN ${schoolIds}`);
    }

    return data.map(s => ({
        ...s,
        classIds: mappingData.filter(m => m.school_id === s.id).map(m => m.class_id),
        plan_name: s.plan_name || 'No Plan',
        subscription_status: s.subscription_status || 'inactive',
        student_count: Number(s.student_count || 0)
    }));
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    
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
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    const validatedData = schoolAdminSchema.parse(schoolData);
    const email = validatedData.email.toLowerCase().trim();
    const slug = validatedData.slug || validatedData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return await db.transaction(async (tx) => {
        let schoolId = validatedData.id;

        const conflictAdmin = await tx.query.schoolAdmins.findFirst({
            where: schoolId 
                ? and(eq(schoolAdmins.email, email), not(eq(schoolAdmins.id, schoolId)))
                : eq(schoolAdmins.email, email)
        });

        if (conflictAdmin) throw new Error('This email address is already associated with another school account.');

        if (schoolId) {
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
        } else {
            const [created] = await tx.insert(schools).values({
                name: validatedData.name,
                email: email,
                slug: slug,
                phone: validatedData.phone || null,
                country: validatedData.country,
                is_active: validatedData.is_active,
            } as any).returning();
            schoolId = created.id;
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

        await redis.del(CACHE_KEY);
        return { success: true, id: schoolId };
    });
}

export async function assignPlanToSchool(schoolId: string, planId: string, billingMonths: number = 12, promoCodeId?: string | null) {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }
    
    const now = new Date();
    const periodEnd = addMonths(now, billingMonths);

    return await db.transaction(async (tx) => {
        if (promoCodeId) {
            await tx.update(promoCodes)
                .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
                .where(eq(promoCodes.id, promoCodeId));
        }

        const existing = await tx.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.school_id, schoolId),
        });

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
            await tx.insert(schoolSubscriptions).values({
                school_id: schoolId,
                plan_id: planId,
                promo_code_id: promoCodeId || null,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                auto_renew: true,
            } as any);
        }
        await redis.del(CACHE_KEY);
        return { success: true };
    });
}
