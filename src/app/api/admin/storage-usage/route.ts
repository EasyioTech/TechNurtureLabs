import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scanR2 = request.nextUrl.searchParams.get('scanR2') === 'true';

        // ─── DB Media Assets ──────────────────────────────────────────
        // Group by storage_type + asset_type for complete breakdown
        const rows = await db
            .select({
                storage_type: mediaAssets.storage_type,
                asset_type: mediaAssets.asset_type,
                count: sql<number>`cast(count(*) as integer)`,
                totalBytes: sql<number>`cast(coalesce(sum(${mediaAssets.file_size}), 0) as bigint)`,
            })
            .from(mediaAssets)
            .groupBy(mediaAssets.storage_type, mediaAssets.asset_type);

        const dbResult = {
            mediaAssets: rows.map(r => ({
                storage_type: r.storage_type,
                asset_type: r.asset_type,
                count: Number(r.count),
                totalBytes: Number(r.totalBytes) || 0,
            })),
            totalBytes: rows.reduce((s, r) => s + (Number(r.totalBytes) || 0), 0),
        };

        // ─── R2 Bucket Scan ───────────────────────────────────────────
        // Only run if ?scanR2=true (expensive paginator)
        const prefixes = ['images', 'videos', 'documents'] as const;
        type FolderKey = typeof prefixes[number];
        const byFolder = {
            images: { bytes: 0, count: 0 },
            videos: { bytes: 0, count: 0 },
            documents: { bytes: 0, count: 0 },
        } as Record<FolderKey, { bytes: number; count: number }>;
        let r2TotalBytes = 0;
        let r2ObjectCount = 0;

        if (scanR2 && isCloudflareConfigured && s3Client) {
            for (const prefix of prefixes) {
                let continuationToken: string | undefined;
                let pageCount = 0;
                const MAX_PAGES = 100; // Cap at 10k objects per prefix

                do {
                    const command = new ListObjectsV2Command({
                        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                        Prefix: `${prefix}/`,
                        MaxKeys: 100,
                        ContinuationToken: continuationToken,
                    });

                    const response = await s3Client.send(command);

                    if (response.Contents) {
                        for (const obj of response.Contents) {
                            const size = obj.Size ?? 0;
                            byFolder[prefix].bytes += size;
                            byFolder[prefix].count += 1;
                            r2TotalBytes += size;
                            r2ObjectCount += 1;
                        }
                    }

                    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
                    pageCount++;
                } while (continuationToken && pageCount < MAX_PAGES);
            }
        }

        return NextResponse.json({
            r2: {
                configured: isCloudflareConfigured,
                totalBytes: r2TotalBytes,
                objectCount: r2ObjectCount,
                byFolder,
                scanned: scanR2,
                scannedAt: new Date().toISOString(),
            },
            db: dbResult,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || 'Failed to fetch storage usage' },
            { status: 500 }
        );
    }
}
