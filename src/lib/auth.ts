import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redis } from './redis';
import { db } from './db';
import { userSessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { serverEnv } from '@/lib/env.server';
import crypto from 'crypto';

const jwtSecretEnv = serverEnv.JWT_SECRET;
const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';

if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
    if (serverEnv.NODE_ENV === 'production' && !isBuild) {
        throw new Error('CRITICAL CONFIG ERROR: JWT_SECRET environment variable is missing or too short. It must be at least 32 characters long. The application cannot start securely.');
    } else {
        console.warn('WARNING: Using weak fallback JWT_SECRET for local development or build time. DO NOT use in production.');
    }
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv || 'super-secret-key-change-in-production-123456');

// TOKENS CONFIG
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_DAYS;

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

    // Store session in DB (Persistence + Rotation context)
    await db.insert(userSessions).values({
        id: sessionId,
        user_id: payload.userId,
        user_type: payload.userType,
        refresh_token_hash: refreshTokenHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000),
    });

    // Mirror in Redis for fast verification
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', REFRESH_TOKEN_EXPIRY_SECONDS);

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
        maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    return sessionData;
}

/**
 * Verifies session and performs automatic rotation if access token is expired but refresh token is valid.
 */
export async function verifySession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken && !refreshToken) return null;

    // 1. Try Access Token first
    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, JWT_SECRET);
            const sessionData = payload as SessionPayload;

            // Optional: Check Redis to ensure it hasn't been revoked
            const exists = await redis.get(`session:${sessionData.sessionId}`);
            if (exists) return sessionData;
        } catch (error: any) {
            // If expired, fall through to refresh logic
            if (error.code !== 'ERR_JWT_EXPIRED') return null;
        }
    }

    // 2. Access Token failed/expired, try Refresh Token
    if (!refreshToken) return null;

    try {
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find active session in DB
        const sessionRow = await db.query.userSessions.findFirst({
            where: and(
                eq(userSessions.refresh_token_hash, refreshTokenHash),
                gt(userSessions.expires_at, new Date())
            )
        });

        if (!sessionRow || sessionRow.revoked_at) {
            // If refresh token is used but not found or revoked, it might be a reuse attack.
            // In a strict implementation, we'd revoke all sessions for this user.
            return null;
        }

        // ROTATE: Generate new refresh token
        const newRefreshToken = crypto.randomBytes(32).toString('hex');
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const sessionId = sessionRow.id;

        const sessionData: SessionPayload = {
            userId: sessionRow.user_id,
            userType: sessionRow.user_type as any,
            role: sessionRow.user_type as any,
            sessionId: sessionId
        };

        // If it's a student/admin, we might need to fetch their true role.
        // For now, payload in JWT is better but we lost it if token expired.
        // We can store a minimal payload in Redis or the userSessions table.
        // Let's check Redis for existing metadata before we proceed.
        const cachedData = await redis.get(`session:${sessionId}`);
        const finalSessionData = cachedData ? JSON.parse(cachedData) : sessionData;

        await db.update(userSessions)
            .set({
                refresh_token_hash: newRefreshTokenHash,
                last_used_at: new Date(),
            })
            .where(eq(userSessions.id, sessionId));

        // Update Redis TTL
        await redis.expire(`session:${sessionId}`, REFRESH_TOKEN_EXPIRY_SECONDS);

        // Issue new Access Token
        const newAccessToken = await new SignJWT(finalSessionData)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(ACCESS_TOKEN_EXPIRY)
            .sign(JWT_SECRET);

        const isProduction = serverEnv.NODE_ENV === 'production';
        const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || '';
        const isHttp = appUrl.startsWith('http://') || !isProduction;

        cookieStore.set('session', newAccessToken, {
            httpOnly: true,
            secure: isProduction && !isHttp,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15,
        });

        cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isProduction && !isHttp,
            sameSite: 'strict',
            path: '/',
            maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
        });

        return finalSessionData;
    } catch (error) {
        return null;
    }
}

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
                await redis.del(`session:${session.id}`);
            }
        } catch (e) {
            // Ignore errors
        }
    }

    cookieStore.delete('session');
    cookieStore.delete('refresh_token');
}
