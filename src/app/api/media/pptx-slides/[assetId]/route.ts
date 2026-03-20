import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/media/pptx-slides/[assetId]
 *
 * Returns the slide data for a PPTX asset.
 * Since server-side PPTX conversion has been removed, this endpoint
 * returns a message directing users to use Google Slides or Office Online.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await verifySession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { assetId } = await params;

    const asset = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, assetId),
    });

    if (!asset) return NextResponse.json({ status: 'error', error: 'Asset not found' }, { status: 404 });

    // Server-side PPTX conversion is no longer available.
    // Return the file URL so the viewer can offer a download link.
    return NextResponse.json({
        status: 'completed',
        slides: [],
        total: 0,
        downloadUrl: asset.file_path ? `/api/media/r2/${asset.file_path}` : null,
        message: 'PPTX slide conversion is no longer handled server-side. Please download and view the file directly.',
    });
}
