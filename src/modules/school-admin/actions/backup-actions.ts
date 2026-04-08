'use server';

import { verifySession } from '@/lib/auth';
import { exportCompleteSchoolData, uploadSchoolBackupToR2, listSchoolBackups, downloadSchoolBackup, restoreSchoolFromBackup } from '@/lib/services/school-backup-service';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { schoolAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Verify that a school admin has access to a specific school
 * @param userId - The admin's user ID from session
 * @param schoolId - The school to verify access for
 * @returns true if authorized, throws error if not
 */
async function verifySchoolAccess(userId: string, userRole: string, schoolId: string): Promise<boolean> {
    // Super admins can access any school
    if (userRole === 'super_admin') {
        return true;
    }

    // School admins must be associated with the school
    if (userRole === 'school_admin') {
        const admin = await db.query.schoolAdmins.findFirst({
            where: eq(schoolAdmins.id, userId),
        });

        if (!admin) {
            throw new Error('Unauthorized: Admin profile not found');
        }

        if (admin.school_id !== schoolId) {
            throw new Error('Unauthorized: Admin does not belong to this school');
        }

        if (!admin.is_active) {
            throw new Error('Unauthorized: Admin account is inactive');
        }

        return true;
    }

    throw new Error('Unauthorized: Only school admins can manage backups');
}

/**
 * School Admin: Trigger backup for their school
 */
/**
 * School Admin: Trigger backup for their school
 * Verifies admin has access to the specified school before proceeding
 */
export async function performSchoolBackup(schoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Verify admin has access to this school
    await verifySchoolAccess(session.userId, session.role, schoolId);

    try {
        console.log(`[Action] Backing up school: ${schoolId}`);

        // 1. Export all data
        const backup = await exportCompleteSchoolData(schoolId);

        // 2. Upload to R2
        const result = await uploadSchoolBackupToR2(backup, schoolId);

        revalidatePath('/school-admin/settings');

        return {
            success: true,
            fileName: result.fileName,
            size: result.size,
            timestamp: result.timestamp,
            message: result.message
        };
    } catch (error: any) {
        console.error('[Action] Backup failed:', error);
        return {
            success: false,
            error: error.message || 'Backup failed'
        };
    }
}

/**
 * School Admin: List backups for their school
 */
/**
 * School Admin: List backups for their school
 */
export async function getSchoolBackupList(schoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Verify admin has access to this school
    await verifySchoolAccess(session.userId, session.role, schoolId);

    try {
        const backups = await listSchoolBackups(schoolId);
        return {
            success: true,
            backups: backups.map(b => ({
                fileName: b.fileName,
                size: b.size,
                timestamp: b.timestamp,
                created: new Date(b.timestamp).toLocaleDateString()
            }))
        };
    } catch (error: any) {
        console.error('[Action] List backups failed:', error);
        return {
            success: false,
            error: error.message,
            backups: []
        };
    }
}

/**
 * School Admin: Download a backup (for preview or download)
 */
/**
 * School Admin: Download a backup (for preview or download)
 */
export async function downloadSchoolBackupFile(schoolId: string, fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Verify admin has access to this school
    await verifySchoolAccess(session.userId, session.role, schoolId);

    try {
        const backup = await downloadSchoolBackup(fileName);

        return {
            success: true,
            backup: {
                schoolName: backup.school.name,
                students: backup.metadata.totalStudents,
                xp: backup.metadata.totalXpDistributed,
                revenue: backup.metadata.totalRevenue,
                records: backup.metadata.recordCounts
            }
        };
    } catch (error: any) {
        console.error('[Action] Download failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * School Admin: Restore from backup (with confirmation)
 */
/**
 * School Admin: Restore from backup (with confirmation)
 */
export async function restoreSchoolFromBackupFile(schoolId: string, fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Verify admin has access to this school
    await verifySchoolAccess(session.userId, session.role, schoolId);

    try {
        console.log(`[Action] Restoring school ${schoolId} from ${fileName}`);

        // 1. Download backup
        const backup = await downloadSchoolBackup(fileName);

        // 2. Verify it matches school
        if (backup.schoolId !== schoolId) {
            throw new Error('Backup does not match this school');
        }

        // 3. Restore
        const result = await restoreSchoolFromBackup(backup);

        if (result.success) {
            revalidatePath('/school-admin');
            revalidatePath('/school-admin/settings');
        }

        return result;
    } catch (error: any) {
        console.error('[Action] Restore failed:', error);
        return {
            success: false,
            timestamp: new Date().toISOString(),
            restoredRecords: {
                school: 0, schoolAdmin: 0, subscription: 0, transactions: 0,
                invoices: 0, academicSessions: 0, classMappings: 0, students: 0,
                academicRecords: 0, quizAttempts: 0, xpTransactions: 0, achievements: 0,
            },
            warnings: [],
            errors: [error.message || 'Restore failed'],
            message: error.message || 'Restore failed'
        };
    }
}
