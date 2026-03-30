import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { paymentTransactions, schoolSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';

const verifySchema = z.object({
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
    school_id: z.string().uuid('Invalid school ID').optional(),
});

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const razorpay = (!isBuild && serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export async function POST(req: NextRequest) {
    try {
        const body = verifySchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json({ success: false, error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, school_id } = body.data;

        // CRITICAL FIX #3: Check for preview/test orders
        const isPreviewOrder = razorpay_order_id.startsWith('order_PREVIEW_') || razorpay_order_id.startsWith('order_DEV_');
        if (isPreviewOrder) {
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ success: false, error: 'Invalid order in production' }, { status: 400 });
            }
            // In dev, allow preview orders to pass through
            return NextResponse.json({
                success: true,
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
            });
        }

        // CRITICAL FIX #3: Verify HMAC signature
        const secret = serverEnv.RAZORPAY_KEY_SECRET;
        const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(hmacPayload)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn(`[Payment Verify] Invalid signature: expected ${expectedSignature}, got ${razorpay_signature}`);
            return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
        }

        // CRITICAL FIX #3: Look up the transaction in OUR database
        // This is mandatory — we don't trust Razorpay payment IDs alone
        const transaction = await db.query.paymentTransactions.findFirst({
            where: eq(paymentTransactions.razorpay_order_id, razorpay_order_id)
        });

        if (!transaction) {
            console.warn(`[Payment Verify] Order not found in DB: ${razorpay_order_id}`);
            return NextResponse.json(
                { success: false, error: 'Order not found in system' },
                { status: 404 }
            );
        }

        // CRITICAL FIX #3: Verify school_id matches (prevent cross-school payment fraud)
        if (school_id && transaction.school_id !== school_id) {
            console.error(
                `[Payment Verify - FRAUD] School ID mismatch: order=${razorpay_order_id}, claimed_school=${school_id}, actual_school=${transaction.school_id}`
            );
            return NextResponse.json(
                { success: false, error: 'School ID mismatch' },
                { status: 403 }
            );
        }

        // CRITICAL FIX #3: Fetch payment details from Razorpay to verify it's actually captured
        if (razorpay) {
            try {
                const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

                // Payment must be captured (not just authorized)
                if (paymentDetails.status !== 'captured') {
                    console.warn(
                        `[Payment Verify] Payment status is ${paymentDetails.status}, not captured: ${razorpay_payment_id}`
                    );
                    return NextResponse.json(
                        { success: false, error: `Payment status is ${paymentDetails.status}, not captured` },
                        { status: 400 }
                    );
                }

                // CRITICAL FIX #3: Verify amount matches (prevent amount tampering)
                const expectedAmountPaise = Math.round(Number(transaction.amount) * 100);
                if (paymentDetails.amount !== expectedAmountPaise) {
                    console.error(
                        `[Payment Verify - FRAUD] Amount mismatch: order=${razorpay_order_id}, expected=${expectedAmountPaise}, got=${paymentDetails.amount}`
                    );
                    return NextResponse.json(
                        { success: false, error: 'Amount mismatch with payment gateway' },
                        { status: 400 }
                    );
                }
            } catch (rpError: any) {
                console.error('[Payment Verify] Razorpay fetch failed:', rpError.message);
                return NextResponse.json(
                    { success: false, error: 'Failed to verify with payment gateway' },
                    { status: 502 }
                );
            }
        }

        // CRITICAL FIX #3: Update transaction status to captured
        await db.update(paymentTransactions)
            .set({
                status: 'captured',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                updated_at: new Date()
            })
            .where(eq(paymentTransactions.id, transaction.id));

        // CRITICAL FIX #3: Activate the subscription
        // This is the missing piece that was causing subscriptions to never activate
        const trialDays = 30; // Or fetch from plan if needed
        await db.update(schoolSubscriptions)
            .set({
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + trialDays * 86400 * 1000),
                updated_at: new Date()
            })
            .where(eq(schoolSubscriptions.id, transaction.subscription_id));

        console.log(`[Payment Verify] ✓ Payment verified and subscription activated: ${razorpay_order_id}`);

        return NextResponse.json({
            success: true,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            subscription_id: transaction.subscription_id,
        });

    } catch (error: any) {
        console.error('[Payment Verify] Unexpected error:', error.message);
        return NextResponse.json(
            { success: false, error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
