import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

/**
 * Media Audit API: Find orphaned/missing assets
 * Scans DB for assets where files are missing in R2.
 * Used for cleanup and debugging 404 issues.
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        if (!isCloudflareConfigured || !s3Client) {
            return NextResponse.json({
                error: 'R2 not configured',
                code: 'R2_NOT_CONFIGURED'
            }, { status: 503 });
        }

        const searchParams = req.nextUrl.searchParams;
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Fetch recent assets
        const assets = await db.query.mediaAssets.findMany({
            limit: limit + 1,
            offset,
            orderBy: (assets, { desc }) => [desc(assets.created_at)]
        });

        const results = {
            checked: 0,
            missing: [] as any[],
            errors: [] as any[],
            healthy: 0
        };

        for (const asset of assets.slice(0, limit)) {
            results.checked++;

            try {
                const headCmd = new HeadObjectCommand({
                    Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                    Key: asset.file_path,
                });
                await s3Client.send(headCmd);
                results.healthy++;
            } catch (err: any) {
                const status = err?.$metadata?.httpStatusCode;
                if (status === 404 || err.name === 'NoSuchKey') {
                    results.missing.push({
                        assetId: asset.id,
                        fileName: asset.file_name,
                        originalName: asset.original_name,
                        filePath: asset.file_path,
                        createdAt: asset.created_at,
                        uploadedBy: asset.uploaded_by,
                        mimeType: asset.mime_type
                    });
                } else {
                    results.errors.push({
                        assetId: asset.id,
                        fileName: asset.file_name,
                        error: err?.message || String(err),
                        status
                    });
                }
            }
        }

        return NextResponse.json({
            ...results,
            pagination: {
                limit,
                offset,
                hasMore: assets.length > limit
            }
        });
    } catch (error: any) {
        console.error('[Media Audit Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: error.status || 500 }
        );
    }
}
