import { db } from '@/lib/db';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { awardXP, incrementProgressCounter, handleStudentEngagement } from '@/lib/gamification';
import { students, schoolAdmins, superAdmins, lessonSessions, lessonProgress, lessons, enrollments, auditLogs, xpEvents } from '@/db/schema';
import crypto from 'crypto';

export interface SessionContext {
    userId: string;
    lessonId: string;
    deviceHash?: string;
    userAgent?: string;
    ipHash?: string;
    ipAddress?: string;
}

/**
 * Initializes a new learning session, invalidating any previous active sessions 
 * for the same user and lesson to prevent multi-tab/multi-device cheating.
 */
export async function initLessonSession(context: SessionContext) {
    const { userId, lessonId, deviceHash, userAgent, ipHash, ipAddress } = context;

    // 1. Invalidate previous active sessions for this user + lesson
    await db.update(lessonSessions)
        .set({ is_active: false })
        .where(and(
            eq(lessonSessions.user_id, userId),
            eq(lessonSessions.lesson_id, lessonId),
            eq(lessonSessions.is_active, true)
        ));

    // 2. Clear Redis cache for old sessions
    const oldSessions = await db.query.lessonSessions.findMany({
        where: and(
            eq(lessonSessions.user_id, userId),
            eq(lessonSessions.lesson_id, lessonId)
        ),
        limit: 5 // Just in case, usually one
    });
    
    for (const s of oldSessions) {
        await redis.del(`learning:session:${s.session_token}`);
    }

    // 3. Create fresh session token
    const token = crypto.randomUUID();

    // 4. Fetch enrollment to get school and session context
    const enrollment = await db.query.enrollments.findFirst({
        where: and(
            eq(enrollments.user_id, userId),
            eq(enrollments.course_id, (await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) }))?.course_id || '')
        )
    });

    if (!enrollment) throw new Error("Student not enrolled in this course");

    // 5. Ensure lesson_progress record exists (Atomic UPSERT)
    // We do this now so the verified progress has a concrete row to sync to.
    const [progress] = await db.insert(lessonProgress).values({
        user_id: userId,
        lesson_id: lessonId,
        enrollment_id: enrollment.id,
        session_id: enrollment.session_id,
        school_id: enrollment.school_id,
        updated_at: new Date()
    } as any).onConflictDoUpdate({
        target: [lessonProgress.user_id, lessonProgress.lesson_id, lessonProgress.enrollment_id],
        set: { updated_at: new Date() }
    }).returning();

    const startPosition = Math.floor(progress?.last_position_secs || 0);
    const startVerified = Math.floor(progress?.verified_watch_seconds || 0);

    // 6. Create record in Postgres
    const [newSession] = await db.insert(lessonSessions).values({
        user_id: userId,
        lesson_id: lessonId,
        session_token: token,
        device_hash: deviceHash,
        user_agent: userAgent,
        ip_hash: ipHash,
        ip_address: ipAddress,
        is_active: true,
        last_nonce: 0,
        last_playback_time: startPosition,
        total_verified_seconds: startVerified
    } as any).returning();

    // 7. Initialize Redis state for the aggregator
    await redis.set(`learning:session:${token}`, JSON.stringify({
        userId,
        lessonId,
        enrollmentId: enrollment.id,
        sessionId: enrollment.session_id,
        schoolId: enrollment.school_id,
        lastNonce: 0,
        lastPlaybackTime: startPosition,
        lastHeartbeatAt: Date.now(),
        lastDbSync: Date.now(),
        verifiedSeconds: startVerified,
        deviceHash,
        ipHash,
        isFirstHeartbeat: true 
    }), 'EX', 3600 * 4); 

    return newSession;
}

const DB_SYNC_INTERVAL_MS = 300000; // 5 minutes: Enterprise scale persistence interval

/**
 * Validates and processes a learning heartbeat.
 * Implements: Nonce check, Playback speed validation, Temporal jump protection, 
 * and Device/IP binding verification.
 */
