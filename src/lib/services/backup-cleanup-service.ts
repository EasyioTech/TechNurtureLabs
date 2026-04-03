import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

const BACKUP_RETENTION_DAYS = 7; // Keep backups for 7 days

/**
 * Auto-cleanup old backups from R2 storage
 * Runs periodically to remove backups older than BACKUP_RETENTION_DAYS
 * Only deletes backup files, NOT course data
 */
export async function cleanupOldBackups() {
    if (!isCloudflareConfigured || !s3Client) {
        console.log('[Backup Cleanup] R2 not configured, skipping cleanup');
        return { success: false, reason: 'R2 not configured' };
    }

    try {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

        console.log(`[Backup Cleanup] Starting cleanup for backups older than ${cutoffDate.toISOString()}`);

        // List all backups
        const courseBackups = await listBackupsInPrefix('backups/courses/');
        const lessonBackups = await listBackupsInPrefix('backups/lessons/');

        const allBackups = [...courseBackups, ...lessonBackups];
        console.log(`[Backup Cleanup] Found ${allBackups.length} total backups`);

        let deletedCount = 0;
        let totalSize = 0;

        // Filter and delete old backups
        for (const backup of allBackups) {
            if (backup.lastModified && backup.lastModified < cutoffDate) {
                try {
                    await deleteBackupFile(backup.key);
                    deletedCount++;
                    totalSize += backup.size || 0;
                    console.log(`[Backup Cleanup] Deleted old backup: ${backup.key}`);
                } catch (err) {
                    console.error(`[Backup Cleanup] Failed to delete ${backup.key}:`, err);
                }
            }
        }

        const message = `Cleanup complete: deleted ${deletedCount} old backups (${(totalSize / 1024 / 1024).toFixed(2)} MB freed)`;
        console.log(`[Backup Cleanup] ${message}`);

        return {
            success: true,
            deletedCount,
            freedMB: (totalSize / 1024 / 1024).toFixed(2),
            message
        };
    } catch (error: any) {
        console.error('[Backup Cleanup] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * List all backups in a specific R2 prefix
 */
async function listBackupsInPrefix(prefix: string): Promise<Array<{
    key: string;
    size: number;
    lastModified?: Date;
}>> {
    if (!s3Client) return [];

    try {
        const command = new ListObjectsV2Command({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        return (response.Contents || []).map(item => ({
            key: item.Key || '',
            size: item.Size || 0,
            lastModified: item.LastModified,
        })).filter(b => b.key); // Filter out empty keys
    } catch (error) {
        console.error(`[Backup Cleanup] Error listing ${prefix}:`, error);
        return [];
    }
}

/**
 * Delete a single backup file from R2
 */
async function deleteBackupFile(key: string): Promise<void> {
    if (!s3Client) throw new Error('S3 client not available');

    const command = new DeleteObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * Manual trigger for cleanup (for testing or manual runs)
 */
export async function triggerBackupCleanup() {
    console.log('[Backup Cleanup] Manual cleanup triggered');
    return await cleanupOldBackups();
}

/**
 * Get backup statistics for monitoring
 */
export async function getBackupStatistics() {
    if (!isCloudflareConfigured || !s3Client) {
        return { success: false, reason: 'R2 not configured' };
    }

    try {
        const courseBackups = await listBackupsInPrefix('backups/courses/');
        const lessonBackups = await listBackupsInPrefix('backups/lessons/');

        const now = new Date();
        const cutoffDate = new Date(now.getTime() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

        const allBackups = [...courseBackups, ...lessonBackups];
        const oldBackups = allBackups.filter(b => b.lastModified && b.lastModified < cutoffDate);

        const totalSize = allBackups.reduce((sum, b) => sum + (b.size || 0), 0);
        const oldSize = oldBackups.reduce((sum, b) => sum + (b.size || 0), 0);

        return {
            success: true,
            stats: {
                totalBackups: allBackups.length,
                courseBackups: courseBackups.length,
                lessonBackups: lessonBackups.length,
                oldBackups: oldBackups.length,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                oldSizeMB: (oldSize / 1024 / 1024).toFixed(2),
                retentionDays: BACKUP_RETENTION_DAYS,
            }
        };
    } catch (error: any) {
        console.error('[Backup Statistics] Error:', error);
        return { success: false, error: error.message };
    }
}
