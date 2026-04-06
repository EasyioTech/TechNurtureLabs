import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { verifySession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createApiHandler, AppError } from '@/lib/core/api-handler';
import { paymentService } from '@/lib/services/payment-service';
import { rateLimitService } from '@/lib/services/rate-limit';

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

/**
 * TECH NURTURE — Payment Verification API (Refactored)
 * 
 * DESIGN:
 * - Uses Unified API Handler for tracing & error standardization.
 * - Logic is delegated to PaymentService which uses ATOMIC transactions.
 * - Multi-layered security: Signature -> Idempotency -> Amount Match -> School Match.
 */

export const POST = createApiHandler(
    {
        action: 'PAYMENT_VERIFICATION',
        bodySchema: verifySchema
    },
    async (req, { body }) => {
        // HIGH FIX #1: Rate limit payment verification to prevent brute-force attacks
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed } = await rateLimitService.check({
            key: `payment-verify:${ip}`,
            limit: 10,
            windowSeconds: 900 // 10 attempts per 15 minutes
        });
        if (!allowed) {
            throw new AppError('Too many verification attempts. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
        }

        // SECURITY: Auth proof
        const session = await verifySession();
        if (!session) throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);

        // DELEGATE: Business logic to service (atomic)
        const result = await paymentService.verifyPayment({
            ...body,
            userId: session.userId as string
        });

        logger.info('[Payment Verify API] Success', { result });

        return result;
    }
);
