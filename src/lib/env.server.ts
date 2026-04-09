// NOTE: 'server-only' removed to allow usage in worker scripts
// Workers are Node.js processes that need environment access
import { z } from 'zod';

const serverSchema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional().or(z.literal('')).default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(32, { message: "JWT_SECRET must be at least 32 characters long" }),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // AES-256-GCM key for encrypting TOTP secrets at rest.
    // Must be exactly 32 bytes when decoded from hex (= 64 hex chars).
    // Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    APP_ENCRYPTION_KEY: z.string().min(64).optional().default(''),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional().default(''),
    CLOUDFLARE_ACCESS_KEY_ID: z.string().optional().default(''),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional().default(''),
    CLOUDFLARE_BUCKET_NAME: z.string().optional().default(''),
    CLOUDFLARE_PUBLIC_DOMAIN: z.string().optional().default(''),
    CLOUDFLARE_STREAM_API_TOKEN: z.string().optional().default(''),
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default(''),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
    CRON_SECRET: z.string().optional().default(''),
});

let _serverEnv = serverSchema.safeParse(process.env);

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NODE_ENV === 'test';

if (!_serverEnv.success) {
    if (isBuild) {
        console.warn("⚠️ Build time environment variable validation skipped.");
        // Use process.env but cast to the inferred type to avoid compiler errors downstream
        _serverEnv = { success: true, data: process.env as any, error: undefined as any };
    } else {
        console.error("❌ Invalid environment variables:\n", _serverEnv.error.format());
        throw new Error("Invalid or missing environment variables configuration");
    }
}

export const serverEnv = _serverEnv.data;
