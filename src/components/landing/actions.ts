'use server';

import { db } from '@/lib/db';
import { paymentPlans, platformSettings } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';

export async function getPublicPricingPlans() {
    if (isBuild) return [];
    const plans = await db.query.paymentPlans.findMany({
        where: eq(paymentPlans.is_active, true),
        orderBy: [asc(paymentPlans.price)]
    });

    return plans.map(p => ({
        ...p,
        price: Number(p.price),
        features: Array.isArray(p.features) ? p.features : (typeof p.features === 'object' && p.features ? Object.values(p.features as Record<string, string>) : []),
    }));
}
export async function getPlatformSettings() {
    if (isBuild) return {
        id: 'global',
        platform_name: 'TechNurture',
        logo_url: null,
        hero_video_url: null,
        created_at: new Date(),
        updated_at: new Date()
    };
    return await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'global')
    });
}
