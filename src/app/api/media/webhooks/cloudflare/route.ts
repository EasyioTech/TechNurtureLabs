import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';

/**
 * CLOUDFLARE STREAM WEBHOOK HANDLER
 * 
 * DESIGN PRINCIPLES:
 * 1. Event-Driven: Replaces expensive polling with immediate completion notification.
 * 2. Status Synchronization: Ensures the backend knows exactly when a video is ready.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { status, uid, metadata } = body;

    console.log(`[CF Webhook] Event received for ${uid}:`, status.state);

    // SECURITY: In production, verify the CF webhook secret if configured
    // const signature = req.headers.get('webhook-signature');
    // if (!verifySignature(signature)) return new NextResponse('Forbidden', { status: 403 });

    if (status.state === 'ready') {
        console.log(`[CF Webhook] Video ${uid} is READY TO STREAM`);
        // Here you would typically update the DB:
        // await db.update(lessons).set({ status: 'READY' }).where(eq(lessons.videoUid, uid));
    }

    if (status.state === 'error') {
        console.error(`[CF Webhook] Video ${uid} failed ingest:`, status.errorReasonText);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CF Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
