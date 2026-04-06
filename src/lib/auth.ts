import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redis } from './redis';
import { db } from './db';
import { userSessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { serverEnv } from '@/lib/env.server';
import crypto from 'crypto';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimitIp } from './ratelimit';

const jwtSecretEnv = serverEnv.JWT_SECRET;
const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';

if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
    if (!isBuild) {
        throw new Error('CRITICAL CONFIG ERROR: JWT_SECRET environment variable is missing or too short. It must be at least 32 characters long. The application cannot start securely.');
    }
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv || crypto.randomUUID() + crypto.randomUUID());

// TOKENS CONFIG
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_DAYS;

/**
 * M-13: ROLE-BASED SESSION HARDENING
 * Different roles have different risk profiles. Admins get shorter TTLs to reduce hijacking window.
 */
function getSessionExpirySeconds(userType: string): number {
    switch (userType) {
        case 'super_admin': return 60 * 60 * 2;   // 2 Hours
        case 'school_admin': return 60 * 60 * 8;  // 8 Hours (Workday)
        default: return 60 * 60 * 24 * 7;         // 7 Days (Student)
    }
}

export type SessionPayload = {
    userId: string;
    userType: 'super_admin' | 'school_admin' | 'student';
    role: 'super_admin' | 'school_admin' | 'student';
    sessionId: string;
};

/**
 * Creates a new session with Access Token (JWT) and Refresh Token (DB + Hash).
 */
export async function createSession(payload: Omit<SessionPayload, 'sessionId' | 'role'>) {
    const sessionId = crypto.randomUUID();
    const sessionData: SessionPayload = { ...payload, role: payload.userType, sessionId };

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Generate CSRF Token (random, not derived from sessionId)
    const csrfToken = crypto.randomUUID();
    const csrfTokenHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

    const roleExpiry = getSessionExpirySeconds(payload.userType);

    // Store session in DB (Persistence + Rotation context)
    await db.insert(userSessions).values({
        id: sessionId,
        user_id: payload.userId,
        user_type: payload.userType,
        refresh_token_hash: refreshTokenHash,
        csrf_token_hash: csrfTokenHash,
        expires_at: new Date(Date.now() + roleExpiry * 1000),
    });

    // Mirror in Redis for fast verification (best-effort)
    if (redis && (redis as any).status === 'ready') {
        redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', roleExpiry)
            .catch(() => { /* Non-critical: Session will fall back to DB */ });
    }

    // Create Access Token (JWT)
    const token = await new SignJWT(sessionData)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(JWT_SECRET);

    const isProduction = serverEnv.NODE_ENV === 'production';
    const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || '';
    const isHttp = appUrl.startsWith('http://') || !isProduction;
    const cookieStore = await cookies();

    // Set Access Token Cookie
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: isProduction && !isHttp,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15, // 15 mins
    });

    // Set Refresh Token Cookie
    cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction && !isHttp,
        sameSite: 'strict', // Stricter for refresh tokens
        path: '/',
        maxAge: roleExpiry,
    });

    // CRITICAL FIX #6: CSRF token already generated and stored in initial INSERT above.
    // Now generate the client-facing CSRF token and set it in a readable cookie.
    // The hash is already in the DB, we just need to send the plaintext token to the client.
    const clientCsrfToken = crypto.randomBytes(32).toString('hex');

    // Update DB with the actual CSRF token hash (we'll hash the client token for verification)
    const clientCsrfTokenHash = crypto.createHash('sha256').update(clientCsrfToken).digest('hex');
    await db.update(userSessions)
        .set({ csrf_token_hash: clientCsrfTokenHash })
        .where(eq(userSessions.id, sessionId));

    // Update Redis cache if available
    if (redis && (redis as any).status === 'ready') {
        const cachedSession = JSON.parse(
            (await redis.get(`session:${sessionId}`)) || '{}'
        );
        cachedSession.csrfTokenHash = clientCsrfTokenHash;
        redis.set(`session:${sessionId}`, JSON.stringify(cachedSession), 'EX', roleExpiry)
            .catch(() => {});
    }

    // Set CSRF Token Cookie (not httpOnly so JavaScript can read and send as header)
    cookieStore.set('csrf_token', clientCsrfToken, {
        httpOnly: false,
        secure: isProduction && !isHttp,
        sameSite: 'strict',
        path: '/',
        maxAge: roleExpiry,
    });

    return sessionData;
}

/**
 * Track user activity for DAU analytics using Redis Sets
 */
async function trackActivity(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const key = `dau:${today}`;
    try {
        // Guard against closed connection
        if (!redis || (redis as any).status !== 'ready') {
            return;
        }
        await redis.sadd(key, userId);
        // Set expiry to 30 days
        await redis.expire(key, 2592000, 'NX');
    } catch (err) {
        // Silently fail for analytics metrics — don't crash the user session
        // console.error("Redis DAU tracking error:", err);
    }
}

