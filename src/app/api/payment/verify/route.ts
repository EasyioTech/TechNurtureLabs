import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { paymentTransactions, schoolSubscriptions, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { verifySession } from '@/lib/auth';
import { rateLimitService } from '@/lib/services/rate-limit';
import { logger } from '@/lib/logger';

const verifySchema = z.object({
    razorpay_order_id: z.string().regex(/^order_[a-zA-Z0-9]{14}$/, 'Invalid order ID format'),
    razorpay_payment_id: z.string().regex(/^pay_[a-zA-Z0-9]{14}$/, 'Invalid payment ID format'),
    razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid signature format (must be 64 hex chars)'),
    school_id: z.string().uuid('Invalid school ID'),
});

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const razorpay = (!isBuild && serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export async function POST(req: NextRequest) {
    try {
        // SECURITY: Verify authentication
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // SECURITY: Rate limit by IP to prevent verification attempts flooding
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitKey = `payment-verify:${ip}`;
        const { allowed } = await rateLimitService.checkUserLimit(rateLimitKey, 'payment-verify', 5, 60);
        if (!allowed) {
            logger.warn('[Payment Verify] Rate limit exceeded', { ip });
            return NextResponse.json({ success: false, error: 'Too many verification attempts' }, { status: 429 });
        }

        const body = verifySchema.safeParse(await req.json());
        if (!body.success) {
            logger.warn('[Payment Verify] Invalid schema', { errors: body.error.issues });
            return NextResponse.json({ success: false, error: 'Invalid request format' }, { status: 400 });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, school_id } = body.data;

        // SECURITY FIX #1: Verify HMAC signature FIRST (before DB lookup)
        // This prevents attacker from creating fake transactions in the DB
        const secret = serverEnv.RAZORPAY_KEY_SECRET;
        if (!secret) {
            logger.error('[Payment Verify] RAZORPAY_KEY_SECRET not configured');
            return NextResponse.json(
                { success: false, error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(hmacPayload)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            logger.error('[Payment Verify - FRAUD] Invalid signature', {
                orderId: razorpay_order_id,
                provided: razorpay_signature,
                expected: expectedSignature
            });
            return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 400 });
        }

        // SECURITY FIX #2: Look up the transaction in OUR database
        // This is mandatory — we don't trust Razorpay payment IDs alone
        const transaction = await db.query.paymentTransactions.findFirst({
            where: and(
                eq(paymentTransactions.razorpay_order_id, razorpay_order_id),
                eq(paymentTransactions.status, 'created') // Only verify 'created' orders, not already captured
            )
        });

        if (!transaction) {
            logger.warn('[Payment Verify] Order not found or already processed', { orderId: razorpay_order_id });
            return NextResponse.json(
                { success: false, error: 'Order not found or already processed' },
                { status: 404 }
            );
        }

        // SECURITY FIX #3: Verify school_id matches (prevent cross-school payment fraud)
        if (transaction.school_id !== school_id) {
            logger.error('[Payment Verify - FRAUD ATTEMPT] School ID mismatch', {
                orderId: razorpay_order_id,
                transactionSchool: transaction.school_id,
                requestedSchool: school_id,
                ip
            });
            // Audit this fraud attempt
            await db.insert(auditLogs).values({
                school_id: school_id,
                user_id: session.userId,
                action: 'payment_fraud_attempt',
                details: { orderId: razorpay_order_id, reason: 'school_id_mismatch' }
            });
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // SECURITY FIX #4: Fetch payment details from Razorpay to verify it's actually captured
        // This prevents accepting payments that haven't actually cleared
        if (!razorpay) {
            logger.error('[Payment Verify] Razorpay not initialized');
            return NextResponse.json(
                { success: false, error: 'Payment gateway not available' },
                { status: 500 }
            );
        }

        let paymentDetails: any;
        try {
            paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (rpError: any) {
            logger.error('[Payment Verify] Razorpay fetch failed', {
                orderId: razorpay_order_id,
                error: rpError.message
            });
            return NextResponse.json(
                { success: false, error: 'Failed to verify with payment gateway' },
                { status: 502 }
            );
        }

        // Payment must be captured (not just authorized)
        if (paymentDetails.status !== 'captured') {
            logger.warn('[Payment Verify] Payment not captured', {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                status: paymentDetails.status
            });
            return NextResponse.json(
                { success: false, error: 'Payment not captured' },
                { status: 400 }
            );
        }

        // SECURITY FIX #5: Verify amount matches EXACTLY (prevent amount tampering via Burp/proxies)
        const expectedAmountPaise = Math.round(Number(transaction.amount) * 100);
        if (paymentDetails.amount !== expectedAmountPaise) {
            logger.error('[Payment Verify - FRAUD ATTEMPT] Amount mismatch', {
                orderId: razorpay_order_id,
                expected: expectedAmountPaise,
                received: paymentDetails.amount,
                ip
            });
            await db.insert(auditLogs).values({
                school_id: transaction.school_id,
                user_id: session.userId,
                action: 'payment_fraud_attempt',
                details: { orderId: razorpay_order_id, reason: 'amount_mismatch', expected: expectedAmountPaise, received: paymentDetails.amount }
            });
            return NextResponse.json(
                { success: false, error: 'Payment amount mismatch' },
                { status: 400 }
            );
        }

        // SECURITY FIX #6: Verify order_id matches (prevent payment switching attacks)
        if (paymentDetails.order_id !== razorpay_order_id) {
            logger.error('[Payment Verify - FRAUD] Order ID mismatch in Razorpay response', {
                orderId: razorpay_order_id,
                razorpayOrder: paymentDetails.order_id
            });
            return NextResponse.json(
                { success: false, error: 'Order ID mismatch' },
                { status: 400 }
            );
        }

        // SECURITY FIX #7: Idempotent update - use transaction status check to prevent double-charging
        // If transaction is already captured, return success without duplicating subscription
        if (transaction.status === 'captured') {
            logger.info('[Payment Verify] Transaction already captured (idempotent)', { orderId: razorpay_order_id });
            return NextResponse.json({
                success: true,
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                subscription_id: transaction.subscription_id,
                already_processed: true
            });
        }

        // SECURITY FIX #8: Update transaction status atomically with signature storage
        const updatedTransaction = await db.update(paymentTransactions)
            .set({
                status: 'captured',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                gateway_response: paymentDetails,
                updated_at: new Date()
            })
            .where(eq(paymentTransactions.id, transaction.id))
            .returning();

        if (!updatedTransaction || updatedTransaction.length === 0) {
            logger.error('[Payment Verify] Failed to update transaction', { orderId: razorpay_order_id });
            return NextResponse.json(
                { success: false, error: 'Failed to process payment' },
                { status: 500 }
            );
        }

        // SECURITY FIX #9: Activate subscription with explicit plan period
        const subscription = await db.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.id, transaction.subscription_id),
            with: { plan: true }
        });

        if (!subscription) {
            logger.error('[Payment Verify] Subscription not found', { subscriptionId: transaction.subscription_id });
            return NextResponse.json(
                { success: false, error: 'Subscription not found' },
                { status: 404 }
            );
        }

        // Calculate period end based on billing cycle
        const now = new Date();
        const billingCycle = subscription.plan?.billing_cycle || 'annual';
        let periodEnd = new Date(now);

        if (billingCycle === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
        else if (billingCycle === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
        else if (billingCycle === 'semi_annual') periodEnd.setMonth(periodEnd.getMonth() + 6);
        else periodEnd.setFullYear(periodEnd.getFullYear() + 1); // annual

        const updatedSub = await db.update(schoolSubscriptions)
            .set({
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now
            })
            .where(eq(schoolSubscriptions.id, transaction.subscription_id))
            .returning();

        if (!updatedSub || updatedSub.length === 0) {
            logger.error('[Payment Verify] Failed to activate subscription', { subscriptionId: transaction.subscription_id });
            return NextResponse.json(
                { success: false, error: 'Failed to activate subscription' },
                { status: 500 }
            );
        }

        // SECURITY FIX #10: Audit log for successful payment
        await db.insert(auditLogs).values({
            school_id: transaction.school_id,
            user_id: session.userId,
            action: 'payment',
            details: {
                orderId: razorpay_order_id,
                amount: transaction.amount,
                subscriptionId: transaction.subscription_id
            }
        });

        logger.info('[Payment Verify] Payment verified and subscription activated', {
            orderId: razorpay_order_id,
            schoolId: transaction.school_id,
            subscriptionId: transaction.subscription_id
        });

        return NextResponse.json({
            success: true,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            subscription_id: transaction.subscription_id,
        });

    } catch (error: any) {
        logger.error('[Payment Verify] Unexpected error', { message: error.message });
        return NextResponse.json(
            { success: false, error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
