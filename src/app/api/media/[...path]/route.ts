import { NextRequest, NextResponse } from 'next/server';

/**
 * LOCAL STORAGE DEPRECATED
 *
 * This route previously served files from local disk storage.
 * All media is now exclusively stored on Cloudflare R2 and served via:
 * - /api/media/r2/[...path] — for R2 file downloads
 * - /api/media/hls/[...path] — for HLS video streams
 * - Cloudflare Stream API — for video hosting
 *
 * Any requests to this endpoint indicate a misconfiguration or legacy code path.
 */

export async function GET(request: NextRequest) {
    return new NextResponse(
        JSON.stringify({
            error: 'Local storage is deprecated',
            message: 'All media is now stored exclusively on Cloudflare R2 and Stream',
            available_endpoints: [
                'GET /api/media/r2/[...path] — Download files from R2',
                'GET /api/media/hls/[...path] — Stream HLS video segments',
                'POST /api/media/presign — Get presigned URL for upload',
            ]
        }),
        {
            status: 501,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
