'use server';

import { db } from '@/lib/db';
import { schoolAdmins, pinResetRequests, students } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifySchoolAdminContext } from './shared';
import { createAuditLog } from '@/lib/audit';

export async function getSchoolPinRequests(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    
    const requests = await db.query.pinResetRequests.findMany({
        where: eq(pinResetRequests.school_id, schoolId),
        with: {
            student: true
        },
        orderBy: [desc(pinResetRequests.requested_at)],
        limit: 50
    });

    return {
        success: true,
        requests: requests.map(r => ({
            ...r,
            student_name: `${r.student?.first_name} ${r.student?.last_name}`,
            student_email: r.student?.email
        }))
    };
}

export async function resolvePinRequest(requestId: string, action: 'approved' | 'rejected', newPin?: string) {
    const session = await (await import('@/lib/auth')).verifySession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const request = await db.query.pinResetRequests.findFirst({
        where: eq(pinResetRequests.id, requestId)
    });

    if (!request) return { success: false, error: 'Request not found' };
    await verifySchoolAdminContext(request.school_id);

    if (action === 'approved') {
        if (!newPin) return { success: false, error: 'New PIN is required for approval' };
        
        await db.transaction(async (tx) => {
            const hashedPin = await bcrypt.hash(newPin, 10);
            await tx.update(students)
                .set({ password_hash: hashedPin })
                .where(eq(students.id, request.student_id));

            await tx.update(pinResetRequests)
                .set({
                    status: 'approved',
                    resolved_at: new Date(),
                    resolved_by: session.userId
                })
                .where(eq(pinResetRequests.id, requestId));

            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                action: 'approved',
                entityType: 'student',
                entityId: request.student_id,
                metadata: { field: 'pin_reset', requestId },
                tx
            });
        });
    } else {
        await db.update(pinResetRequests)
            .set({
                status: 'rejected',
                resolved_at: new Date(),
                resolved_by: session.userId
            })
            .where(eq(pinResetRequests.id, requestId));

        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            action: 'reject',
            entityType: 'student',
            entityId: request.student_id,
            metadata: { field: 'pin_reset', requestId }
        });
    }

    return { success: true };
}

export async function updateSchoolAdminPassword(schoolId: string, adminId: string, currentPass: string, newPass: string) {

    await verifySchoolAdminContext(schoolId);

    const admin = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.school_id, schoolId),
            eq(schoolAdmins.id, adminId)
        )
    });

    if (!admin) return { success: false, message: 'Admin not found' };

    const isValid = await bcrypt.compare(currentPass, admin.password_hash);
    if (!isValid) return { success: false, message: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPass, 10);
    await db.update(schoolAdmins)
        .set({ password_hash: newHash })
        .where(eq(schoolAdmins.id, admin.id));

    const session = await (await import('@/lib/auth')).verifySession();
    if (session) {
        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            action: 'update',
            entityType: 'user',
            entityId: adminId,
            metadata: { field: 'password' }
        });
    }

    return { success: true, message: 'Password updated successfully' };
}

export async function updateSchoolAdminProfile(schoolId: string, adminId: string, data: { first_name: string, last_name: string }) {
    await verifySchoolAdminContext(schoolId);

    await db.update(schoolAdmins)
        .set({
            first_name: data.first_name,
            last_name: data.last_name,
            updated_at: new Date()
        })
        .where(and(
            eq(schoolAdmins.id, adminId),
            eq(schoolAdmins.school_id, schoolId)
        ));

    return { success: true, message: 'Profile updated successfully' };
}
