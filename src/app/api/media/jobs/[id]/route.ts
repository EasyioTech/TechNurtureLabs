import { NextRequest, NextResponse } from 'next/server';
import { videoQueue } from '@/lib/queue/video-queue';
import { verifySession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;
    const job = await videoQueue.getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    const result = job.returnvalue;

    return NextResponse.json({
      id: job.id,
      state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
      progress: job.progress,
      result: result || null,
      failedReason: job.failedReason || null,
    });
  } catch (error: any) {
    console.error('[Job Status API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
