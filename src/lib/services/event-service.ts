
// import 'server-only';
import { redis } from '../redis';
import { queueService } from './queue-service';

/**
 * 🎯 TECH NURTURE EVENT HUB
 * Centralized service for decoupled event management.
 * 
 * Flow:
 * 1. Action/Service calls eventService.emit('category:action', payload)
 * 2. Event is pushed to Redis for immediate processing or worker pickup
 */

export type PlatformEvent = 
    | 'student.lesson_completed'
    | 'student.lesson_completed_full'
    | 'student.quiz_perfect'
    | 'student.xp_gained'
    | 'student.achievement_unlocked'
    | 'admin.school_created'
    | 'admin.course_published'
    | 'system.maintenance_run';

export interface EventPayload {
    userId?: string;
    schoolId?: string;
    courseId?: string;
    lessonId?: string;
    amount?: number;
    xpAmount?: number;
    role?: string;
    quizScore?: number;
    isPerfect?: boolean;
    metadata?: Record<string, any>;
    timestamp: number;
}

import { platformQueue } from '../queue/platform-queue';

export const eventService = {
    /**
     * Emits an event to the platform.
     * Uses BullMQ for persistent, retryable background processing (SCALE BREAKER B).
     */
    emit: async (event: PlatformEvent, payload: EventPayload) => {
        try {
            const fullPayload = {
                type: event,
                ...payload,
                timestamp: payload.timestamp || Date.now()
            };

            // 1. Log to High-Frequency Activity Stream (Redis LPush/LTrim)
            // Still uses simple direct Redis for zero-latency dashboard feeds
            const streamKey = payload.schoolId ? `stream:school:${payload.schoolId}` : 'stream:global';
            await redis.lpush(streamKey, JSON.stringify(fullPayload));
            await redis.ltrim(streamKey, 0, 99); 

            // 2. Enqueue for background processing (BullMQ)
            // SCALE BREAKER B: We move from volatile LPUSH to persistent BullMQ.
            // This ensures XP, badges, and metrics are never lost even if the worker fails.
            await platformQueue.add(event, fullPayload, {
                removeOnComplete: true,
                attempts: 5,
                backoff: { type: 'exponential', delay: 2000 }
            });

            console.log(`[EventHub] Queued: ${event} for user ${payload.userId || 'system'}`);
            return true;
        } catch (err) {
            console.error('[EventHub] Failed to emit event:', err);
            return false;
        }
    },

    /**
     * Retrieves the latest activity for a specific scope
     */
    getActivityStream: async (schoolId?: string): Promise<any[]> => {
        const streamKey = schoolId ? `stream:school:${schoolId}` : 'stream:global';
        try {
            const raw = await redis.lrange(streamKey, 0, 20);
            return raw.map(r => JSON.parse(r));
        } catch (_) {
            return []; // Redis unavailable — return empty stream
        }
    }
};
