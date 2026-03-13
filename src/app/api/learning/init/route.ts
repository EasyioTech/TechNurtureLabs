import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { initLessonSession } from '@/lib/services/learning-session';
import crypto from 'crypto';

/**
 * Initializes a new learning session with multi-device protection.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId } = await req.json();
        if (!lessonId) {
            return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || 'unknown';
        const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
        
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
        console.error('[Learning Init Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
