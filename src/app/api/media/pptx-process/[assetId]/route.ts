import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

/**
 * POST /api/media/pptx-process/[assetId]
 *
 * Previously triggered server-side PPTX conversion.
 * Server-side conversion has been removed — PPT files are now served
 * as download links or embedded via external viewers.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await verifySession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    return NextResponse.json({
        status: 'unsupported',
        message: 'Server-side PPTX conversion is no longer available. Please use the download link to view the file.',
    });
}
