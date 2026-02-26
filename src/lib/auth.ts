import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redis } from './redis';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-in-production');
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

    (await cookies()).set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_EXPIRY,
    });

    return sessionData;
}

export async function verifySession(): Promise<SessionPayload | null> {
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
        const sessionData = payload as SessionPayload;

        // Verify session exists in Redis
        const exists = await redis.get(`session:${sessionData.sessionId}`);
        if (!exists) return null;

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
