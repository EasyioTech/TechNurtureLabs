'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { students, studentAcademicRecords, userSessions, auditLogs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateNotificationPreferences(data: {
    mobile_push?: boolean;
    email_reports?: boolean;
    new_content?: boolean;
}) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    await db.update(students)
        .set({ notification_preferences: data as any })
        .where(eq(students.id, session.userId));

    revalidatePath('/student/settings');
    return { success: true };
}

export async function updateAppearanceSettings(data: {
    dark_mode?: boolean;
}) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    await db.update(students)
        .set({ appearance_settings: data as any })
        .where(eq(students.id, session.userId));

    revalidatePath('/student/settings');
    return { success: true };
}

export async function updatePrivacySettings(data: {
    public_profile?: boolean;
}) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    await db.update(students)
        .set({ privacy_settings: data as any })
        .where(eq(students.id, session.userId));

    revalidatePath('/student/settings');
    return { success: true };
}

export async function changeStudentPin(currentPin: string, newPin: string) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 6 digits.' };
    }

    const student = await db.query.students.findFirst({
        where: and(eq(students.id, session.userId), isNull(students.deleted_at)),
        columns: { id: true, school_id: true, password_hash: true }
    });

    if (!student || !student.password_hash) {
        return { success: false, error: 'Account not found.' };
    }

    const isMatch = await bcrypt.compare(currentPin, student.password_hash);
    if (!isMatch) {
        return { success: false, error: 'Current PIN is incorrect.' };
    }

    const newHash = await bcrypt.hash(newPin, 10);

    await db.update(students)
        .set({ password_hash: newHash, updated_at: new Date() })
        .where(eq(students.id, session.userId));

    await db.insert(auditLogs).values({
        user_id: session.userId,
        user_type: 'student',
        school_id: student.school_id,
        action: 'password_change',
        entity_type: 'student',
        entity_id: session.userId,
        new_values: { pin_changed: true }
    } as any);

    return { success: true };
}