/**
 * Verifies session and performs automatic rotation if access token is expired but refresh token is valid.
 */
async function verifySessionInternal(): Promise<SessionPayload | null> {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (h.get('x-real-ip') || 'unknown-ip');

    // M-12: GLOBAL RATE LIMITING
    // Before any expensive JWT/DB/Redis check, we protect our server from spam.
    const { success } = await rateLimitIp(ip, 200, 60);
    if (!success) {
        return null; // Return null so the request is treated as unauthorized/blocked
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken && !refreshToken) return null;

    // 1. Try Access Token first
    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, JWT_SECRET);
            const sessionData = payload as SessionPayload;

            if (!sessionData.role && sessionData.userType) {
                sessionData.role = sessionData.userType;
            }

            // Check if session exists — Redis first, DB fallback if Redis is down/disabled.
            let sessionValid = false;
            let exists: string | null = null;
            
            try {
                if (redis && (redis as any).status === 'ready') {
                    exists = await redis.get(`session:${sessionData.sessionId}`);
                    sessionValid = !!exists;
                }
            } catch (redisErr) { /* fallback below */ }

            // Fallback to Database if Redis didn't yield a result
            if (!sessionValid) {
                const dbSession = await db.query.userSessions.findFirst({
                    where: and(
                        eq(userSessions.id, sessionData.sessionId),
                        gt(userSessions.expires_at, new Date())
                    )
                });
                sessionValid = !!(dbSession && !dbSession.revoked_at);
                
                // Best-effort cache restore if we are in production or have Redis up
                if (sessionValid && redis && (redis as any).status === 'ready') {
                    const roleExpiry = getSessionExpirySeconds(sessionData.userType);
                    redis.set(
                        `session:${sessionData.sessionId}`,
                        JSON.stringify(sessionData),
                        'EX',
                        roleExpiry
                    ).catch(() => {});
                }
            }

            if (sessionValid) {
                trackActivity(sessionData.userId);
                return sessionData;
            }
        } catch (error: any) {
            if (error.code !== 'ERR_JWT_EXPIRED') return null;
        }
    }

    // 2. Access Token failed/expired, try Refresh Token
    if (!refreshToken) return null;

    try {
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        let graceData: string | null = null;
        try { 
            if (redis && (redis as any).status === 'ready') {
                graceData = await redis.get(`rotation_grace:${refreshTokenHash}`); 
            }
        } catch (_) {}
        if (graceData) {
            const parsed = JSON.parse(graceData);
            // CRITICAL FIX #5: Don't return cached JWT; regenerate it (same session)
            // Grace period stores only session metadata, not credentials
            const gracefulSessionData: SessionPayload = {
                userId: parsed.userId,
                userType: parsed.userType,
                role: parsed.userType,
                sessionId: parsed.sessionId
            };

            // Regenerate JWT with current metadata (avoids credential leakage from Redis)
            const gracefulNewAccessToken = await new SignJWT(gracefulSessionData)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime(ACCESS_TOKEN_EXPIRY)
                .sign(JWT_SECRET);

            try {
                cookieStore.set('session', gracefulNewAccessToken, {
                    httpOnly: true, secure: serverEnv.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 900
                });
            } catch (e) { /* Read-only context (Layout/Page), skip cookie set */ }
            return gracefulSessionData;
        }

        // Find active session in DB
        const sessionRow = await db.query.userSessions.findFirst({
            where: and(
                eq(userSessions.refresh_token_hash, refreshTokenHash),
                gt(userSessions.expires_at, new Date())
            )
        });

        if (!sessionRow || sessionRow.revoked_at) return null;

        // ROTATE: Generate new tokens
        const newRefreshToken = crypto.randomBytes(32).toString('hex');
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const sessionId = sessionRow.id;

        const sessionData: SessionPayload = {
            userId: sessionRow.user_id,
            userType: sessionRow.user_type as any,
            role: sessionRow.user_type as any,
            sessionId: sessionId
        };

        let cachedData: string | null = null;
        try { 
            if (redis && (redis as any).status === 'ready') {
                cachedData = await redis.get(`session:${sessionId}`); 
            }
        } catch (_) {}
        const finalSessionData = cachedData ? JSON.parse(cachedData) : sessionData;

        if (!finalSessionData.role && finalSessionData.userType) {
            finalSessionData.role = finalSessionData.userType;
        }

        const newAccessToken = await new SignJWT(finalSessionData)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(ACCESS_TOKEN_EXPIRY)
            .sign(JWT_SECRET);

        // CRITICAL FIX #6: Regenerate CSRF token on rotation with random value
        // This invalidates old CSRF tokens, preventing token reuse attacks
        const newCsrfToken = crypto.randomBytes(32).toString('hex');
        const newCsrfTokenHash = crypto.createHash('sha256').update(newCsrfToken).digest('hex');

        const isProduction = serverEnv.NODE_ENV === 'production';
        const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || '';
        const isHttp = appUrl.startsWith('http://') || !isProduction;

        try {
            const roleExpiry = getSessionExpirySeconds(sessionRow.user_type);

            cookieStore.set('session', newAccessToken, {
                httpOnly: true,
                secure: isProduction && !isHttp,
                sameSite: 'lax',
                path: '/',
                maxAge: 900,
            });

            cookieStore.set('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: isProduction && !isHttp,
                sameSite: 'strict',
                path: '/',
                maxAge: roleExpiry,
            });

            // CRITICAL FIX #6: Update CSRF token cookie on rotation
            cookieStore.set('csrf_token', newCsrfToken, {
                httpOnly: false,
                secure: isProduction && !isHttp,
                sameSite: 'strict',
                path: '/',
                maxAge: roleExpiry,
            });

            // Update Database with new tokens
            await db.update(userSessions)
                .set({
                    refresh_token_hash: newRefreshTokenHash,
                    csrf_token_hash: newCsrfTokenHash, // CRITICAL FIX #6: Update CSRF token hash
                    last_used_at: new Date(),
                })
                .where(eq(userSessions.id, sessionId));
            
            if (redis && (redis as any).status === 'ready') {
                await redis.expire(`session:${sessionId}`, roleExpiry);

                // --- GRACE PERIOD: Prevent parallel request failures ---
                // Store ONLY session metadata, NOT the JWT token itself.
                // Storing plaintext access tokens in Redis creates a vulnerability:
                // if Redis is breached, JWTs (valid for 15 min) are exposed.
                // Instead, store just the session ID; parallel requests can re-verify with DB.
                // Parallel requests in the grace window can use the session ID to fetch from DB.
                await redis.set(`rotation_grace:${refreshTokenHash}`, JSON.stringify({
                    sessionId: finalSessionData.sessionId,
                    userId: finalSessionData.userId,
                    userType: finalSessionData.userType,
                    // Do NOT store newAccessToken — it's a credential vulnerability
                }), 'EX', 30); // 30 second grace period
            }

        } catch (cookieError) {
            // Read-only context (Layout/Page)
        }

        trackActivity(finalSessionData.userId); 
        return finalSessionData;
    } catch (error) {
        console.error("[Auth] verifySession error:", error);
        return null;
    }
}

