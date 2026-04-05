'use server';

import { db } from '@/lib/db';
import { schoolAdmins, students } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { requireSchoolAdmin } from '@/lib/admin-guard';
import { redirect } from 'next/navigation';

/**
 * CRITICAL FIX #2: Wrapper for school admin verification with redirect fallback
 * Uses centralized requireSchoolAdmin() from /src/lib/admin-guard.ts
 */
export async function verifySchoolAdminContext(targetSchoolId: string) {
    try {
        await requireSchoolAdmin(targetSchoolId);
    } catch (err) {
        const session = await verifySession();
        if (!session) {
            redirect('/school-portal/login');
        }
        throw err;
    }
}

/**
 * Helper: Verify student belongs to requesting admin's school
 */
export async function verifyStudentContext(targetUserId: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/school-portal/login');
    }
    if (session.userType === 'super_admin') return;

    const currentUser = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, session.userId) } as any);
    if (!currentUser) throw new Error('Unauthorized');

    const targetStudent = await db.query.students.findFirst({ where: eq(students.id, targetUserId) });

    if (!targetStudent || currentUser.school_id !== targetStudent.school_id) {
        throw new Error('Forbidden: Privatized Learner Record.');
    }
}


