import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
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
        if (type && ['video', 'image', 'document'].includes(type)) {
            filters.push(eq(mediaAssets.asset_type, type as any));
        }
        if (folder && folder !== 'all') {
            filters.push(eq(mediaAssets.folder, folder));
        }
        // Require at least 2 characters before issuing a LIKE query with a leading wildcard.
        // A single character (or empty string) forces Postgres to scan every row in the table.
        // The real long-term fix is the pg_trgm GIN index added in migration 0004 — once that
        // index is in place, even short trigram searches are fast.
        if (search && search.trim().length >= 2) {
            filters.push(ilike(mediaAssets.original_name, `%${search.trim()}%`));
        }

        const whereClause = filters.length > 0 ? (filters.length > 1 ? and(...filters) : filters[0]) : undefined;

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

        const mapped = assets.map(asset => ({
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
