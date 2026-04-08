'use server';

import { verifySession } from '@/lib/auth';
import { exportCompleteSchoolData, uploadSchoolBackupToR2, listSchoolBackups, downloadSchoolBackup, restoreSchoolFromBackup } from '@/lib/services/school-backup-service';
import { revalidatePath } from 'next/cache';

/**
 * SUPER ADMIN ONLY: Trigger backup for a specific school
 * Only super admins can initiate backups
 */
export async function performSchoolBackupAdmin(schoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    // Only super admins can backup
    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can backup schools');
    }

    try {
        console.log(`[Admin Backup] Backing up school: ${schoolId}`);

        // 1. Export all data
        const backup = await exportCompleteSchoolData(schoolId);

        // 2. Upload to R2
        const result = await uploadSchoolBackupToR2(backup, schoolId);

        revalidatePath('/admin-portal/admin/backups');

        return {
            success: true,
            fileName: result.fileName,
            size: result.size,
            timestamp: result.timestamp,
            message: result.message
        };
    } catch (error: any) {
        console.error('[Admin Backup] Backup failed:', error);
        return {
            success: false,
            error: error.message || 'Backup failed'
        };
    }
}

/**
 * SUPER ADMIN ONLY: List backups for a specific school
 */
export async function listSchoolBackupsAdmin(schoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can list backups');
    }

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
        console.error('[Admin Backup] List backups failed:', error);
        return {
            success: false,
            error: error.message,
            backups: []
        };
    }
}

/**
 * SUPER ADMIN ONLY: Download a backup for preview
 */
export async function downloadSchoolBackupFileAdmin(schoolId: string, fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can download backups');
    }

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
        console.error('[Admin Backup] Download failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * SUPER ADMIN ONLY: Restore from backup
 */
export async function restoreSchoolFromBackupFileAdmin(schoolId: string, fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can restore backups');
    }

    try {
        console.log(`[Admin Backup] Restoring school ${schoolId} from ${fileName}`);

        // 1. Download backup
        const backup = await downloadSchoolBackup(fileName);

        // 2. Verify it matches school
        if (backup.schoolId !== schoolId) {
            throw new Error('Backup does not match this school');
        }

        // 3. Restore
        const result = await restoreSchoolFromBackup(backup);

        if (result.success) {
            revalidatePath('/admin-portal/admin/backups');
        }

        return result;
    } catch (error: any) {
        console.error('[Admin Backup] Restore failed:', error);
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
