/**
 * TECH NURTURE — Stats Flush Worker Service
 * 
 * Consolidates the stats flushing and maintenance logic into the main app process.
 */

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { lessonProgress } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

let isRunning = false;

export function startStatsWorker() {
    if (isRunning) return;
    isRunning = true;

    console.log('--- [Consolidated] Stats Flush Worker Starting ---');

    // Start the background loop
    runLoop().catch(err => {
        console.error('[StatsWorker] Critical Loop Failure:', err);
    });
}

async function runLoop() {
    while (true) {
        try {
            await flushTimeSpent();
        } catch (err) {
            console.error('[StatsWorker] Iteration failure:', err);
        }

        // Sleep for 5 minutes (300 seconds) between flush cycles
        await new Promise(resolve => setTimeout(resolve, 300000));
    }
}

async function flushTimeSpent() {
    const flushKey = `stats:needs_flush:time_spent`;

    try {
        const entries = await redis.smembers(flushKey);
        if (entries.length === 0) return;

        console.log(`[StatsWorker] Flushing ${entries.length} entries for time_spent`);

        for (const entry of entries) {
            const [userId, lessonId] = entry.split(':');
            const statsKey = `stats:time_spent:user:${userId}`;

            try {
                const secondsStr = await redis.hget(statsKey, lessonId);
                const seconds = parseInt(secondsStr || '0', 10);

                if (seconds > 0) {
                    await db.update(lessonProgress)
                        .set({
                            time_spent_secs: sql`${lessonProgress.time_spent_secs} + ${seconds}`,
                            updated_at: new Date()
                        })
                        .where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId)));

                    await redis.hincrby(statsKey, lessonId, -seconds);
                }
                await redis.srem(flushKey, entry);
            } catch (err) {
                console.error(`[StatsWorker] Failed to flush ${entry}:`, err);
            }
        }
    } catch (err) {
        console.error('[StatsWorker] Error in flushTimeSpent:', err);
    }
}