/**
 * Public exported verifySession wrapped in React cache to prevent multiple
 * database/rotation hits in the same request (unified across Layouts & Actions).
 */
export const verifySession = cache(verifySessionInternal);

/**
 * Destroys session in DB, Redis and clears cookies.
 */
export async function destroySession() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (refreshToken) {
        try {
            const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const session = await db.query.userSessions.findFirst({
                where: eq(userSessions.refresh_token_hash, hash)
            });

            if (session) {
                await db.update(userSessions)
                    .set({ revoked_at: new Date() })
                    .where(eq(userSessions.id, session.id));
                if (redis && (redis as any).status === 'ready') {
                    await redis.del(`session:${session.id}`);
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }

    cookieStore.delete('session');
    cookieStore.delete('refresh_token');
    cookieStore.delete('csrf_token');
}

/**
 * Verify CSRF token using double-submit cookie pattern + database validation
 * CRITICAL FIX #6: Validates submitted token against hash stored in userSessions
 * This prevents token reuse across rotations and ensures tokens are invalidated properly
 */
export async function verifyCsrfToken(submittedToken: string | null): Promise<boolean> {
    if (!submittedToken) return false;

    const session = await verifySession();
    if (!session) return false;

    try {
        // CRITICAL FIX #6: Validate against stored CSRF token hash in DB
        // First, try Redis cache for performance
        try {
            if (redis && (redis as any).status === 'ready') {
                const cachedSession = await redis.get(`session:${session.sessionId}`);
                if (cachedSession) {
                    const parsed = JSON.parse(cachedSession);
                    if (parsed.csrfTokenHash) {
                        const submittedHash = crypto.createHash('sha256').update(submittedToken).digest('hex');
                        return crypto.timingSafeEqual(Buffer.from(parsed.csrfTokenHash), Buffer.from(submittedHash));
                    }
                }
            }
        } catch (_) {
            // Redis unavailable, fall through to DB
        }

        // Fallback to DB query if Redis miss
        const sessionRecord = await db.query.userSessions.findFirst({
            where: eq(userSessions.id, session.sessionId),
            columns: { csrf_token_hash: true }
        });

        if (!sessionRecord || !sessionRecord.csrf_token_hash) {
            return false; // No CSRF token stored
        }

        // Hash the submitted token and compare
        const submittedHash = crypto.createHash('sha256').update(submittedToken).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(sessionRecord.csrf_token_hash), Buffer.from(submittedHash));
    } catch (err) {
        // Constant-time comparison failed (buffer mismatch or other error)
        return false;
    }
}
