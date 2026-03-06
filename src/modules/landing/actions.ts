'use server';

import { db } from '@/lib/db';
import { paymentPlans } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getPublicPricingPlans() {
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
