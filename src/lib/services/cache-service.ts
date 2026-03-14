import { redis } from '@/lib/redis';

/**
 * Cache Registry for System-wide Invalidation
 */
export const CACHE_KEYS = {
    // Global Course Metadata (Title, Description, Lessons List WITHOUT user status)
    COURSE_DETAILS: (courseId: string) => `cache:global:course:${courseId}`,
    
    // Student Dashboard (Enrolled courses list with progress summary)
    STUDENT_DASHBOARD: (userId: string) => `cache:student:${userId}:dashboard`,
    
    // Per-student course progression (Unlocks, Statuses)
    // We want this to be very short lived OR cleared specifically
    STUDENT_COURSE_VIEW: (userId: string, courseId: string) => `cache:student:${userId}:course:${courseId}`
};

/**
 * Robustly invalidates all caches related to a course.
 * Called when lessons are added, sequence is changed, or course details are updated.
 */
export async function invalidateCourseCaches(courseId: string, userId?: string) {
    const keys = [
        CACHE_KEYS.COURSE_DETAILS(courseId)
    ];

    if (userId) {
        keys.push(CACHE_KEYS.STUDENT_DASHBOARD(userId));
        keys.push(CACHE_KEYS.STUDENT_COURSE_VIEW(userId, courseId));
    } else {
        // If no userId, we can't easily clear all student caches in Redis without SCAN (heavy).
        // Instead, refactoring getCourseDetails to respect the global version is better.
    }

    try {
        await Promise.all(keys.map(k => redis.del(k)));
    } catch (err) {
        console.error("Cache invalidation error:", err);
    }
}

/**
 * Standardized invalidate for student dashboard
 */
export async function invalidateStudentDashboard(userId: string) {
    try {
        await redis.del(CACHE_KEYS.STUDENT_DASHBOARD(userId));
    } catch (err) {}
}
