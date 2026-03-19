import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { z } from 'zod';

const verifySchema = z.object({
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
});

export async function POST(req: NextRequest) {
    try {
        const body = verifySchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json({ success: false, error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body.data;

        const secret = serverEnv.RAZORPAY_KEY_SECRET;
        const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(hmacPayload)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
        });
    } catch (error: any) {
        // Log critical payment failures to a proper aggregator or general structure without exposing stack traces blindly
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
    }
}
