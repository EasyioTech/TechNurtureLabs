import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { initLessonSession } from '@/lib/services/learning-session';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Initializes a new learning session with multi-device protection.
 * SECURITY: Validates all inputs and ensures student role
 */
const initSessionSchema = z.object({
    lessonId: z.string().uuid('Invalid lesson ID format')
});

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = initSessionSchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json(
                { error: body.error.issues[0]?.message ?? 'Invalid request' },
                { status: 400 }
            );
        }

        const { lessonId } = body.data;

        const userAgent = req.headers.get('user-agent') || 'unknown';
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
        
        // Create hashes for session binding
        const deviceHash = crypto.createHash('sha256').update(userAgent).digest('hex');
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        const lessonSession = await initLessonSession({
            userId: session.userId,
            lessonId,
            deviceHash,
            userAgent,
            ipHash,
            ipAddress: ip
        });

        return NextResponse.json({
            sessionToken: lessonSession.session_token,
            lastPosition: lessonSession.last_playback_time,
            verifiedSeconds: lessonSession.total_verified_seconds
        });
    } catch (error: any) {
        // Log only in development to avoid information leakage
        if (process.env.NODE_ENV === 'development') {
            console.error('[Learning Init Error]:', error);
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
