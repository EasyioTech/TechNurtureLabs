import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin', 'school_admin', 'admin'];
        const isAuthorized = session && (
            allowedRoles.includes(session.role as string) ||
            allowedRoles.includes(session.userType as string)
        );

        if (!isAuthorized) {
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
        if (search) {
            filters.push(ilike(mediaAssets.original_name, `%${search}%`));
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

        return NextResponse.json({
            assets: mapped,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('[Media Library] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
    }
}
