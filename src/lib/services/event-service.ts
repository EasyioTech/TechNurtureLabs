
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
    metadata?: Record<string, any>;
    timestamp: number;
}

export const eventService = {
    /**
     * Emits an event to the platform.
     * Uses Redis for decoupling triggers from the main request thread.
     */
    emit: async (event: PlatformEvent, payload: EventPayload) => {
        try {
            const fullPayload = {
                type: event,
                ...payload,
                timestamp: payload.timestamp || Date.now()
            };

            // 1. Log to High-Frequency Activity Stream (Redis)
            // This builds the real-time admin dashboard feed
            const streamKey = payload.schoolId ? `stream:school:${payload.schoolId}` : 'stream:global';
            await redis.lpush(streamKey, JSON.stringify(fullPayload));
            await redis.ltrim(streamKey, 0, 99); // Keep latest 100 events

            // 2. Enqueue for background processing (Achievements, Leveling, etc.)
            // We reuse the queueService logic for reliability
            await redis.lpush('queue:platform_events', JSON.stringify(fullPayload));

            console.log(`[EventHub] Emitted: ${event} for user ${payload.userId || 'system'}`);
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
