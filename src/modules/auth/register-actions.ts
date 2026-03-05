'use server';

import { db } from '@/lib/db';
import { users, schools, paymentPlans, studentAcademicRecords, academicSessions, schoolGradeMapping } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { assignPlanToSchool } from '@/modules/super-admin/actions';

export async function fetchApprovedSchools() {
    const schoolsData = await db.query.schools.findMany({
        where: eq(schools.is_active, true),
        orderBy: (schools, { asc }) => [asc(schools.name)]
    });

    const gradeMappings = await db.query.schoolGradeMapping.findMany({
        with: {
            grade: true
        } as any
    });

    return schoolsData.map(school => {
        const schoolGrades = gradeMappings
            .filter(gm => gm.school_id === school.id)
            .map((gm: any) => ({
                id: gm.grade_id,
                name: gm.grade?.name || '',
                level: gm.grade?.level || 0
            }))
            .sort((a, b) => a.level - b.level);

        return {
            ...school,
            grades_available: schoolGrades
        };
    });
}

export async function fetchActivePaymentPlans() {
    return await db.query.paymentPlans.findMany({
        where: eq(paymentPlans.is_active, true),
        orderBy: (paymentPlans, { asc }) => [asc(paymentPlans.price)]
    });
}

export async function registerStudent(formData: any) {
    try {
        // 1. Validation
        if (!formData.email || !formData.password || !formData.full_name || !formData.school_id || !formData.grade) {
            return { success: false, error: 'Missing required registration fields.' };
        }

        const email = formData.email.toLowerCase().trim();
        const [firstName, ...lastNameParts] = formData.full_name.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');

        const result = await db.transaction(async (tx) => {
            // 2. Check for existing user
            const existingUser = await tx.query.users.findFirst({
                where: eq(users.email, email)
            });

            if (existingUser) {
                return { success: false, error: 'An account with this email already exists.' };
            }

            // 3. Hash password and Create user
            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [newUser] = await tx.insert(users).values({
                email: email,
                password_hash: hashedPassword,
                first_name: firstName || '',
                last_name: lastName || '',
                school_id: formData.school_id,
                role: 'student',
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
            } as any).returning();

            // 4. Handle Academic Mapping
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

            // 5. Link student to the grade in the session
            await tx.insert(studentAcademicRecords).values({
                user_id: newUser.id,
                school_id: formData.school_id,
                session_id: session.id,
                grade_id: formData.grade,
                is_promoted: false
            } as any);

            return { success: true, user: newUser };
        });

        return result;
    } catch (error: any) {
        console.error('Registration error details:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during registration.' };
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

            // 3. Create School Admin User
            const checkUser = await tx.query.users.findFirst({
                where: eq(users.email, email)
            });

            if (checkUser) {
                return { success: false, error: 'A user with this email already exists.' };
            }

            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [firstName, ...lastNameParts] = (formData.principal_name || 'Admin').split(/\s+/);
            const lastName = lastNameParts.join(' ');

            await tx.insert(users).values({
                email: email,
                password_hash: hashedPassword,
                first_name: firstName,
                last_name: lastName || '',
                school_id: newSchool.id,
                role: 'school_admin',
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
            } as any);

            // 4. Assign Initial Plan if provided
            if (formData.plan_id) {
                try {
                    await assignPlanToSchool(newSchool.id, formData.plan_id);
                } catch (error) {
                    console.error("Failed to assign plan during school registration", error);
                }
            }

            return { success: true, school: newSchool };
        });

        return result;
    } catch (error: any) {
        console.error('School registration error details:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during school registration.' };
    }
}
