'use server';

import { verifySession } from '@/lib/auth';
import { exportCompleteSchoolData, uploadSchoolBackupToR2, listSchoolBackups, downloadSchoolBackup, restoreSchoolFromBackup } from '@/lib/services/school-backup-service';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit';

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

        // 3. Log the action
        await createAuditLog({
            userId: session.userId,
            userType: 'super_admin',
            schoolId: schoolId,
            action: 'backup',
            entityType: 'backup',
            entityId: result.fileName,
            metadata: {
                fileName: result.fileName,
                size: result.size,
                type: 'manual'
            }
        });

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
 * SUPER ADMIN ONLY: Trigger backup for ALL schools
 */
export async function performSystemWideBackupAdmin() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const { db } = await import('@/lib/db');
        const { schools } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');

        const allSchools = await db.query.schools.findMany({
            where: eq(schools.is_active, true)
        });

        console.log(`[Admin Backup] Starting system-wide backup for ${allSchools.length} schools`);
        
        const results = [];
        for (const school of allSchools) {
            try {
                const res = await performSchoolBackupAdmin(school.id);
                results.push({ schoolId: school.id, name: school.name, success: res.success });
            } catch (err) {
                results.push({ schoolId: school.id, name: school.name, success: false, error: 'Timed out or failed' });
            }
        }

        // Log system-wide backup
        await createAuditLog({
            userId: session.userId,
            userType: 'super_admin',
            action: 'backup',
            entityType: 'backup',
            entityId: 'system-wide',
            metadata: {
                schoolCount: allSchools.length,
                type: 'system-wide-manual',
                results: results.map(r => ({ id: r.schoolId, success: r.success }))
            }
        });

        revalidatePath('/admin-portal/admin/backups');

        return {
            success: true,
            message: `System-wide backup initiated for ${allSchools.length} schools.`,
            details: results
        };
    } catch (error: any) {
        return { success: false, error: error.message };
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
        const { db } = await import('@/lib/db');
        const { schoolBackups } = await import('@/db/schema');
        const { eq, desc } = await import('drizzle-orm');

        // If schoolId is empty string or null, we're in System-Wide mode
        const isSystemWide = !schoolId || schoolId === '';

        const dbBackups = isSystemWide
            ? await db.query.schoolBackups.findMany({
                orderBy: [desc(schoolBackups.timestamp)],
                limit: 50
              })
            : await db.query.schoolBackups.findMany({
                where: eq(schoolBackups.school_id, schoolId),
                orderBy: [desc(schoolBackups.timestamp)],
              });

        if (dbBackups.length > 0) {
            return {
                success: true,
                backups: dbBackups.map(b => ({
                    fileName: b.file_name,
                    size: b.file_size,
                    timestamp: b.timestamp.toISOString(),
                    created: b.timestamp.toLocaleDateString(),
                    studentCount: b.student_count || 0,
                    revenueTotal: b.revenue_total || "0",
                    recordsCount: b.records_count || {},
                    inDb: true
                }))
            };
        }

        // Fallback to R2 scan
        const backups = await listSchoolBackups(isSystemWide ? '' : schoolId);
        return {
            success: true,
            backups: backups.map(b => ({
                fileName: b.fileName,
                size: b.size,
                timestamp: b.timestamp,
                created: new Date(b.timestamp).toLocaleDateString(),
                inDb: false
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
 * SUPER ADMIN ONLY: Delete a backup file
 */
export async function deleteBackupFileAdmin(schoolId: string, fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    if (session.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can delete backups');
    }

    try {
        const { s3Client } = await import('@/lib/storage');
        const { serverEnv } = await import('@/lib/env.server');

        if (!s3Client) {
            throw new Error('R2 client is unavailable');
        }

        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: fileName,
        });

        await s3Client.send(command);

        // Also delete from database
        try {
            const { db } = await import('@/lib/db');
            const { schoolBackups } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');
            
            await db.delete(schoolBackups).where(eq(schoolBackups.file_name, fileName));
        } catch (dbError) {
            console.error('[Admin Backup] Failed to delete record from DB, but file was removed from R2:', dbError);
        }

        console.log(`[Admin Backup] Deleted backup: ${fileName}`);

        return {
            success: true,
            message: 'Backup deleted successfully'
        };
    } catch (error: any) {
        console.error('[Admin Backup] Delete failed:', error);
        return {
            success: false,
            error: error.message || 'Delete failed'
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

/**
 * SUPER ADMIN ONLY: Sync backups from R2 to Database
 */
export async function syncBackupsFromR2Admin(schoolId: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    if (session.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const { syncSchoolBackupsToDb } = await import('@/lib/services/school-backup-service');
        const count = await syncSchoolBackupsToDb(schoolId);
        
        revalidatePath('/admin-portal/admin/backups');
        
        return { 
            success: true, 
            message: `Synced ${count} backup records from R2` 
        };
    } catch (error: any) {
        console.error('[Admin Backup] Sync failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * SUPER ADMIN ONLY: Get detailed preview metadata from a backup file
 */
export async function getBackupPreviewAdmin(fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    if (session.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const { downloadSchoolBackup } = await import('@/lib/services/school-backup-service');
        const backupData = await downloadSchoolBackup(fileName);
        
        return {
            success: true,
            metadata: {
                schoolName: backupData.school.name,
                studentsCount: backupData.students.length,
                academicRecordsCount: backupData.metadata.recordCounts.academicRecords,
                revenueTotal: backupData.metadata.totalRevenue,
                xpDistributed: backupData.metadata.totalXpDistributed,
                recordCounts: backupData.metadata.recordCounts,
                timestamp: backupData.timestamp,
                coverage: {
                    academic: true,
                    enrollments: true,
                    billing: true,
                    quizzes: true,
                    achievements: true
                }
            }
        };
    } catch (error: any) {
        console.error('[Admin Backup] Preview failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * SUPER ADMIN ONLY: Get a presigned download URL for a backup file
 */
export async function getBackupDownloadUrlAdmin(fileName: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    if (session.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const { getSignedDownloadUrl } = await import('@/lib/storage');
        const url = await getSignedDownloadUrl(`backups/${fileName}`, 600); // 10 minutes
        
        return { success: true, url };
    } catch (error: any) {
        console.error('[Admin Backup] URL generation failed:', error);
        return { success: false, error: error.message };
    }
}
