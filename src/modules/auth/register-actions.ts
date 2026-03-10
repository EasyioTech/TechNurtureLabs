'use server';

import { db } from '@/lib/db';
import { students, schoolAdmins, superAdmins, schools, paymentPlans, studentAcademicRecords, academicSessions, schoolClassMapping, classes } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { assignPlanToSchool } from '@/modules/super-admin/actions';

export async function fetchGlobalClasses() {
    let allClasses = await db.query.classes.findMany({
        orderBy: [asc(classes.level)]
    });

    // Auto-seed: if the table is empty, create Class 1–12 automatically
    if (allClasses.length === 0) {
        const defaults = Array.from({ length: 12 }, (_, i) => ({
            name: `Class ${i + 1}`,
            level: i + 1,
        }));
        try {
            await db.insert(classes).values(defaults);
            allClasses = await db.query.classes.findMany({
                orderBy: [asc(classes.level)]
            });
            console.log('✅ Auto-seeded 12 default classes');
        } catch (err) {
            console.error('Auto-seed classes failed:', err);
        }
    }

    return allClasses;
}


export async function fetchApprovedSchools() {
    const schoolsData = await db.query.schools.findMany({
        where: eq(schools.is_active, true),
        orderBy: (schools, { asc }) => [asc(schools.name)]
    });

    const classMappings = await db.query.schoolClassMapping.findMany({
        with: {
            academicClass: true
        } as any
    });

    return schoolsData.map(school => {
        const schoolClasses = classMappings
            .filter(gm => gm.school_id === school.id)
            .map((gm: any) => ({
                id: gm.class_id,
                name: gm.academicClass?.name || '',
                level: gm.academicClass?.level || 0
            }))
            .sort((a, b) => a.level - b.level);

        return {
            ...school,
            classes_available: schoolClasses
        };
    });
}

export async function fetchActivePaymentPlans() {
    try {
        return await db.query.paymentPlans.findMany({
            where: eq(paymentPlans.is_active, true),
            orderBy: (paymentPlans, { asc }) => [asc(paymentPlans.price)]
        });
    } catch (error) {
        console.error('Error fetching active payment plans:', error);
        return [];
    }
}

export async function registerStudent(formData: any) {
    try {
        if (!formData.email || !formData.password || !formData.full_name || !formData.school_id || (!formData.class_id && !formData.grade)) {
            return { success: false, error: 'Missing required registration fields.' };
        }

        if (formData.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 digits long.' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return { success: false, error: 'Invalid email address format.' };
        }

        const email = formData.email.toLowerCase().trim();
        const [firstName, ...lastNameParts] = formData.full_name.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');

        return await db.transaction(async (tx) => {
            // Check for existing student with this email in THIS school
            const existing = await tx.query.students.findFirst({
                where: and(eq(students.email, email), eq(students.school_id, formData.school_id))
            });

            if (existing) {
                return { success: false, error: 'An account with this email already exists in this school.' };
            }

            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [newStudent] = await tx.insert(students).values({
                email: email,
                password_hash: hashedPassword,
                first_name: firstName || '',
                last_name: lastName || '',
                school_id: formData.school_id,
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
            } as any).returning();

            // Academic Mapping
            let session = await tx.query.academicSessions.findFirst({
                where: and(
                    eq(academicSessions.school_id, formData.school_id),
                    eq(academicSessions.is_current, true)
                )
            });

            if (!session) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(startDate.getFullYear() + 1);

                const [newSession] = await tx.insert(academicSessions).values({
                    name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
                    school_id: formData.school_id,
                    is_current: true,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                } as any).returning();
                session = newSession;
            }

            await tx.insert(studentAcademicRecords).values({
                user_id: newStudent.id,
                school_id: newStudent.school_id,
                session_id: session.id,
                class_id: formData.class_id || formData.grade,
            } as any).onConflictDoNothing();

            return { success: true, user: newStudent };
        });
    } catch (error: any) {
        console.error('Student registration error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function registerSchool(formData: any) {
    try {
        if (!formData.name || !formData.contact_email || !formData.password) {
            return { success: false, error: 'Missing required school registration fields.' };
        }

        const email = formData.contact_email.toLowerCase().trim();
        const slug = formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await db.transaction(async (tx) => {
            // 1. Create School
            const [newSchool] = await tx.insert(schools).values({
                name: formData.name,
                slug: slug,
                email: email,
                phone: formData.contact_phone,
                address: formData.address,
                city: formData.district || formData.city || '',
                state: formData.state,
                country: formData.country || 'IN',
                pincode: formData.pincode,
                udise_code: formData.udise_code,
                is_active: true,
            } as any).returning();

            // 2. Create Initial Academic Session
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(startDate.getFullYear() + 1);
            await tx.insert(academicSessions).values({
                name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
                school_id: newSchool.id,
                is_current: true,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            } as any);

            // 3. Create School Admin User in school_admins table
            const checkUser = await tx.query.schoolAdmins.findFirst({
                where: and(eq(schoolAdmins.email, email), eq(schoolAdmins.school_id, newSchool.id))
            });

            if (checkUser) {
                throw new Error('A school admin with this email already exists.');
            }

            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [firstName, ...lastNameParts] = (formData.principal_name || 'Admin').split(/\s+/);
            const lastName = lastNameParts.join(' ');

            await tx.insert(schoolAdmins).values({
                email: email,
                school_id: newSchool.id,
                password_hash: hashedPassword,
                first_name: firstName,
                last_name: lastName || '',
                is_active: true,
            } as any);

            // 4. Map Selected Classes to New School
            if (formData.classes_available && Array.isArray(formData.classes_available) && formData.classes_available.length > 0) {
                await tx.insert(schoolClassMapping).values(
                    formData.classes_available.map((classId: string) => ({
                        school_id: newSchool.id,
                        class_id: classId,
                        is_active: true
                    }))
                );
            }

            return { success: true, school: newSchool };
        });

        if (formData.plan_id && result?.school?.id) {
            try {
                await assignPlanToSchool(result.school.id, formData.plan_id, 12, formData.promo_code_id);
            } catch (err) {
                console.error("Plan assignment failed during registration:", err);
            }
        }

        return result;
    } catch (error: any) {
        console.error('School registration error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
