
/**
 * TECH NURTURE - Stats Flush Worker
 * 
 * This worker periodically flushes accumulated stats (e.g., time spent)
 * from Redis to the PostgreSQL database. This prevents DB write thrashing.
 */

import { redis } from '../src/lib/redis';
import { db } from '../src/lib/db';
import { lessonProgress } from '../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function flushTimeSpent() {
    const flushKey = `stats:needs_flush:time_spent`;
    
    // 1. Get all user:lesson pairs that need flushing
    const entries = await redis.smembers(flushKey);
    if (entries.length === 0) return;

    console.log(`[FlushWorker] Found ${entries.length} entries to flush for time_spent`);

    for (const entry of entries) {
        const [userId, lessonId] = entry.split(':');
        const statsKey = `stats:time_spent:user:${userId}`;

        try {
            // 2. Get the current accumulated value
            const secondsStr = await redis.hget(statsKey, lessonId);
            const seconds = parseInt(secondsStr || '0', 10);

            if (seconds > 0) {
                // 3. Atomically update DB
                await db.update(lessonProgress)
                    .set({
                        time_spent_secs: sql`${lessonProgress.time_spent_secs} + ${seconds}`,
                        updated_at: new Date()
                    })
                    .where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId)));

                // 4. Decrement the value we just flushed from Redis
                // Using HINCRBY -value is safer than HDEL in case more time was added during the DB write
                await redis.hincrby(statsKey, lessonId, -seconds);
            }

            // 5. Remove from the "needs flush" set
            await redis.srem(flushKey, entry);
        } catch (err) {
            console.error(`[FlushWorker] Failed to flush ${entry}:`, err);
        }
    }
}

// Add to imports
import { managePartitions } from './partition-worker';

async function run() {
    console.log('--- Stats Flush Worker Started ---');
    
    let lastPartitionCheck = 0;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    while (true) {
        try {
            // 1. Flush metrics (every 60s)
            await flushTimeSpent();

            // 2. Perform daily maintenance (Partitioning, etc.)
            const now = Date.now();
            if (now - lastPartitionCheck > ONE_DAY_MS) {
                console.log('[FlushWorker] Starting daily scheduled maintenance...');
                await managePartitions();
                lastPartitionCheck = now;
            }
        } catch (err) {
            console.error('[FlushWorker] Iteration failure:', err);
        }
        
        // Sleep for 5 minutes (300 seconds) between flush cycles (Quick Win #5)
        await new Promise(resolve => setTimeout(resolve, 300000));
    }
}

run().catch(err => {
    console.error('[FlushWorker] Critical Startup Failure:', err);
    process.exit(1);
});
