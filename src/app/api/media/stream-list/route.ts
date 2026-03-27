import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { listStreamVideos } from '@/lib/services/cloudflare-stream';

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || undefined;

        const videos = await listStreamVideos(limit, search);

        return NextResponse.json({ videos });
    } catch (err: any) {
        console.error('[Stream List Error]:', err);
        return NextResponse.json({ error: err?.message || 'Failed to list stream videos' }, { status: 500 });
    }
}
