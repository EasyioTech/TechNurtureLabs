import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { paymentPlans, promoCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { plan_id, promo_code_id } = await req.json();

        if (!plan_id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // Fetch plan
        const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, plan_id));
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        let finalAmount = Number(plan.price); // price in INR
        let discountAmount = 0;
        let promoData = null;

        // Apply promo code if provided
        if (promo_code_id) {
            const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, promo_code_id));
            if (promo && promo.is_active) {
                if (promo.discount_type === 'percentage') {
                    discountAmount = (finalAmount * Number(promo.discount_value)) / 100;
                } else {
                    discountAmount = Number(promo.discount_value);
                }
                discountAmount = Math.min(discountAmount, finalAmount);
                finalAmount = Math.max(0, finalAmount - discountAmount);
                promoData = {
                    code: promo.code,
                    discount_type: promo.discount_type,
                    discount_value: promo.discount_value,
                    discount_amount: discountAmount,
                };
            }
        }

        // Razorpay amount is in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(finalAmount * 100);

        // If the plan is free (100% discount), skip payment
        if (amountInPaise === 0) {
            return NextResponse.json({
                free: true,
                original_price: Number(plan.price),
                discount_amount: discountAmount,
                final_amount: 0,
                promo: promoData,
                plan: { id: plan.id, name: plan.name, currency: plan.currency },
            });
        }

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: plan.currency || 'INR',
            notes: {
                plan_id: plan.id,
                plan_name: plan.name,
                promo_code_id: promo_code_id || '',
            },
        });

        return NextResponse.json({
            free: false,
            order_id: order.id,
            amount: amountInPaise,
            currency: order.currency,
            original_price: Number(plan.price),
            discount_amount: discountAmount,
            final_amount: finalAmount,
            promo: promoData,
            plan: { id: plan.id, name: plan.name, currency: plan.currency },
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
