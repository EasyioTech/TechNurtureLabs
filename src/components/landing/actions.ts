'use server';

import { db } from '@/lib/db';
import { paymentPlans, platformSettings } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';

const getCachedPlatformSettings = unstable_cache(
    async () => {
        return await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });
    },
    ['platform-settings'],
    { tags: ['platform-settings'] }
);

export async function getPublicPricingPlans() {
    if (isBuild) return [];
    try {
        const plans = await db.query.paymentPlans.findMany({
            where: eq(paymentPlans.is_active, true),
            orderBy: (paymentPlans, { asc }) => [asc(paymentPlans.price)]
        });

        return (plans || []).map(p => ({
            ...p,
            price: Number(p.price || 0),
            features: Array.isArray(p.features) ? p.features : (typeof p.features === 'object' && p.features ? Object.values(p.features as Record<string, string>) : []),
        }));
    } catch (error) {
        console.error('Error fetching public pricing plans:', error);
        return [];
    }
}
export async function getPlatformSettings() {
    const defaultSettings = {
        id: 'global',
        platform_name: 'TechNurture',
        logo_url: null,
        favicon_url: null,
        logo_layout: 'landscape',
        show_platform_name: true,
        logo_height: 32,
        hero_video_url: null,
        created_at: new Date(),
        updated_at: new Date()
    };

    if (isBuild) {
        try {
            const settings = await db.query.platformSettings.findFirst({
                where: eq(platformSettings.id, 'global')
            });
            return settings || defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }
    
    const cached = await getCachedPlatformSettings();
    if (cached) return cached;

    // Fallback to direct DB if cache is empty
    try {
        return await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        }) || defaultSettings;
    } catch (e) {
        return defaultSettings;
    }
}
