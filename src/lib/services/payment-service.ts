import { db } from '@/lib/db';
import { paymentTransactions, schoolSubscriptions, auditLogs, schoolAdmins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/core/api-handler';

/**
 * Initialize Razorpay carefully to avoid build-time crashes
 */
const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const razorpay = (!isBuild && serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export interface PaymentVerifyParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    school_id: string;
    userId: string;
}

export const paymentService = {
    /**
     * VERIFY PAYMENT & ACTIVATE SUBSCRIPTION (Atomic)
     * 
     * Ensures that partial failures (e.g. payment updated but sub not activated)
     * are impossible via a single DB transaction.
     */
    async verifyPayment(params: PaymentVerifyParams) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, school_id, userId } = params;

        // 1. Signature Verification (HMAC-SHA256)
        const secret = serverEnv.RAZORPAY_KEY_SECRET;
        if (!secret) throw new AppError('Payment gateway not configured', 'CONFIG_ERROR', 500);

        const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(hmacPayload)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
             logger.error('[PaymentService] FRAUD: Signature mismatch', { razorpay_order_id, userId });
             throw new AppError('Invalid payment signature', 'PAYMENT_VERIFICATION_FAILED', 400);
        }

        // 2. Fetch External Payment Status (Double Check)
        if (!razorpay) throw new AppError('Razorpay not initialized', 'GATEWAY_ERROR', 500);
        
        let paymentDetails: any;
        try {
            paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (err: any) {
            logger.error('[PaymentService] Razorpay fetch failure', { razorpay_payment_id, err: err.message });
            throw new AppError('Failed to verify with payment gateway', 'GATEWAY_CONNECTION_ERROR', 502);
        }

        if (paymentDetails.status !== 'captured' || paymentDetails.order_id !== razorpay_order_id) {
            logger.warn('[PaymentService] Invalid payment status', { status: paymentDetails.status, orderId: paymentDetails.order_id });
            throw new AppError('Payment not captured or order mismatch', 'PAYMENT_STATE_INVALID', 400);
        }

        // 3. ATOMIC STATE TRANSITION
        return await db.transaction(async (tx) => {
            // A. SECURITY: Verify user's school ownership (prevent cross-school payment IDOR)
            const admin = await tx.query.schoolAdmins.findFirst({
                where: eq(schoolAdmins.id, userId),
                columns: { school_id: true }
            });

            if (!admin || admin.school_id !== school_id) {
                logger.error('[PaymentService] IDOR: User attempted to verify payment for different school', {
                    userId,
                    requestedSchool: school_id,
                    userSchool: admin?.school_id
                });
                throw new AppError('Forbidden — this school is not authorized', 'FORBIDDEN', 403);
            }

            // B. Find the local transaction record
            const transaction = await tx.query.paymentTransactions.findFirst({
                where: and(
                    eq(paymentTransactions.razorpay_order_id, razorpay_order_id),
                    eq(paymentTransactions.school_id, school_id)
                )
            });

            if (!transaction) {
                throw new AppError('Order not found', 'NOT_FOUND', 404);
            }

            // C. IDEMPOTENCY: Check if already processed
            if (transaction.status === 'captured') {
                logger.info('[PaymentService] Idempotent hit: Already captured', { razorpay_order_id });
                return { subscriptionId: transaction.subscription_id, alreadyProcessed: true };
            }

            // D. SECURITY: Amount Verification
            const expectedAmountPaise = Math.round(Number(transaction.amount) * 100);
            if (paymentDetails.amount !== expectedAmountPaise) {
                logger.error('[PaymentService] FRAUD: Amount mismatch', { expected: expectedAmountPaise, received: paymentDetails.amount });
                
                await tx.insert(auditLogs).values({
                    school_id,
                    user_id: userId,
                    action: 'payment',
                    entity_type: 'payment_fraud',
                    metadata: { orderId: razorpay_order_id, reason: 'amount_mismatch', expected: expectedAmountPaise, received: paymentDetails.amount }
                });

                throw new AppError('Payment amount mismatch', 'FRAUD_DETECTED', 400);
            }

            // E. UPDATE TRANSACTION
            await tx.update(paymentTransactions)
                .set({
                    status: 'captured',
                    razorpay_payment_id,
                    razorpay_signature,
                    gateway_response: paymentDetails,
                    updated_at: new Date()
                })
                .where(eq(paymentTransactions.id, transaction.id));

            // F. ACTIVATE SUBSCRIPTION
            const subscription = await tx.query.schoolSubscriptions.findFirst({
                where: eq(schoolSubscriptions.id, transaction.subscription_id),
                with: { plan: true }
            });

            if (!subscription) throw new AppError('Subscription not found', 'NOT_FOUND', 404);

            const now = new Date();
            const billingCycle = subscription.plan?.billing_cycle || 'annual';
            let periodEnd = new Date(now);
            if (billingCycle === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
            else if (billingCycle === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
            else if (billingCycle === 'semi_annual') periodEnd.setMonth(periodEnd.getMonth() + 6);
            else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

            await tx.update(schoolSubscriptions)
                .set({
                    status: 'active',
                    current_period_start: now,
                    current_period_end: periodEnd,
                    updated_at: now
                })
                .where(eq(schoolSubscriptions.id, subscription.id));

            // G. AUDIT LOG
            await tx.insert(auditLogs).values({
                school_id,
                user_id: userId,
                action: 'payment',
                entity_type: 'payment_transaction',
                entity_id: transaction.id,
                metadata: { orderId: razorpay_order_id, amount: transaction.amount, status: 'captured' }
            });

            logger.info('[PaymentService] Transaction & Subscription updated successfully', { razorpay_order_id });

            return { subscriptionId: transaction.subscription_id, alreadyProcessed: false };
        });
    }
};
