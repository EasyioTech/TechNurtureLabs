import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { processHeartbeat } from '@/lib/services/learning-session';
import crypto from 'crypto';
import { rateLimitService } from '@/lib/services/rate-limit';
import { analyticsService } from '@/lib/services/analytics-service';

/**
 * Handles student learning heartbeats with replay and jump protection.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // Rate Limit: Max 15 heartbeats per minute (standard is one every 10-15s)
        const { allowed } = await rateLimitService.checkUserLimit(userId, 'heartbeat', 15, 60);
        if (!allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const payload = await req.json();
        const { sessionToken, nonce, playbackTime, playbackRate, playerState, videoDuration } = payload;

        if (!sessionToken || nonce === undefined || playbackTime === undefined) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || 'unknown';
        const deviceHash = crypto.createHash('sha256').update(userAgent).digest('hex');

        const result = await processHeartbeat(sessionToken, userId, {
            nonce,
            playbackTime,
            playbackRate: playbackRate || 1.0,
            playerState: playerState || 'PAUSED',
            deviceHash,
            videoDuration
        });

        if (result.error) {
            return NextResponse.json({
                error: result.error,
                code: result.code,
                resumeTo: (result as any).resumeTo
            }, { status: 403 });
        }

        // PCU must track every heartbeat (5-min sliding window).
        // DAU/MAU only need to be recorded once per day — checked via a short-lived
        // Redis NX key, so subsequent heartbeats skip the extra Redis pipeline entirely.
        analyticsService.trackConcurrentUser(userId).catch(() => {});
        analyticsService.trackActiveUserOnce(userId).catch(() => {});
        // Also capture continuous hour engagement for the User Pulse Heatmap
        analyticsService.trackActiveUserHour(userId).catch(() => {});

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Heartbeat Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