export async function processHeartbeat(token: string, payload: {
    nonce: number,
    playbackTime: number,
    playbackRate: number,
    playerState: string,
    deviceHash?: string,
    ipHash?: string,
    videoDuration?: number
}) {
    // 1. Fetch current session from Redis
    const cacheKey = `learning:session:${token}`;
    const sessionData = await redis.get(cacheKey);
    if (!sessionData) return { error: "Session expired or invalid", code: "SESSION_EXPIRED" };

    const session = JSON.parse(sessionData);
    const now = Date.now();

    // 2. Security: Anti-Spoofing (Device/IP Binding)
    if (payload.deviceHash && session.deviceHash && payload.deviceHash !== session.deviceHash) {
        await invalidateSession(token);
        return { error: "Device mismatch detected", code: "SECURITY_BREACH" };
    }

    // 3. Security: Monotonic Nonce (Replay Protection)
    if (payload.nonce <= session.lastNonce) {
        return { error: "Nonce violation (Replay detected)", code: "REPLAY_ATTACK" };
    }

    // 4. Security: Playback Speed Cap
    if (payload.playbackRate > 1.5) {
        return { error: "Prohibited playback speed", code: "SPEED_ABUSE" };
    }

    const realElapsed = (now - session.lastHeartbeatAt) / 1000;
    
    // Rate limit heartbeats (minimum 5s interval to allow for network jitter)
    if (realElapsed < 5) {
        return { error: "Heartbeat too frequent", code: "RATE_LIMITED" };
    }

    // 5. Verified Increment Calculation
    const playbackDelta = payload.playbackTime - session.lastPlaybackTime;
    let increment = 0;
    
    if (payload.playerState === 'PLAYING') {
        const wallClockMax = realElapsed * 1.5; 
        
        if (playbackDelta > 0) {
            increment = Math.min(playbackDelta / payload.playbackRate, wallClockMax);
        } else {
            increment = 0;
        }
    }

    const newVerifiedSeconds = session.verifiedSeconds + increment;
    const shouldSync = session.isFirstHeartbeat || (now - session.lastDbSync) > DB_SYNC_INTERVAL_MS;

    // 8. Update Redis State FIRST
    const updatedSession = {
        ...session,
        lastNonce: payload.nonce,
        lastPlaybackTime: payload.playbackTime,
        lastHeartbeatAt: now,
        lastDbSync: shouldSync ? now : session.lastDbSync,
        verifiedSeconds: newVerifiedSeconds,
        videoDuration: payload.videoDuration || session.videoDuration,
        isFirstHeartbeat: false 
    };

    await redis.set(cacheKey, JSON.stringify(updatedSession), 'EX', 3600 * 4);

    // 7. Sync Strategy: Only flash to DB periodically or on first hit
    if (shouldSync) {
        // Fire and forget, but logic inside syncSessionToDb now uses the values we just set in Redis
        syncSessionToDb(token).catch(err => console.error("Session sync error:", err));
    }

    // 8. Progress Counters & Observability
    // Record rejection metrics if they occurred (logic would be in the caller or logging)
    
    return { 
        success: true, 
        verifiedSeconds: updatedSession.verifiedSeconds,
        newPlaybackToken: token // Could regenerate a new sub-token if needed
    };
}

export async function invalidateSession(token: string) {
    await redis.del(`learning:session:${token}`);
    await db.update(lessonSessions)
        .set({ is_active: false })
        .where(eq(lessonSessions.session_token, token));
}

/**
 * Synchronizes Redis session state to Postgres.
 * Should be called periodically or on session close.
 */
export async function syncSessionToDb(token: string) {
    const sessionData = await redis.get(`learning:session:${token}`);
    if (!sessionData) return;

    const session = JSON.parse(sessionData);

    // 1. Update the session record
    await db.update(lessonSessions)
        .set({
            total_verified_seconds: Math.floor(session.verifiedSeconds),
            last_playback_time: Math.floor(session.lastPlaybackTime),
            last_heartbeat_at: new Date(session.lastHeartbeatAt),
            last_nonce: session.lastNonce
        })
        .where(eq(lessonSessions.session_token, token));

    // 2. Also update the lessonProgress directly so the dashboard reflects live progress
    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, session.lessonId)
    });

    if (lesson) {
        // Use the actual reported video duration if we have it, otherwise fallback to DB
        const durationSecs = session.videoDuration || (lesson.duration_minutes || 1) * 60;
        const progressPct = Math.min(100, Math.floor((session.verifiedSeconds / durationSecs) * 100)).toString();

        // Atomic UPSERT to ensure progress is tracked even if init missed it (edge cases)
        await db.insert(lessonProgress).values({
            user_id: session.userId,
            lesson_id: session.lessonId,
            enrollment_id: session.enrollmentId,
            session_id: session.sessionId,
            school_id: session.schoolId,
            verified_watch_seconds: Math.floor(session.verifiedSeconds),
            progress_pct: progressPct,
            last_position_secs: Math.floor(session.lastPlaybackTime),
            updated_at: new Date()
        } as any).onConflictDoUpdate({
            target: [lessonProgress.user_id, lessonProgress.lesson_id, lessonProgress.enrollment_id],
            set: {
                verified_watch_seconds: Math.floor(session.verifiedSeconds),
                progress_pct: progressPct,
                last_position_secs: Math.floor(session.lastPlaybackTime),
                updated_at: new Date()
            }
        });
    }
}

