'use server';

import { db } from '@/lib/db';
import { schools } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { cacheService } from '@/lib/cache';
import { verifySchoolAdminContext } from './shared';
import { createAuditLog } from '@/lib/audit';
import { verifySession } from '@/lib/auth';


const urlSchema = z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return val;
    if (val && !/^https?:\/\//i.test(val)) {
        return `https://${val}`;
    }
    return val;
}).refine(val => {
    if (!val || val === '') return true;
    try { 
        const url = new URL(val); 
        return url.protocol === "http:" || url.protocol === "https:";
    } catch(_) { return false; }
}, { message: "Invalid URL (e.g. tech-nurture.com)" });

// Removed .nullable() to prevent 'null' assignment to .notNull() columns in Drizzle
const alphaOnly = z.string().regex(/^[a-zA-Z\s]+$/, "Numeric digits or special characters are not allowed").min(2, "Minimum 2 characters required").optional();

const updateSchoolSchema = z.object({
    name: z.string().min(3, "Institution name must be at least 3 characters").optional(),
    email: z.string().email("Invalid official email address").optional(),
    phone: z.string().regex(/^\d{10}$/, "Provide a valid 10-digit contact number").optional().nullable(),
    address: z.string().min(10, "Provide a complete address (min 10 chars)").optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().min(2).optional(), // Default is 'IN', so we don't allow null
    pincode: z.string().regex(/^\d{6}$/, "Indian Pincode must be exactly 6 digits").optional().nullable(),
    logo_url: urlSchema.optional(),
    website: urlSchema.optional(),
    data_processing_consent: z.boolean().optional(),
    minor_data_guardian_consent: z.boolean().optional(),
    udise_code: z.string().regex(/^\d{11}$/, "UDISE Code must be exactly 11 digits").optional().nullable(),
});

export async function getSchoolProfile(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    const school = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });
    if (!school) return null;
    return {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        city: school.city,
        state: school.state,
        country: school.country,
        pincode: school.pincode,
        logo_url: school.logo_url,
        website: school.website,
        is_active: school.is_active,
        slug: school.slug,
        udise_code: school.udise_code,
    };
}

export async function updateSchoolProfile(schoolId: string, data: any) {
    const session = await verifySession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await verifySchoolAdminContext(schoolId);

        const parseResult = updateSchoolSchema.safeParse(data);
        if (!parseResult.success) {
            return {
                success: false,
                error: 'Validation failed',
                details: parseResult.error.flatten().fieldErrors
            };
        }

        const oldProfile = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });

        // Clean up data to remove nulls for columns that might be notNull in schema
        // but are being pass as null from frontend/zod
        const updateData: Record<string, any> = { ...parseResult.data, updated_at: new Date() };

        await db.update(schools).set(updateData).where(eq(schools.id, schoolId));

        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            action: 'update',
            entityType: 'school',
            entityId: schoolId,
            oldValues: oldProfile,
            newValues: parseResult.data,
            metadata: { field: 'profile' }
        });

        await invalidateSchoolCache(schoolId);

        try {
            await cacheService.invalidateTag(`school:${schoolId}:profile`);
            await cacheService.invalidateTag(`school:${schoolId}:settings`);
            await cacheService.invalidateTag(`school:${schoolId}:dashboard`);
        } catch (err) { }

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/school-admin', 'layout');
        revalidatePath('/student', 'layout');

        return { success: true };
    } catch (err: any) {
        console.error('[Update School Profile Error]:', err);
        return {
            success: false,
            error: err.message || 'Operation failed'
        };
    }
}

export async function invalidateSchoolCache(schoolId: string) {
    await redis.del(`cache:school:${schoolId}:dashboard`);
    await redis.del(`cache:school:${schoolId}:stats`);
}
