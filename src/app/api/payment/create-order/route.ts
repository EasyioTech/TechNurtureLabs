import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { paymentPlans, promoCodes } from '@/db/schema';
import { eq, and, isNull, lte, gte, or, sql } from 'drizzle-orm';
import { rateLimitService } from '@/lib/services/rate-limit';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';

const createOrderSchema = z.object({
    plan_id: z.string().uuid('Invalid plan ID'),
    promo_code_id: z.string()
        .optional()
        .nullable()
        .transform(val => (val === '' ? null : val))
        .pipe(z.string().uuid('Invalid promo code ID').nullable()),
});

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const razorpay = (!isBuild && serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export async function POST(req: NextRequest) {
    try {
        // Rate-limit by IP — this endpoint is used during registration (pre-auth) and in-portal
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed } = await rateLimitService.check({
            key: `payment-create:${ip}`,
            limit: 20,
            windowSeconds: 900
        });
        if (!allowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = createOrderSchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json({ error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { plan_id, promo_code_id } = body.data;

        // Fetch plan
        const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, plan_id));
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        let finalAmount = Number(plan.price); // price in INR
        let discountAmount = 0;
        let promoData = null;

        // Apply promo code if provided — uses an atomic UPDATE to check + increment
        // in a single DB round-trip, preventing concurrent over-use.
        if (promo_code_id) {
            const now = new Date();

            // Atomic: only increment if the code is valid right now.
            // Returns the updated row if successful, empty array if constraints failed.
            const [updatedPromo] = await db
                .update(promoCodes)
                .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
                .where(
                    and(
                        eq(promoCodes.id, promo_code_id),
                        eq(promoCodes.is_active, true),
                        // max_uses IS NULL means unlimited; otherwise must have capacity
                        or(
                            isNull(promoCodes.max_uses),
                            sql`${promoCodes.current_uses} < ${promoCodes.max_uses}`
                        ),
                        // validity window: valid_from IS NULL or now >= valid_from
                        or(isNull(promoCodes.valid_from), lte(promoCodes.valid_from, now)),
                        // validity window: valid_until IS NULL or now <= valid_until
                        or(isNull(promoCodes.valid_until), gte(promoCodes.valid_until, now))
                    )
                )
                .returning();

            if (updatedPromo) {
                if (updatedPromo.discount_type === 'percentage') {
                    discountAmount = (finalAmount * Number(updatedPromo.discount_value)) / 100;
                } else {
                    discountAmount = Number(updatedPromo.discount_value);
                }
                discountAmount = Math.min(discountAmount, finalAmount);
                finalAmount = Math.max(0, finalAmount - discountAmount);
                promoData = {
                    code: updatedPromo.code,
                    discount_type: updatedPromo.discount_type,
                    discount_value: updatedPromo.discount_value,
                    discount_amount: discountAmount,
                };
            } else {
                // Code is invalid, expired, or exhausted — reject the request
                return NextResponse.json(
                    { error: 'Promo code is invalid, expired, or has reached its usage limit.' },
                    { status: 400 }
                );
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

        // Try to create Razorpay Order, fallback to SIMULATED for testing/preview if keys are missing
        try {
            if (!razorpay || !serverEnv.RAZORPAY_KEY_ID || serverEnv.RAZORPAY_KEY_ID === 'rzp_test_yourkeyhere') {
                throw new Error('CONFIG_MISSING');
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
        } catch (rpError: any) {
            console.warn('Razorpay creation failed, falling back to simulated order for preview:', rpError.message);

            // Return a mock order structure so the UI can proceed in "Preview Mode"
            return NextResponse.json({
                free: false,
                order_id: `order_PREVIEW_${Math.random().toString(36).slice(2, 10)}`,
                amount: amountInPaise,
                currency: plan.currency || 'INR',
                original_price: Number(plan.price),
                discount_amount: discountAmount,
                final_amount: finalAmount,
                promo: promoData,
                plan: { id: plan.id, name: plan.name, currency: plan.currency },
                previewMode: true
            });
        }
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
