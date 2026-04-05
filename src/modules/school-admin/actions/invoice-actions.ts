'use server';

import { db } from '@/lib/db';
import { schoolSubscriptions, paymentPlans, paymentTransactions, invoices, schools } from '@/db/schema';
import { eq, desc, and, asc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { verifySchoolAdminContext } from './shared';
import { invalidateSchoolCache } from './profile-actions';

export async function getSchoolInvoices(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    return await db.query.invoices.findMany({
        where: eq(invoices.school_id, schoolId),
        orderBy: [desc(invoices.created_at)],
        with: {
            transaction: true
        }
    });
}

export async function getAvailablePlans() {
    const session = await verifySession();
    if (!session) return [];
    return await db.query.paymentPlans.findMany({
        where: eq(paymentPlans.is_active, true),
        orderBy: [asc(paymentPlans.price)]
    });
}

export async function upgradeSchoolPlan(schoolId: string, planId: string) {
    try {
        await verifySchoolAdminContext(schoolId);

        const plan = await db.query.paymentPlans.findFirst({
            where: and(eq(paymentPlans.id, planId), eq(paymentPlans.is_active, true))
        });

        if (!plan) return { success: false, error: 'Invalid or inactive plan selected' };

        const school = await db.query.schools.findFirst({
            where: eq(schools.id, schoolId)
        });

        if (!school) return { success: false, error: 'School not found' };

        const now = new Date();
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + 1);

        const subId = await db.transaction(async (tx) => {
            // 1. Create/Update subscription
            const subs = await tx.select().from(schoolSubscriptions).where(eq(schoolSubscriptions.school_id, schoolId));
            let sId: string;

            if (subs.length > 0) {
                sId = subs[0].id;
                await tx.update(schoolSubscriptions).set({
                    plan_id: planId,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear,
                    auto_renew: true,
                    updated_at: now
                } as any).where(eq(schoolSubscriptions.id, sId));
            } else {
                const newSub = await tx.insert(schoolSubscriptions).values({
                    school_id: schoolId,
                    plan_id: planId,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear,
                    auto_renew: true,
                    created_at: now,
                    updated_at: now
                } as any).returning();
                sId = newSub[0].id;
            }

            // 2. Create Transaction record
            const trans = await tx.insert(paymentTransactions).values({
                school_id: schoolId,
                subscription_id: sId,
                amount: plan.price,
                currency: plan.currency,
                status: 'captured',
                created_at: now,
                updated_at: now
            } as any).returning();

            // 3. Generate Invoice
            const invoiceNum = `INV-${Date.now().toString().slice(-8)}`;
            await tx.insert(invoices).values({
                school_id: schoolId,
                subscription_id: sId,
                transaction_id: trans[0].id,
                invoice_number: invoiceNum,
                status: 'paid',
                subtotal: plan.price,
                total: plan.price,
                currency: plan.currency,
                issued_at: now.toISOString(),
                paid_at: now.toISOString(),
                billing_name: school.name,
                billing_address: `${school.city || ''}, ${school.state || ''}, ${school.country || 'IN'} - ${school.pincode || ''}`,
                created_at: now,
                updated_at: now
            } as any);

            return sId;
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/school-admin', 'layout');
        await invalidateSchoolCache(schoolId);
        
        return { success: true };
    } catch (err: any) {
        console.error('[Upgrade Plan Error]:', err);
        return { success: false, error: err.message || 'Operation failed' };
    }
}
