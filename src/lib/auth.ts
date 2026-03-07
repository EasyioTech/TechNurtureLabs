import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redis } from './redis';

const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL CONFIG ERROR: JWT_SECRET environment variable is missing or too short. It must be at least 32 characters long. The application cannot start securely.');
    } else {
        console.warn('WARNING: Using weak fallback JWT_SECRET for local development. DO NOT use in production.');
    }
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv || 'super-secret-key-change-in-production-123456');
const SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
    userId: string;
    role: string;
    sessionId: string;
};

export async function createSession(payload: Omit<SessionPayload, 'sessionId'>) {
    const sessionId = crypto.randomUUID();
    const sessionData: SessionPayload = { ...payload, sessionId };

    // Store session in Redis
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', SESSION_EXPIRY);

    // Create JWT token with sessionId
    const token = await new SignJWT(sessionData)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const isHttp = appUrl.startsWith('http://') || !isProduction;

    (await cookies()).set('session', token, {
        httpOnly: true,
        secure: isProduction && !isHttp,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_EXPIRY,
    });

    return sessionData;
}

export async function verifySession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
        const sessionData = payload as SessionPayload;

        // Verify session exists in Redis
        const exists = await redis.get(`session:${sessionData.sessionId}`);
        if (!exists) return null;

        // Sliding expiration rotation: Slide TTL if it's nearing expiry
        const ttl = await redis.ttl(`session:${sessionData.sessionId}`);
        if (ttl > 0 && ttl < SESSION_EXPIRY / 2) {
            await redis.expire(`session:${sessionData.sessionId}`, SESSION_EXPIRY);

            const newToken = await new SignJWT(sessionData)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('7d')
                .sign(JWT_SECRET);

            const isProduction = process.env.NODE_ENV === 'production';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
            const isHttp = appUrl.startsWith('http://') || !isProduction;

            cookieStore.set('session', newToken, {
                httpOnly: true,
                secure: isProduction && !isHttp,
                sameSite: 'lax',
                path: '/',
                maxAge: SESSION_EXPIRY,
            });
        }

        return sessionData;
    } catch (error) {
        return null;
    }
}

export async function destroySession() {
    const sessionCookie = (await cookies()).get('session')?.value;
    if (sessionCookie) {
        try {
            const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
            await redis.del(`session:${(payload as SessionPayload).sessionId}`);
        } catch (e) {
            // Ignore JWT errors on logout
        }
    }
    (await cookies()).delete('session');
}
