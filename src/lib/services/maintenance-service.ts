import { db } from '../db';
import { userSessions, lessonSessions } from '@/db/schema';
import { lt, sql } from 'drizzle-orm';

export const maintenanceService = {
    /**
     * Purge sessions older than N days to prevent table bloat.
     */
    async purgeOldSessions(days: number = 30) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);

        console.log(`[Maintenance] Starting purge of sessions older than ${days} days (${threshold.toISOString()})...`);

        try {
            // 1. Inactive lesson sessions
            const lessonPurge = await db.delete(lessonSessions)
                .where(lt(lessonSessions.started_at, threshold));
            
            // 2. Expired user auth sessions
            const authPurge = await db.delete(userSessions)
                .where(lt(userSessions.expires_at, threshold));

            console.log(`[Maintenance] Purge complete.`);
            return {
                lessonSessionsRemoved: lessonPurge.length,
                authSessionsRemoved: authPurge.length
            };
        } catch (err) {
            console.error(`[Maintenance] Purge failed:`, err);
            throw err;
        }
    },

    /**
     * Re-calculate global analytics and sync to Redis to prevent drift.
     */
    async syncAnalytics() {
        console.log(`[Maintenance] Synchronizing analytics from DB...`);
        const { analyticsService } = await import('./analytics-service');
        const { students, schools, courses, enrollments } = await import('@/db/schema');
        const { count, isNull } = await import('drizzle-orm');

        const [stdCount] = await db.select({ val: count() }).from(students).where(isNull(students.deleted_at));
        const [schCount] = await db.select({ val: count() }).from(schools).where(isNull(schools.deleted_at));
        const [crsCount] = await db.select({ val: count() }).from(courses).where(isNull(courses.deleted_at));
        const [enrCount] = await db.select({ val: count() }).from(enrollments).where(isNull(enrollments.deleted_at));

        const metrics = {
            total_students: stdCount.val,
            total_schools: schCount.val,
            total_courses: crsCount.val,
            total_enrollments: enrCount.val
        };

        await analyticsService.syncFromDb(metrics);
        return metrics;
    }
};
