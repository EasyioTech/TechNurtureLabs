'use server';

import { db } from '@/lib/db';
import { students, schoolAdmins, superAdmins, schools, paymentPlans, studentAcademicRecords, academicSessions, schoolClassMapping, classes } from '@/db/schema';
import { eq, and, or, sql, isNull } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { schoolSubscriptions, promoCodes, paymentTransactions, auditLogs } from '@/db/schema';
import { createSession } from '@/lib/auth';
import { handleStudentEngagement } from '@/lib/gamification';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';

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
import { registerStudentSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

const razorpay = (serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export async function registerStudent(formData: any) {
    try {
        // SECURITY: Validate input with Zod schema
        const validation = registerStudentSchema.safeParse(formData);
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || 'Invalid registration data';
            return { success: false, error: message };
        }

        const validatedData = validation.data;

        const rawIdentifier = validatedData.email.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawIdentifier);
        // Accept any 7-15 digit number (with optional +, spaces, dashes, parens)
        const digitsOnly = rawIdentifier.replace(/\D/g, '');
        const isPhone = !isEmail && digitsOnly.length >= 7 && digitsOnly.length <= 15;

        const [firstName, ...lastNameParts] = validatedData.full_name.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');

        // Normalize: Email to lowercase, Phone to digits only
        const emailVal: string | undefined = isEmail ? rawIdentifier.toLowerCase() : undefined;
        const phoneVal: string | undefined = isPhone ? digitsOnly : undefined;

        // For phone comparison, also check last 10 digits to handle country code variations
        const phoneLast10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

        const result = await db.transaction(async (tx) => {
            // Check for existing student with this email/phone (Platform-wide, non-deleted)
            const existingGlobally = await tx.query.students.findFirst({
                where: and(
                    isEmail
                        ? eq(students.email, emailVal!)
                        : or(
                            eq(students.phone, phoneVal!),
                            eq(students.phone, phoneLast10), // check 10 digit version
                            sql`${students.phone} LIKE ${'%' + phoneLast10}` // fuzzy end match
                          ),
                    sql`deleted_at IS NULL`
                )
            });

            if (existingGlobally) {
                const isValidPassword = await bcrypt.compare(validatedData.password, existingGlobally.password_hash);
                if (!isValidPassword) {
                    return { success: false, error: `This ${isEmail ? 'email' : 'phone number'} is already registered. Please enter your correct PIN to sign in.` };
                }

                if (!existingGlobally.is_verified) {
                    return { success: false, error: 'Your account is waiting for approval from your school. Please check back soon or contact your teacher.' };
                }

                // If PIN matches, log them in
                await createSession({ userId: existingGlobally.id, userType: 'student' });
                await handleStudentEngagement(existingGlobally.id);

                return { success: true, user: existingGlobally, isExisting: true };
            }

            // ─── STUDENT LIMIT VALIDATION ───────────────────────────────────────
            // SECURITY: Lock subscription row with FOR UPDATE to prevent TOCTOU race.
            // Two concurrent registrations now serialize on the lock: first increments count,
            // second sees updated count and may reject. Prevents exceeding plan limits.
            const subscriptionResult = await tx.execute(
                sql`SELECT ${schoolSubscriptions.id}, ${schoolSubscriptions.school_id}, ${schoolSubscriptions.status}, ${paymentPlans.max_students}
                    FROM ${schoolSubscriptions}
                    LEFT JOIN ${paymentPlans} ON ${schoolSubscriptions.plan_id} = ${paymentPlans.id}
                    WHERE ${schoolSubscriptions.school_id} = ${validatedData.school_id}
                    AND ${schoolSubscriptions.status} = ${'active'}
                    FOR UPDATE OF ${schoolSubscriptions}
                    LIMIT 1`
            );

            const subscription = subscriptionResult[0] as any;

            if (subscription && subscription.max_students !== null) {
                const maxStudents = subscription.max_students;

                // Count current students in this school
                const studentCount = await tx.select({
                    count: sql<number>`cast(count(*) as integer)`
                }).from(students).where(
                    and(
                        eq(students.school_id, validatedData.school_id),
                        isNull(students.deleted_at)
                    )
                );

                const currentCount = studentCount[0]?.count || 0;

                // If limit is reached, reject registration
                if (currentCount >= maxStudents) {
                    return {
                        success: false,
                        error: `Your school has reached its student limit of ${maxStudents} for the current plan. To add more students, please upgrade your subscription plan. Contact your school administrator for more information.`,
                        errorCode: 'STUDENT_LIMIT_EXCEEDED'
                    };
                }
            }

            const hashedPassword = await bcrypt.hash(validatedData.password, 10);
            // Only include email/phone if defined — omitting them lets Postgres default to NULL,
            // preventing the empty-string unique constraint collision bug.
            const insertValues: any = {
                password_hash: hashedPassword,
                first_name: firstName || '',
                last_name: lastName || '',
                school_id: validatedData.school_id,
                gender: validatedData.gender || null,
                cumulative_xp: 0,
                current_streak: 0,
                is_active: true,
                is_verified: false,
            };
            if (emailVal) insertValues.email = emailVal;
            if (phoneVal) insertValues.phone = phoneVal;

            const [newStudent] = await tx.insert(students).values(insertValues).returning();

            // Academic Mapping
            let session = await tx.query.academicSessions.findFirst({
                where: and(
                    eq(academicSessions.school_id, validatedData.school_id),
                    eq(academicSessions.is_current, true)
                )
            });

            if (!session) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(startDate.getFullYear() + 1);

                const [newSession] = await tx.insert(academicSessions).values({
                    name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
                    school_id: validatedData.school_id,
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
                class_id: validatedData.class_id || validatedData.grade,
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
        logger.error('Student registration error', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function registerSchool(formData: any, paymentDetails?: { order_id: string, payment_id: string, signature: string }) {
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
            // 0. VERIFY PAYMENT (if provided)
            if (paymentDetails) {
                const secret = serverEnv.RAZORPAY_KEY_SECRET;
                if (!secret) {
                    throw new Error('Payment gateway not configured on server.');
                }

                const hmacPayload = `${paymentDetails.order_id}|${paymentDetails.payment_id}`;
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(hmacPayload)
                    .digest('hex');

                if (expectedSignature !== paymentDetails.signature) {
                    logger.error('[Registration - FRAUD] Invalid signature', {
                        orderId: paymentDetails.order_id,
                        provided: paymentDetails.signature,
                        expected: expectedSignature
                    });
                    throw new Error('Payment verification failed. Invalid signature.');
                }
            }

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
            const [admin] = await tx.insert(schoolAdmins).values({
                email: email,
                school_id: newSchool.id,
                password_hash: hashedPassword,
                first_name: firstName,
                last_name: lastName || '',
                phone: formData.contact_phone || null,
                is_active: true,
            } as any).returning();

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

            // 5. Handle Subscription and Payment Tracking
            let subscriptionId: string | null = null;
            if (formData.plan_id) {
                const now = new Date();
                const periodEnd = new Date(now);
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);

                const [newSub] = await tx.insert(schoolSubscriptions).values({
                    school_id: newSchool.id,
                    plan_id: formData.plan_id,
                    promo_code_id: formData.promo_code_id || null,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: periodEnd,
                    auto_renew: true,
                } as any).returning();
                subscriptionId = newSub.id;

                // 6. Record Payment Transaction
                if (paymentDetails) {
                    // Fetch plan to get amount
                    const [plan] = await tx.select().from(paymentPlans).where(eq(paymentPlans.id, formData.plan_id));
                    
                    await tx.insert(paymentTransactions).values({
                        school_id: newSchool.id,
                        subscription_id: subscriptionId!,
                        promo_code_id: formData.promo_code_id || null,
                        razorpay_order_id: paymentDetails.order_id,
                        razorpay_payment_id: paymentDetails.payment_id,
                        razorpay_signature: paymentDetails.signature,
                        amount: plan?.price || '0',
                        status: 'captured',
                        created_at: now,
                        updated_at: now
                    } as any);

                    // 7. Atomic Promo Code Increment (only now that it's successful)
                    if (formData.promo_code_id) {
                        await tx.update(promoCodes)
                            .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
                            .where(eq(promoCodes.id, formData.promo_code_id));
                    }
                }
            }

            return { success: true, school: newSchool, admin: admin };
        });

        if (result.success) {
            analyticsService.incrementMetric('total_schools').catch(() => {});
        }



        if (result.success && result.admin) {
            await createSession({ userId: result.admin.id, userType: 'school_admin' });
        }

        return result;
    } catch (error: any) {
        logger.error('School registration error', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function checkIdentifierExists(value: string, role?: 'student' | 'school_admin' | 'super_admin') {
    const trimmed = value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const identifier = trimmed.toLowerCase();

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
        const digitsOnly = value.replace(/\D/g, '');
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
        
        const student = await db.query.students.findFirst({
            where: and(
                or(
                    eq(students.phone, digitsOnly),
                    eq(students.phone, last10),
                    sql`${students.phone} LIKE ${'%' + last10}`
                ), 
                sql`deleted_at IS NULL`
            )
        });
        
        if (student) return { exists: true, role: 'student' };

        const admin = await db.query.schoolAdmins.findFirst({
            where: and(
                or(
                    eq(schoolAdmins.phone, digitsOnly),
                    eq(schoolAdmins.phone, last10),
                    sql`${schoolAdmins.phone} LIKE ${'%' + last10}`
                ),
                sql`deleted_at IS NULL`
            )
        });
        if (admin) return { exists: true, role: 'school_admin' };

        return { exists: false };
    }
}