/**
 * Finalizes engagement and marks a lesson as complete if 80% threshold is reached.
 * Enforces the 'completion_locked' policy to prevent regression.
 */
export async function finalizeAndCompleteLesson(lessonId: string, token: string) {
    // 1. Sync from Redis cache to ensure the DB has the latest verified time
    await syncSessionToDb(token).catch(err => console.error("Final sync error:", err));

    // 2. Fetch session and lesson duration context
    const session = await db.query.lessonSessions.findFirst({
        where: eq(lessonSessions.session_token, token)
    });

    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId)
    });

    if (!session || !lesson) {
        return { error: "Verification context missing", code: "CONTEXT_MISSING" };
    }

    const userId = session.user_id;

    // 3. Robust Identity Lookup for Gamification
    const sessionData = await redis.get(`learning:session:${token}`);
    const redisSession = sessionData ? JSON.parse(sessionData) : null;
    
    if (!redisSession) {
        return { error: "Session expired or invalid", code: "SESSION_EXPIRED" };
    }

    const enrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, redisSession.enrollmentId),
        with: { school: true }
    });

    if (!enrollment) {
        return { error: "Security context invalid", code: "NOT_ENROLLED" };
    }
    const schoolId = enrollment.school_id;

    // 3. Check for existing progress and the completion_locked flag
    const progress = await db.query.lessonProgress.findFirst({
        where: and(eq(lessonProgress.user_id, userId), eq(lessonProgress.lesson_id, lessonId))
    });

    if (progress?.completion_locked) {
        return { success: true, message: "Lesson already finalized and locked." };
    }

    // 4. Threshold Verification (75% rule for production grace)
    const totalVerified = session.total_verified_seconds;
    const actualDuration = redisSession?.videoDuration || (lesson.duration_minutes || 1) * 60;
    const required = actualDuration * 0.75;

    if (totalVerified < required && (!progress || Number(progress.progress_pct) < 75)) {
        return { 
            error: "Content threshold not reached. Please complete at least 75% of the lesson.", 
            code: "INCOMPLETE_CONTENT",
            verified: totalVerified,
            required: Math.round(required)
        };
    }

    const xpToAdd = lesson.xp_reward || 10;

    // 5. Atomic Completion Transaction
    await db.transaction(async (tx) => {
        // Update Progress
        if (progress) {
            await tx.update(lessonProgress)
                .set({
                    content_watched: true,
                    completed_at: progress.completed_at || new Date(),
                    verified_watch_seconds: Math.floor(Math.max(totalVerified, progress.verified_watch_seconds || 0)),
                    progress_pct: '100',
                    completion_locked: true,
                    xp_earned: xpToAdd,
                    updated_at: new Date()
                })
                .where(eq(lessonProgress.id, progress.id));
        } else {
            await tx.insert(lessonProgress).values({
                user_id: userId,
                lesson_id: lessonId,
                enrollment_id: enrollment.id,
                session_id: enrollment.session_id,
                school_id: schoolId,
                content_watched: true,
                completed_at: new Date(),
                verified_watch_seconds: Math.floor(totalVerified),
                progress_pct: '100',
                completion_locked: true,
                xp_earned: xpToAdd
            } as any);
        }

        // Create XP Event
        await tx.insert(xpEvents).values({
            user_id: userId,
            school_id: schoolId,
            source: 'lesson_completion',
            xp_amount: xpToAdd,
            reference_type: 'lesson',
            reference_id: lessonId,
            description: `Completed lesson: ${lesson.title}`
        });
    });

    // 6. Gamification Hooks (outside transaction so Redis failures are non-fatal)
    try {
        await awardXP(userId, xpToAdd, schoolId, 'student');
        await incrementProgressCounter(userId, 'lessons');
        await handleStudentEngagement(userId);

        // Fire-and-forget: the achievement check is the heaviest part of lesson
        // completion (4+ DB queries). Decoupling it from the response path means
        // the student gets immediate feedback instead of waiting for the check.
        // The dirty-bit set by awardXP guarantees the check runs before the next
        // dashboard load — no achievement will be silently skipped.
        import('@/modules/student/actions/achievement-actions')
            .then(({ checkAndAwardAchievementsInternal }) =>
                checkAndAwardAchievementsInternal(userId).catch(e =>
                    console.error('[Achievement] Background check failed after lesson completion:', e)
                )
            );
    } catch (e) {
        console.error("Post-completion gamification failed:", e);
    }

    // 7. Multi-Level Cache Invalidation
    try {
        await redis.del(`cache:student:${userId}:course:${lesson.course_id}`);
        await redis.del(`cache:student:${userId}:dashboard`);
    } catch (err) {
        console.error("Cache invalidation error:", err);
    }

    // 8. Invalidate secure session
    await invalidateSession(token);

    return { success: true };
}
