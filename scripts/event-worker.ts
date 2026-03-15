
/**
 * TECH NURTURE - Platform Event Worker
 * 
 * This worker processes asynchronous gamification and logging tasks.
 * It handles achievement checks, daily challenges, and real-time streams.
 */

import { redis } from '../src/lib/redis';
import { eventService, PlatformEvent, EventPayload } from '../src/lib/services/event-service';
import { gamificationService } from '../src/lib/services/gamification-service';
import { updateDailyChallengeProgress } from '../src/modules/student/actions/challenge-actions';
import { checkAndAwardAchievementsInternal } from '../src/modules/student/actions/achievement-actions';
import { markAchievementCheckNeeded } from '../src/lib/gamification';

async function run() {
    console.log('--- Platform Event Worker Started ---');
    console.log('Monitoring queue: queue:platform_events');

    while (true) {
        try {
            // BRPOP waits up to 60s for a new item
            const res = await redis.brpop('queue:platform_events', 60);
            
            if (res) {
                const [_, rawJob] = res;
                const job = JSON.parse(rawJob);
                await handleEvent(job);
            }
        } catch (err) {
            console.error('[EventWorker] Iteration failure:', err);
            // Wait a bit before retrying to avoid spinning on persistent errors
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function handleEvent(job: any) {
    const { type, userId, schoolId, amount, lessonId, timestamp } = job;
    const eventType = type as PlatformEvent;

    console.log(`[EventWorker] Processing ${eventType} for ${userId || 'system'}`);

    try {
        switch (eventType) {
            case 'student.lesson_completed':
                // 1. Award Achievement Check Needed
                if (userId) await markAchievementCheckNeeded(userId);
                
                // 2. Update Daily Challenges
                if (userId) {
                    await updateDailyChallengeProgress(userId, 'quiz_complete', 1);
                }
                
                // 3. Trigger Achievement Check
                if (userId) await checkAndAwardAchievementsInternal(userId);
                break;

            case 'student.xp_gained':
                if (userId && amount) {
                    // Update daily challenge for XP gain
                    await updateDailyChallengeProgress(userId, 'xp_gain', amount);
                    
                    // Mark as needed for XP-based achievements
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
                break;

            case 'student.quiz_perfect':
                if (userId) {
                    await updateDailyChallengeProgress(userId, 'perfect_quiz', 1);
                    await markAchievementCheckNeeded(userId);
                    await checkAndAwardAchievementsInternal(userId);
                }
                break;

            case 'system.maintenance_run':
                console.log('[EventWorker] System maintenance heart-beat received.');
                break;

            default:
                console.log(`[EventWorker] Unhandled event type: ${eventType}`);
        }
    } catch (err) {
        console.error(`[EventWorker] Failed to process ${eventType}:`, err);
    }
}

// Start the worker
run().catch(err => {
    console.error('[EventWorker] Critical Startup Failure:', err);
    process.exit(1);
});
