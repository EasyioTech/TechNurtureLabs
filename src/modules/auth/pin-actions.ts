'use server';

import { db } from '@/lib/db';
import { students, pinResetRequests, auditLogs, schoolAdmins } from '@/db/schema';
import { eq, and, or, sql, desc, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';

/**
 * Initiates a PIN reset request for a student.
 * Finds the student by email or phone.
 */
export async function requestPinReset(identifier: string) {
    try {
        const trimmed = identifier.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        const iden = trimmed.toLowerCase();

        let student;
        if (isEmail) {
            student = await db.query.students.findFirst({
                where: and(eq(students.email, iden), isNull(students.deleted_at))
            });
        } else {
            const digitsOnly = trimmed.replace(/\D/g, '');
            const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
            student = await db.query.students.findFirst({
                where: and(
                    or(
                        eq(students.phone, digitsOnly),
                        eq(students.phone, last10),
                        sql`${students.phone} LIKE ${'%' + last10}`
                    ),
                    isNull(students.deleted_at)
                )
            });
        }

        if (!student) {
            return { success: false, error: "We couldn't find a student account with that information." };
        }

        // Check if there's already a pending request
        const existingRequest = await db.query.pinResetRequests.findFirst({
            where: and(
                eq(pinResetRequests.student_id, student.id),
                eq(pinResetRequests.status, 'pending')
            )
        });

        if (existingRequest) {
            return { success: true, message: "A request is already pending with your school. Please contact your coordinator." };
        }

        // Create new request
        await db.insert(pinResetRequests).values({
            student_id: student.id,
            school_id: student.school_id,
            status: 'pending'
        } as any);

        // Audit log
        await db.insert(auditLogs).values({
            user_id: student.id,
            user_type: 'student',
            school_id: student.school_id,
            action: 'pin_reset_request',
            entity_type: 'pin_reset_request',
            entity_id: student.id,
            metadata: { identifier: trimmed }
        } as any);

        return { success: true, message: "Request submitted! Your school will review this and provide a new PIN soon." };
    } catch (err: any) {
        console.error("PIN Request Error:", err);
        return { success: false, error: "Failed to submit request. Please try again." };
    }
}

/**
 * Fetches all PIN reset requests for a specific school.
 * Accessible to school admins.
 */
export async function getSchoolPinRequests() {
    const session = await verifySession();
    if (!session || session.userType !== 'school_admin') {
        return { success: false, error: "Unauthorized access" };
    }

    const admin = await db.query.schoolAdmins.findFirst({
        where: eq(schoolAdmins.id, session.userId)
    });

    if (!admin) return { success: false, error: "Admin info not found" };

    const requests = await db.query.pinResetRequests.findMany({
        where: eq(pinResetRequests.school_id, admin.school_id),
        with: {
            student: true
        } as any,
        orderBy: [desc(pinResetRequests.requested_at)]
    });

    return { success: true, requests };
}

/**
 * Handles a PIN reset request (Approve/Reject).
 * If approved, updates the student's PIN.
 */
export async function handlePinResetAction(requestId: string, action: 'approved' | 'rejected', newPin?: string) {
    const session = await verifySession();
    if (!session || session.userType !== 'school_admin') {
        return { success: false, error: "Unauthorized" };
    }

    const request = await db.query.pinResetRequests.findFirst({
        where: eq(pinResetRequests.id, requestId)
    });

    if (!request) return { success: false, error: "Request not found" };
    if (request.status !== 'pending') return { success: false, error: "Request already processed" };

    try {
        await db.transaction(async (tx) => {
            if (action === 'approved') {
                if (!newPin || newPin.length < 6) {
                    throw new Error("A valid 6-digit PIN is required for approval.");
                }

                const hash = await bcrypt.hash(newPin, 10);
                await tx.update(students)
                    .set({ password_hash: hash, updated_at: new Date() })
                    .where(eq(students.id, request.student_id));

                await tx.update(pinResetRequests)
                    .set({
                        status: 'approved',
                        resolved_at: new Date(),
                        resolved_by: session.userId
                        // SECURITY: PIN is NOT stored in DB. Return it in the API response only.
                    } as any)
                    .where(eq(pinResetRequests.id, requestId));
            } else {
                await tx.update(pinResetRequests)
                    .set({
                        status: 'rejected',
                        resolved_at: new Date(),
                        resolved_by: session.userId
                    } as any)
                    .where(eq(pinResetRequests.id, requestId));
            }

            // Log entry
            await tx.insert(auditLogs).values({
                user_id: session.userId,
                user_type: 'school_admin',
                school_id: request.school_id,
                action: 'update',
                entity_type: 'pin_reset_request',
                entity_id: requestId,
                new_values: { status: action }
            } as any);
        });

        revalidatePath('/school-admin/verification');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to process request" };
    }
}
