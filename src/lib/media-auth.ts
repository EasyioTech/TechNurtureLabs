import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from './db';
import { enrollments, mediaAssets } from '@/db/schema';
import type { SessionPayload } from './auth';

interface MediaAuthResult {
    allowed: boolean;
    status?: number;
    message?: string;
}

/**
 * Verify media HMAC token (deterministic, non-expiring)
 * Used for: media downloads, HLS manifests, R2 presigned access
 */
export function verifyMediaHmac(filePath: string, token: string | null, isHls: boolean): boolean {
    const mediaSecret = process.env.MEDIA_SECRET;
    if (!mediaSecret || !token) return false;

    try {
        // Reconstruct expected HMAC
        const signTarget = isHls ? filePath.split('/').slice(0, -1).join('/') : filePath;
        const expected = createHmac('sha256', mediaSecret)
            .update(signTarget)
            .digest('hex');

        // Constant-time comparison to prevent timing attacks
        return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
        return false;
    }
}

/**
 * Verify media access based on enrollment and file path
 *
 * Rules:
 * - Admins (school_admin, super_admin): pass-through after session check
 * - Students: require enrollment for lesson/* and course/* paths
 * - All users: can access branding/, library/, avatars/ (public assets)
 * - Unknown prefixes: fail-closed (403)
 */
export async function verifyMediaAccess(session: SessionPayload | null, filePath: string): Promise<MediaAuthResult> {
    if (!session) {
        return { allowed: false, status: 401, message: 'Not authenticated' };
    }

    const { userId, role } = session;

    // Admins bypass path-based checks (already verified session)
    if (role === 'school_admin' || role === 'super_admin') {
        return { allowed: true };
    }

    // Student-only rules
    if (role === 'student') {
        // Extract prefix from path
        const pathSegments = filePath.split('/').filter(Boolean);
        if (pathSegments.length === 0) {
            return { allowed: false, status: 403, message: 'Invalid media path' };
        }
        const prefix = pathSegments[0];

        // Public asset prefixes — no enrollment check needed
        const publicPrefixes = new Set(['branding', 'library', 'avatars']);
        if (publicPrefixes.has(prefix)) {
            return { allowed: true };
        }

        // Lesson-specific or course-specific paths require enrollment
        if (prefix === 'lesson' || prefix === 'course') {
            try {
                // For lesson/course paths, we need enrollment in the course
                // Extract course ID from path and verify enrollment
                // Path format typically: lesson/[courseId]/[lessonId]/filename
                // or course/[courseId]/filename
                if (pathSegments.length < 2) {
                    return { allowed: false, status: 403, message: 'Invalid lesson/course path' };
                }

                const courseId = pathSegments[1];

                const enrollment = await db.query.enrollments.findFirst({
                    where: and(
                        eq(enrollments.user_id, userId),
                        eq(enrollments.course_id, courseId),
                        isNull(enrollments.deleted_at)
                    ),
                });

                if (!enrollment) {
                    return { allowed: false, status: 403, message: 'Not enrolled in this course' };
                }

                return { allowed: true };
            } catch (error) {
                return { allowed: false, status: 500, message: 'Authorization check failed' };
            }
        }

        // Unknown prefix — fail-closed
        return { allowed: false, status: 403, message: 'Access to this media category denied' };
    }

    // No other roles
    return { allowed: false, status: 403, message: 'Insufficient permissions' };
}
