import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformSettings } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const settings = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });

        return NextResponse.json({ settings: settings || {} });
    } catch (error) {
        console.error('Failed to fetch platform settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            hero_video_type,
            hero_video_url,
            show_hero_video,
            logo_url,
            favicon_url,
            platform_name,
            logo_layout,
            show_platform_name,
            logo_height
        } = body;

        // Ensure global settings row exists
        const existingInfo = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });

        // If logo/favicon URL is cleared, also wipe the stored DB data
        const clearLogoData = !logo_url ? { logo_data: null } : {};
        const clearFaviconData = !favicon_url ? { favicon_data: null } : {};

        if (existingInfo) {
            await db.update(platformSettings)
                .set({
                    hero_video_type,
                    hero_video_url,
                    show_hero_video,
                    logo_url: logo_url || null,
                    favicon_url: favicon_url || null,
                    platform_name,
                    logo_layout,
                    show_platform_name,
                    logo_height,
                    ...clearLogoData,
                    ...clearFaviconData,
                    updated_at: new Date()
                })
                .where(eq(platformSettings.id, 'global'));
        } else {
            await db.insert(platformSettings)
                .values({
                    id: 'global',
                    hero_video_type,
                    hero_video_url,
                    show_hero_video,
                    logo_url: logo_url || null,
                    favicon_url: favicon_url || null,
                    platform_name,
                    logo_layout,
                    show_platform_name,
                    logo_height
                });
        }

        revalidateTag('platform-settings');
        revalidatePath('/', 'layout');
        revalidatePath('/admin-portal', 'layout');
        revalidatePath('/school-portal', 'layout');
        revalidatePath('/admin', 'layout');
        revalidatePath('/school-admin', 'layout');
        revalidatePath('/student', 'layout');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update platform settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
