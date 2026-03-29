
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

/**
 * PRODUCTION-GRADE PARTITION MANAGER
 * 
 * Automatically ensures that PostgreSQL partitions exist for the current 
 * and future months. This prevents system crashes during month rollovers.
 * 
 * Targets: audit_logs (partitioned by RANGE on created_at)
 */

export async function managePartitions() {
    console.log('[PartitionManager] Starting maintenance check...');
    
    const now = new Date();
    
    // Check current month and next 3 months to be safe
    for (let i = 0; i <= 3; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
        
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const partitionName = `audit_logs_p${year}_${month}`;
        
        const startTime = targetDate.toISOString().split('T')[0];
        const endTime = nextMonthDate.toISOString().split('T')[0];
        
        try {
            // Check if partition exists
            const exists = await db.execute(sql`
                SELECT 1 FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname = ${partitionName} AND n.nspname = 'public'
            `);
            
            if (exists.length === 0) {
                console.log(`[PartitionManager] Creating partition ${partitionName} for range ${startTime} to ${endTime}`);
                
                await db.execute(sql.raw(`
                    CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF audit_logs 
                    FOR VALUES FROM ('${startTime}') TO ('${endTime}')
                `));
                
                console.log(`[PartitionManager] ✅ Successfully created ${partitionName}`);
            } else {
                console.log(`[PartitionManager] Partition ${partitionName} already exists.`);
            }
        } catch (err) {
            console.error(`[PartitionManager] Failed to ensure partition ${partitionName}:`, err);
        }
    }
    
    console.log('[PartitionManager] Maintenance complete.');
}

// Execute only if run directly via 'npx tsx scripts/partition-worker.ts'
// This prevents the partition check from running (and exiting the process) 
// when imported by the stats-flush-worker or other services.
const isMainModule = process.argv[1] && (
    process.argv[1].endsWith('partition-worker.ts') || 
    process.argv[1].endsWith('partition-worker')
);

if (isMainModule) {
    managePartitions().then(() => {
        console.log('[PartitionManager] Manual check finished. Exiting...');
        process.exit(0);
    }).catch(err => {
        console.error('[PartitionManager] Critical failure:', err);
        process.exit(1);
    });
}
