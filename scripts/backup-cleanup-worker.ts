/**
 * TECH NURTURE — Backup Cleanup Worker
 *
 * Runs daily at 2 AM to clean up old backups (> 7 days old)
 * This is a separate worker process that:
 * - Lists all backups in R2
 * - Identifies backups older than RETENTION_DAYS
 * - Deletes only backup files (NOT course data)
 * - Logs cleanup statistics
 */

import { cleanupOldBackups, getBackupStatistics } from '../src/lib/services/backup-cleanup-service';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Run once per day
const CLEANUP_HOUR = 2; // Run at 2 AM

console.log('✅ TechNurture LMS - Starting Backup Cleanup Worker...');
console.log(`⏰ Scheduled to run daily at ${CLEANUP_HOUR}:00 AM`);

/**
 * Calculate milliseconds until next cleanup window
 */
function getNextCleanupDelay(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(CLEANUP_HOUR, 0, 0, 0);

    // If the scheduled time has already passed today, schedule for tomorrow
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();
    console.log(`⏳ Next cleanup scheduled for ${next.toLocaleString()}`);
    return delay;
}

/**
 * Run the cleanup
 */
async function runCleanup() {
    const timestamp = new Date().toLocaleString();
    console.log(`\n========================================`);
    console.log(`[Backup Cleanup] Starting at ${timestamp}`);
    console.log(`========================================`);

    try {
        // Get stats before cleanup
        const statsBefore = await getBackupStatistics();
        if (statsBefore.success) {
            console.log(`\n📊 Backup Statistics Before Cleanup:`);
            console.log(`   Total Backups: ${statsBefore.stats?.totalBackups}`);
            console.log(`   Course Backups: ${statsBefore.stats?.courseBackups}`);
            console.log(`   Lesson Backups: ${statsBefore.stats?.lessonBackups}`);
            console.log(`   Old Backups (> ${statsBefore.stats?.retentionDays} days): ${statsBefore.stats?.oldBackups}`);
            console.log(`   Total Size: ${statsBefore.stats?.totalSizeMB} MB`);
            console.log(`   Old Size: ${statsBefore.stats?.oldSizeMB} MB`);
        }

        // Perform cleanup
        const cleanupResult = await cleanupOldBackups();
        if (cleanupResult.success) {
            console.log(`\n✅ Cleanup Successful!`);
            console.log(`   Deleted: ${cleanupResult.deletedCount} backups`);
            console.log(`   Freed: ${cleanupResult.freedMB} MB`);
            console.log(`   Message: ${cleanupResult.message}`);
        } else {
            console.log(`\n❌ Cleanup Failed!`);
            console.log(`   Reason: ${cleanupResult.reason || cleanupResult.error}`);
        }

        // Get stats after cleanup
        const statsAfter = await getBackupStatistics();
        if (statsAfter.success) {
            console.log(`\n📊 Backup Statistics After Cleanup:`);
            console.log(`   Total Backups: ${statsAfter.stats?.totalBackups}`);
            console.log(`   Total Size: ${statsAfter.stats?.totalSizeMB} MB`);
        }

    } catch (error) {
        console.error(`\n❌ Cleanup Error:`, error);
    }

    console.log(`\n[Backup Cleanup] Completed at ${new Date().toLocaleString()}`);
    console.log(`========================================\n`);

    // Schedule next cleanup
    const nextDelay = getNextCleanupDelay();
    setTimeout(runCleanup, nextDelay);
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

/**
 * Start the worker
 */
const initialDelay = getNextCleanupDelay();
console.log(`\n--- Backup Cleanup Worker Ready ---\n`);
setTimeout(runCleanup, initialDelay);
