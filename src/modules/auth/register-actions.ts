'use server';

import { db } from '@/lib/db';
import { users, schools, paymentPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { assignPlanToSchool } from '@/modules/super-admin/actions';

export async function fetchApprovedSchools() {
    return await db.query.schools.findMany({
        where: eq(schools.is_active, true),
        orderBy: (schools, { asc }) => [asc(schools.name)]
    });
}

export async function fetchActivePaymentPlans() {
    return await db.query.paymentPlans.findMany({
        where: eq(paymentPlans.is_active, true),
        orderBy: (paymentPlans, { asc }) => [asc(paymentPlans.price)]
    });
}

export async function registerStudent(formData: any) {
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, formData.email.toLowerCase())
    });

    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const [newUser] = await db.insert(users).values({
        email: formData.email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: formData.first_name || formData.full_name?.split(' ')[0] || '',
        last_name: formData.last_name || formData.full_name?.split(' ').slice(1).join(' ') || '',
        school_id: formData.school_id,
        role: 'student',
        cumulative_xp: 0,
        current_streak: 0,
    } as any).returning();

    return newUser;
}

export async function registerSchool(formData: any) {
    console.log("registerSchool payload:", { ...formData, password: formData.password ? '[HIDDEN]' : undefined });
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [newSchool] = await db.insert(schools).values({
        name: formData.name,
        slug: slug,
        email: formData.contact_email || formData.email || '',
        phone: formData.contact_phone,
        address: formData.address,
        city: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        is_active: false,
    } as any).returning();

    if (formData.contact_email && formData.password) {
        const existingAdmin = await db.query.users.findFirst({
            where: eq(users.email, formData.contact_email.toLowerCase())
        });

        if (!existingAdmin) {
            try {
                const hashedPassword = await bcrypt.hash(formData.password, 10);
                await db.insert(users).values({
                    email: formData.contact_email.toLowerCase(),
                    password_hash: hashedPassword,
                    first_name: formData.principal_name?.split(' ')[0] || 'Admin',
                    last_name: formData.principal_name?.split(' ').slice(1).join(' ') || '',
                    school_id: newSchool.id,
                    role: 'school_admin',
                    cumulative_xp: 0,
                    current_streak: 0,
                } as any);
                console.log("Successfully created school admin user:", formData.contact_email);
            } catch (userError) {
                console.error("Failed to create school admin user:", userError);
                // Keep the school creation successful, but log the user error
            }
        }
    }

    if (formData.plan_id) {
        try {
            await assignPlanToSchool(newSchool.id, formData.plan_id);
        } catch (error) {
            console.error("Failed to assign plan during school registration", error);
            // Non-blocking error, we still return the school
        }
    }

    return newSchool;
}
