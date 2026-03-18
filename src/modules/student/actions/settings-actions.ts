'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { students, studentAcademicRecords, userSessions, auditLogs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateNotificationPreferences(data: {
    mobile_push?: boolean;
    email_reports?: boolean;
    new_content?: boolean;
}) {
    const session = await verifySession();
    if (!session || session.role !== 'student') {
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
    if (!session || session.role !== 'student') {
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
    if (!session || session.role !== 'student') {
        redirect('/login');
    }

    await db.update(students)
        .set({ privacy_settings: data as any })
        .where(eq(students.id, session.userId));

    revalidatePath('/student/settings');
    return { success: true };
}
