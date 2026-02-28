'use server';

import { db } from '@/lib/db';
import { profiles, schools } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function fetchApprovedSchools() {
    return await db.query.schools.findMany({
        where: eq(schools.is_approved, true),
        orderBy: (schools, { asc }) => [asc(schools.name)]
    });
}

export async function registerStudent(formData: any) {
    const existingUser = await db.query.profiles.findFirst({
        where: eq(profiles.email, formData.email.toLowerCase())
    });

    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const [newUser] = await db.insert(profiles).values({
        email: formData.email.toLowerCase(),
        password_hash: hashedPassword,
        full_name: formData.full_name,
        school_id: formData.school_id,
        grade: parseInt(formData.grade),
        role: 'student',
        total_xp: 0,
        level: 1,
        current_streak: 0,
    } as any).returning();

    return newUser;
}

export async function registerSchool(formData: any) {
    const [newSchool] = await db.insert(schools).values({
        name: formData.name,
        udise_code: formData.udise_code,
        address: formData.address,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        school_type: formData.school_type,
        grades_available: formData.grades_available,
        student_count: formData.student_count ? parseInt(formData.student_count) : 0,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        principal_name: formData.principal_name,
        is_approved: false
    } as any).returning();

    return newSchool;
}
