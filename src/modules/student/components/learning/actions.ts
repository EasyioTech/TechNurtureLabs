'use server';

import { 
    getCourseDetailsData as getDetails, 
    getStudentDashboardCourses as getDashboardCourses,
    ensureEnrollment as ensureEnrolled
} from '@/modules/student/actions/course-actions';

import {
    getLessonData as getLesson,
    completeLessonAndReward as completeLesson,
    saveVideoProgress as saveVideo,
    updateTimeSpent as updateTime
} from '@/modules/student/actions/lesson-actions';

/**
 * LEGACY BRIDGE ACTIONS
 * These are proxies to the modularized actions in @/modules/student/actions/
 * Using explicit async functions to satisfy Next.js "use server" requirements.
 */

export async function getCourseDetailsData(courseId: string) {
    return getDetails(courseId);
}

export async function ensureEnrollment(courseId: string) {
    return ensureEnrolled(courseId);
}

export async function getStudentDashboardCourses() {
    return getDashboardCourses();
}

export async function getCourseJourneyData(courseId: string) {
    // Legacy support for journey data, which is essentially course details
    const data = await getDetails(courseId);
    // Add school info if available (some legacy components expect it)
    const { getStudentProfileAndStats } = await import('@/modules/student/actions/profile-actions');
    const profileData = await getStudentProfileAndStats().catch(() => null);
    
    return {
        ...data,
        school: profileData?.school || null
    };
}

export async function getLessonData(lessonId: string) {
    return getLesson(lessonId);
}

export async function completeLessonAndReward(lessonId: string, quizScore?: number, isPerfect?: boolean) {
    return completeLesson(lessonId, quizScore, isPerfect);
}

export async function saveVideoProgress(lessonId: string, seconds: number, percentage: number) {
    return saveVideo(lessonId, seconds, percentage);
}

export async function updateTimeSpent(lessonId: string, seconds: number) {
    return updateTime(lessonId, seconds);
}


export async function markLessonComplete(lessonId: string) {
    return completeLesson(lessonId);
}

export async function getLessonsByCourse(courseId: string) {
    // SECURITY: Require authentication
    const { verifySession } = await import('@/lib/auth');
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        throw new Error('Unauthorized: Only authenticated students can access lessons');
    }

    // SECURITY: Verify student is enrolled in the course before returning lessons
    await ensureEnrolled(courseId);

    const { db } = await import('@/lib/db');
    const { lessons } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.course_id, courseId),
        orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
    });

    return courseLessons.map(l => ({
        ...l,
        sequence_index: l.sequence_order,
        duration: l.duration_minutes || 10,
    }));
}
