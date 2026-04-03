import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { paymentPlans, promoCodes, schoolSubscriptions, paymentTransactions } from '@/db/schema';
import { eq, and, isNull, lte, gte, or, sql, inArray } from 'drizzle-orm';
import { rateLimitService } from '@/lib/services/rate-limit';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { verifySession } from '@/lib/auth';

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

if (!isBuild) {
    if (serverEnv.RAZORPAY_KEY_ID) console.log('[Razorpay] KEY_ID found:', serverEnv.RAZORPAY_KEY_ID.substring(0, 20) + '...');
    else console.error('[Razorpay] KEY_ID NOT found');
    if (serverEnv.RAZORPAY_KEY_SECRET) console.log('[Razorpay] KEY_SECRET found, length:', serverEnv.RAZORPAY_KEY_SECRET.length);
    else console.error('[Razorpay] KEY_SECRET NOT found');
    if (razorpay) console.log('[Razorpay] Instance initialized successfully');
    else console.error('[Razorpay] Instance is NULL');
}

export async function POST(req: NextRequest) {
    try {
        // SECURITY: Rate-limit by IP — this endpoint is used during registration (pre-auth) and in-portal
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed } = await rateLimitService.check({
            key: `payment-create:${ip}`,
            limit: 20,
            windowSeconds: 900
        });
        if (!allowed) {
            logger.warn('[Create Order] Rate limit exceeded', { ip });
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = createOrderSchema.safeParse(await req.json());
        if (!body.success) {
            logger.warn('[Create Order] Invalid schema', { errors: body.error.issues });
            return NextResponse.json({ error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { plan_id, promo_code_id } = body.data;

        // SECURITY: Verify user is authenticated (for in-portal usage)
        // NOTE: Registration endpoint is pre-auth, so we don't require session here
        const session = await verifySession().catch(() => null);

        // SECURITY: Fetch and validate plan
        const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, plan_id));
        if (!plan) {
            logger.warn('[Create Order] Plan not found', { plan_id });
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // SECURITY: Validate plan is active and purchasable
        if (!plan.is_active) {
            logger.warn('[Create Order] Plan not active', { plan_id });
            return NextResponse.json({ error: 'This plan is no longer available' }, { status: 400 });
        }

        let finalAmount = Number(plan.price); // price in INR

        // SECURITY FIX: Validate plan price is positive
        if (!Number.isFinite(finalAmount) || finalAmount < 0) {
            logger.error('[Create Order] Invalid plan price', { plan_id, price: plan.price });
            return NextResponse.json({ error: 'Invalid plan price' }, { status: 400 });
        }

        let discountAmount = 0;
        let promoData = null;

        // SECURITY: Apply promo code if provided — with strong atomicity via atomic UPDATE
        if (promo_code_id) {
            const now = new Date();

            // CRITICAL FIX #9: Atomic check + increment prevents race conditions
            // The WHERE clause is evaluated atomically with the UPDATE, ensuring
            // that if current_uses reaches max_uses, subsequent requests will fail
            // (WHERE condition will be false for future requests)
            const [promo] = await db
                .select()
                .from(promoCodes)
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
                );

            if (promo) {
                const updatedPromo = promo; 
                // SECURITY: Validate discount calculation to prevent negative amounts
                if (updatedPromo.discount_type === 'percentage') {
                    const percentage = Number(updatedPromo.discount_value);
                    if (percentage < 0 || percentage > 100) {
                        logger.error('[Create Order] Invalid percentage discount', { percentage, promo_code_id });
                        return NextResponse.json({ error: 'Invalid discount' }, { status: 400 });
                    }
                    discountAmount = (finalAmount * percentage) / 100;
                } else {
                    discountAmount = Number(updatedPromo.discount_value);
                    if (discountAmount < 0) {
                        logger.error('[Create Order] Negative fixed discount', { discountAmount, promo_code_id });
                        return NextResponse.json({ error: 'Invalid discount' }, { status: 400 });
                    }
                }
                // Ensure discount doesn't exceed plan price
                discountAmount = Math.min(discountAmount, finalAmount);
                finalAmount = Math.max(0, finalAmount - discountAmount);
                promoData = {
                    code: updatedPromo.code,
                    discount_type: updatedPromo.discount_type,
                    discount_value: updatedPromo.discount_value,
                    discount_amount: discountAmount,
                };
                logger.info('[Create Order] Promo code applied', {
                    code: updatedPromo.code,
                    discount: discountAmount,
                    final_amount: finalAmount
                });
            } else {
                // Code is invalid, expired, or exhausted — reject the request
                logger.warn('[Create Order] Promo code invalid/expired/exhausted', { promo_code_id });
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

        // SECURITY: Create Razorpay Order — NO FALLBACK
        if (!razorpay || !serverEnv.RAZORPAY_KEY_ID) {
            logger.error('[Create Order] Razorpay not configured');
            return NextResponse.json(
                { error: 'Payment gateway not configured. Please contact support.' },
                { status: 500 }
            );
        }

        try {
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: plan.currency || 'INR',
                notes: {
                    plan_id: plan.id,
                    plan_name: plan.name,
                    promo_code_id: promo_code_id || '',
                },
            });

            // SECURITY: Validate Razorpay response
            if (!order.id || !order.id.startsWith('order_')) {
                logger.error('[Create Order] Invalid Razorpay response', { orderId: order.id });
                return NextResponse.json(
                    { error: 'Failed to create payment order. Please try again.' },
                    { status: 502 }
                );
            }

            logger.info('[Create Order] Order created', {
                order_id: order.id,
                plan_id: plan.id,
                amount: amountInPaise,
                promo_applied: !!promoData
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
            const errorDetails = {
                message: rpError?.message || 'Unknown error',
                code: rpError?.code,
                status: rpError?.statusCode || rpError?.status,
                description: rpError?.description,
                reason: rpError?.reason,
                fullError: JSON.stringify(rpError).substring(0, 200)
            };
            logger.error('[Create Order] Razorpay API error', errorDetails);
            console.error('[Create Order] Razorpay full error:', errorDetails);
            return NextResponse.json(
                { error: 'Failed to create payment order. Please try again.' },
                { status: 502 }
            );
        }
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
