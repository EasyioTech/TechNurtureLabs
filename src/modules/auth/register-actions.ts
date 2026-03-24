'use server';

import { db } from '@/lib/db';
import { students, schoolAdmins, superAdmins, schools, paymentPlans, studentAcademicRecords, academicSessions, schoolClassMapping, classes } from '@/db/schema';
import { eq, and, or, sql, isNull } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { assignPlanToSchool } from '@/modules/super-admin/actions';
import { createSession } from '@/lib/auth';
import { handleStudentEngagement } from '@/lib/gamification';

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
        where: and(
            eq(schoolClassMapping.is_active, true),
            isNull(schoolClassMapping.deleted_at)
        ),
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

import { analyticsService } from '@/lib/services/analytics-service';

export async function registerStudent(formData: any) {
    try {
        if (!formData.email || !formData.password || !formData.full_name || !formData.school_id || (!formData.class_id && !formData.grade)) {
            return { success: false, error: 'Missing required registration fields.' };
        }

        if (formData.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 digits long.' };
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.email.replace(/[-\s]/g, ''));
        
        if (!isEmail && !isPhone) {
            return { success: false, error: 'Please enter a valid email or phone number.' };
        }

        const [firstName, ...lastNameParts] = formData.full_name.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');
        const email = isEmail ? (formData.email.toLowerCase().trim() || null) : null;
        const phone = isEmail ? null : (formData.email.replace(/\D/g, '') || null); 

        const result = await db.transaction(async (tx) => {
            // Check for existing student with this email/phone (Platform-wide, non-deleted)
            const existingGlobally = await tx.query.students.findFirst({
                where: and(
                    isEmail ? eq(students.email, email) : or(eq(students.phone, phone), eq(students.phone, formData.email.trim())),
                    sql`deleted_at IS NULL`
                )
            });

            if (existingGlobally) {
                const isValidPassword = await bcrypt.compare(formData.password, existingGlobally.password_hash);
                if (!isValidPassword) {
                    return { success: false, error: `This ${isEmail ? 'email' : 'phone number'} is already registered. Please enter the correct PIN.` };
                }
                
                if (!existingGlobally.is_verified) {
                    return { success: false, error: 'Your account is pending verification by your school admin. Please wait for approval.' };
                }

                // If PIN matches, log them in
                await createSession({ userId: existingGlobally.id, userType: 'student' });
                await handleStudentEngagement(existingGlobally.id);
                
                return { success: true, user: existingGlobally, isExisting: true };
            }

            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [newStudent] = await tx.insert(students).values({
                email: email,
                phone: phone,
                password_hash: hashedPassword,
                first_name: firstName || '',
                last_name: lastName || '',
                school_id: formData.school_id,
                gender: formData.gender,
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
                is_verified: false,
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

            // IMPORTANT: No auto-login for new students until verified
            // Removing auto-session creation lines

            return { success: true, user: newStudent, isNew: true };
        });

        if (result.success) {
            analyticsService.incrementMetric('total_students').catch(() => {});
        }
        return result;
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

        // Check cross-platform uniqueness of admin email BEFORE starting the transaction
        // (avoids partial inserts if the email already exists as a student or super_admin)
        const [existingStudent, existingAdmin, existingSuperAdmin] = await Promise.all([
            db.query.students.findFirst({ where: and(eq(students.email, email), sql`deleted_at IS NULL`), columns: { id: true } }),
            db.query.schoolAdmins.findFirst({ where: and(eq(schoolAdmins.email, email), sql`deleted_at IS NULL`), columns: { id: true } }),
            db.query.superAdmins.findFirst({ where: and(eq(superAdmins.email, email), sql`deleted_at IS NULL`), columns: { id: true } }),
        ]);

        if (existingStudent || existingAdmin || existingSuperAdmin) {
            return { success: false, error: 'This email address is already registered on the platform.' };
        }

        // Make slug unique: if the base slug is taken, append a short random suffix
        let finalSlug = slug;
        const existingSchool = await db.query.schools.findFirst({
            where: and(eq(schools.slug, finalSlug), sql`deleted_at IS NULL`),
            columns: { id: true }
        });
        if (existingSchool) {
            finalSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        const result = await db.transaction(async (tx) => {
            // 1. Create School
            const [newSchool] = await tx.insert(schools).values({
                name: formData.name,
                slug: finalSlug,
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

            const hashedPassword = await bcrypt.hash(formData.password, 10);
            const [firstName, ...lastNameParts] = (formData.principal_name || 'Admin').split(/\s+/);
            const lastName = lastNameParts.join(' ');

            // 3. Create School Admin — include phone so contact details are complete
            await tx.insert(schoolAdmins).values({
                email: email,
                school_id: newSchool.id,
                password_hash: hashedPassword,
                first_name: firstName,
                last_name: lastName || '',
                phone: formData.contact_phone || null,
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

        if (result.success) {
            analyticsService.incrementMetric('total_schools').catch(() => {});
        }

        if (formData.plan_id && result?.school?.id) {
            try {
                await assignPlanToSchool(result.school.id, formData.plan_id, 12, formData.promo_code_id);
                analyticsService.incrementMetric('total_subscriptions').catch(() => {});
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

export async function checkIdentifierExists(value: string, role?: 'student' | 'school_admin' | 'super_admin') {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const identifier = value.toLowerCase().trim();

    if (isEmail) {
        if (role === 'student' || !role) {
            const student = await db.query.students.findFirst({
                where: and(eq(students.email, identifier), sql`deleted_at IS NULL`)
            });
            if (student) return { exists: true, role: 'student' };
        }
        
        if (role === 'school_admin' || !role) {
            const admin = await db.query.schoolAdmins.findFirst({
                where: and(eq(schoolAdmins.email, identifier), sql`deleted_at IS NULL`)
            });
            if (admin) return { exists: true, role: 'school_admin' };
        }

        if (role === 'super_admin' || !role) {
            const superAdmin = await db.query.superAdmins.findFirst({
                where: and(eq(superAdmins.email, identifier), sql`deleted_at IS NULL`)
            });
            if (superAdmin) return { exists: true, role: 'super_admin' };
        }
        
        return { exists: false };
    } else {
        // Normalize phone: remove all non-digits for comparison
        const normalizedPhone = value.replace(/\D/g, '');
        
        const student = await db.query.students.findFirst({
            where: and(
                or(
                    eq(students.phone, identifier),
                    eq(students.phone, normalizedPhone)
                ), 
                sql`deleted_at IS NULL`
            )
        });
        
        if (student) return { exists: true, role: 'student' };

        // Also check school admins for phone if needed
        const admin = await db.query.schoolAdmins.findFirst({
            where: and(
                or(
                    eq(schoolAdmins.phone, identifier),
                    eq(schoolAdmins.phone, normalizedPhone)
                ),
                sql`deleted_at IS NULL`
            )
        });
        if (admin) return { exists: true, role: 'school_admin' };

        return { exists: false };
    }
}

