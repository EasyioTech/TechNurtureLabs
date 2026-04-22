import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * CLOUDFLARE STREAM WEBHOOK HANDLER
 *
 * Handles encoding completion/failure notifications from Cloudflare Stream.
 *
 * DESIGN PRINCIPLES:
 * 1. Secure: Validates webhook signature using HMAC-SHA256 constant-time comparison
 * 2. Real-time DB updates: Marks media_assets as completed/failed
 * 3. Cache invalidation: Busts Redis cache for fresh data on next poll
 *
 * CRITICAL FIXES:
 * 1. Uses HMAC-SHA256 signature verification (was plain string equality)
 * 2. Updates media_assets.processing_status on ready/error (was never persisted)
 * 3. Stores error message for user display
 */

function verifyCloudflareWebhook(
    signature: string | null,
    rawBody: string,
    secret: string | undefined
): boolean {
    if (!secret || !signature) {
        // If no secret configured, skip verification (dev mode)
        return !secret;
    }

    try {
        // Cloudflare format: "ts=1234567890,sig1=hex..."
        const parts = Object.fromEntries(
            signature.split(',').map(p => {
                const [k, v] = p.split('=');
                return [k.trim(), v.trim()];
            })
        );

        const ts = parts['ts'];
        const sig = parts['sig1'];

        if (!ts || !sig) {
            console.warn('[CF Webhook] Missing ts or sig in signature header');
            return false;
        }

        // Reconstruct message that was signed
        const source = ts + rawBody;

        // Compute HMAC-SHA256
        const computed = crypto
            .createHmac('sha256', secret)
            .update(source)
            .digest('hex');

        // Constant-time comparison to prevent timing attacks
        const sigBuffer = Buffer.from(sig, 'hex');
        const computedBuffer = Buffer.from(computed, 'hex');

        if (sigBuffer.length !== computedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(sigBuffer, computedBuffer);
    } catch (err) {
        console.error('[CF Webhook] Signature verification error:', err);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Read raw body for signature verification BEFORE parsing JSON
        const rawBody = await req.text();

        // Verify webhook signature
        const signatureHeader = req.headers.get('webhook-signature');
        if (!verifyCloudflareWebhook(signatureHeader, rawBody, serverEnv.CLOUDFLARE_WEBHOOK_SECRET)) {
            console.error('[CF Webhook] Signature verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Now parse the body
        const body = JSON.parse(rawBody);
        const { status, uid, metadata } = body;

        if (!uid || !status || !status.state) {
            console.warn('[CF Webhook] Missing required fields:', { uid, status });
            return NextResponse.json({ error: 'Bad request' }, { status: 400 });
        }

        console.log(`[CF Webhook] Event received for ${uid}:`, status.state);

        const cacheKey = `cf-stream:${uid}`;

        if (status.state === 'ready') {
            console.log(`[CF Webhook] ✓ Video ${uid} READY TO STREAM`);

            try {
                // Update media_assets record to mark as completed
                await db
                    .update(mediaAssets)
                    .set({
                        processing_status: 'completed',
                        metadata: {
                            duration: metadata?.duration,
                            thumbnail: metadata?.thumbnail,
                            readyToStream: true,
                            completedAt: new Date().toISOString(),
                        },
                        updated_at: new Date(),
                    })
                    .where(eq(mediaAssets.file_path, uid));

                console.log(`[CF Webhook] ✓ Updated media_assets for ${uid}`);
            } catch (dbErr) {
                console.error('[CF Webhook] Failed to update media_assets:', dbErr);
                // Don't fail the webhook response — CF will retry if we return error
            }

            // Invalidate status cache so next poll fetches fresh Cloudflare data
            try {
                await redis.del(cacheKey);
            } catch (redisErr) {
                console.warn('[CF Webhook] Failed to invalidate Redis cache:', redisErr);
            }
        }

        if (status.state === 'error') {
            console.error(`[CF Webhook] ✗ Video ${uid} failed:`, status.errorReasonText);

            try {
                // Update media_assets record to mark as failed
                await db
                    .update(mediaAssets)
                    .set({
                        processing_status: 'failed',
                        error_message: status.errorReasonText || `Error code: ${status.errorReasonCode}` || 'Encoding failed',
                        metadata: {
                            errorCode: status.errorReasonCode,
                            errorText: status.errorReasonText,
                            failedAt: new Date().toISOString(),
                        },
                        updated_at: new Date(),
                    })
                    .where(eq(mediaAssets.file_path, uid));

                console.log(`[CF Webhook] ✓ Marked ${uid} as failed in media_assets`);
            } catch (dbErr) {
                console.error('[CF Webhook] Failed to update media_assets on error:', dbErr);
            }

            // Invalidate cache on error too
            try {
                await redis.del(cacheKey);
            } catch (redisErr) {
                console.warn('[CF Webhook] Failed to invalidate Redis cache:', redisErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[CF Webhook Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
