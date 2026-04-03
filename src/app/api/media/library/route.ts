import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { and, desc, eq, ilike, sql, or } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin'];
        if (!session || (!allowedRoles.includes(session.role as string) && !allowedRoles.includes(session.userType as string))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const folder = searchParams.get('folder');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '24');
        const offset = (page - 1) * limit;

        const filters: any[] = [];

        // CRITICAL: Only show cloud-based storage (R2)
        // Never show local/server-side storage in the media library UI
        // Note: Cloudflare Stream assets are managed via /api/media/stream-list
        filters.push(eq(mediaAssets.storage_type, 'r2'));

        if (type && ['video', 'image', 'document'].includes(type)) {
            filters.push(eq(mediaAssets.asset_type, type as any));
        }

        // Folder filtering: Match by folder prefix (e.g., "library" matches "library/images", "library/videos")
        if (folder && folder !== 'all') {
            // If folder is just "library", match any library/* assets
            // If folder is "courses", match courses/* assets, etc.
            const folderPrefix = folder.toLowerCase();
            filters.push(sql`LOWER(${mediaAssets.folder}) LIKE ${folderPrefix + '/%'} OR LOWER(${mediaAssets.folder}) = ${folderPrefix}`);
        }

        // Search: Require at least 2 characters before LIKE query
        if (search && search.trim().length >= 2) {
            filters.push(ilike(mediaAssets.original_name, `%${search.trim()}%`));
        }

        const whereClause = filters.length > 0 ? (filters.length > 1 ? and(...filters) : filters[0]) : filters[0];

        // Optimized: Fetch total count and assets in parallel
        const [assets, countResult] = await Promise.all([
            db.select().from(mediaAssets)
                .where(whereClause)
                .orderBy(desc(mediaAssets.created_at))
                .limit(limit)
                .offset(offset),
            db.select({ count: sql<number>`count(*)` }).from(mediaAssets).where(whereClause)
        ]);

        const total = Number(countResult[0]?.count || 0);
        const { computeMediaUrl } = await import('@/lib/media');

        // Map assets with computed URLs (no verification checks — they slow down pagination)
        const mapped = assets.map((asset) => ({
            ...asset,
            file_url: computeMediaUrl(asset)
        }));

        // CRITICAL: Disable all caching on media library endpoint
        // This ensures uploaded files appear immediately in the UI
        const response = NextResponse.json({
            assets: mapped,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });

        // Force fresh data on every request
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('X-Data-Freshness', new Date().toISOString());

        return response;
    } catch (error) {
        console.error('[Media Library] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
    }
}
