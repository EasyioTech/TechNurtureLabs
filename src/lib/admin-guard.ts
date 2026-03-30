'use server';

import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { schoolAdmins, students, classes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Auth guard for super-admin server actions.
 * Throws a plain Error('UNAUTHORIZED') instead of calling redirect().
 *
 * Why: redirect() inside a server action throws NEXT_REDIRECT which forces
 * an immediate browser navigation — even for transient Redis/DB blips.
 * Using throw allows the client hook's catch block to decide whether to
 * redirect (persistent auth failure) or show a toast and retry (transient).
 */
export async function requireSuperAdmin() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        throw new Error('UNAUTHORIZED');
    }
    return session;
}

/**
 * CRITICAL FIX #2: Verify school admin belongs to the requested school.
 * MUST be called on every school-specific admin route.
 *
 * This prevents:
 * - Admin from school A accessing admin dashboard for school B
 * - Admin from school A viewing student data for school B
 * - Admin from school A modifying courses for school B
 *
 * @param requestedSchoolId - The school ID being accessed
 * @returns {Promise<{session, admin}>} - Verified session and admin record
 * @throws {Error} - 'UNAUTHORIZED' if admin doesn't belong to this school
 */
export async function requireSchoolAdmin(requestedSchoolId: string) {
    const session = await verifySession();

    if (!session || session.userType !== 'school_admin') {
        throw new Error('UNAUTHORIZED');
    }

    // CRITICAL: Verify the admin actually belongs to this school
    // This is the missing check that allows cross-school data access
    const admin = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.id, session.userId),
            eq(schoolAdmins.school_id, requestedSchoolId),
            eq(schoolAdmins.is_active, true)
        )
    });

    if (!admin) {
        throw new Error('UNAUTHORIZED');
    }

    return { session, admin };
}

/**
 * CRITICAL FIX #2: Verify student belongs to the requested school.
 * Use this when students access their own school-specific data.
 *
 * @param requestedSchoolId - The school ID being accessed
 * @returns {Promise<{session, student}>} - Verified session and student record
 * @throws {Error} - 'UNAUTHORIZED' if student doesn't belong to this school
 */
export async function requireStudentInSchool(requestedSchoolId: string) {
    const session = await verifySession();

    if (!session || session.userType !== 'student') {
        throw new Error('UNAUTHORIZED');
    }

    // Verify student belongs to this school
    const student = await db.query.students.findFirst({
        where: and(
            eq(students.id, session.userId),
            eq(students.school_id, requestedSchoolId),
            eq(students.is_active, true)
        )
    });

    if (!student) {
        throw new Error('UNAUTHORIZED');
    }

    return { session, student };
}
