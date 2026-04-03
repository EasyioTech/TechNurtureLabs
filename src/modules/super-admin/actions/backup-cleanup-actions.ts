'use server';

import { cleanupOldBackups, getBackupStatistics, triggerBackupCleanup } from '@/lib/services/backup-cleanup-service';
import { requireSuperAdmin } from '@/lib/admin-guard';

/**
 * Manual trigger for backup cleanup (admin only)
 */
export async function performBackupCleanupAction() {
    const session = await requireSuperAdmin();

    try {
        const result = await triggerBackupCleanup();
        return result;
    } catch (error: any) {
        console.error('[Backup Cleanup Action] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get backup storage statistics (admin only)
 */
export async function getBackupStatsAction() {
    const session = await requireSuperAdmin();

    try {
        const result = await getBackupStatistics();
        return result;
    } catch (error: any) {
        console.error('[Backup Stats Action] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Auto-cleanup function (called by cron job)
 * This should be called periodically via a background job
 */
export async function autoCleanupBackups() {
    // This can be called without auth in cron context
    try {
        const result = await cleanupOldBackups();
        console.log('[Auto Cleanup] Result:', result);
        return result;
    } catch (error: any) {
        console.error('[Auto Cleanup] Error:', error);
        return { success: false, error: error.message };
    }
}
