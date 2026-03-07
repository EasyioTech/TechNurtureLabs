import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformSettings } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

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
        const { hero_video_type, hero_video_url, logo_url, platform_name } = body;

        // Ensure global settings row exists
        const existingInfo = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });

        if (existingInfo) {
            await db.update(platformSettings)
                .set({
                    hero_video_type,
                    hero_video_url,
                    logo_url,
                    platform_name,
                    updated_at: new Date()
                })
                .where(eq(platformSettings.id, 'global'));
        } else {
            await db.insert(platformSettings)
                .values({
                    id: 'global',
                    hero_video_type,
                    hero_video_url,
                    logo_url,
                    platform_name
                });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update platform settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
