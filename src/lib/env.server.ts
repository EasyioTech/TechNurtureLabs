import { z } from 'zod';

const serverSchema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(32, { message: "JWT_SECRET must be at least 32 characters long" }),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional().default(''),
    CLOUDFLARE_ACCESS_KEY_ID: z.string().optional().default(''),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional().default(''),
    CLOUDFLARE_BUCKET_NAME: z.string().optional().default(''),
    CLOUDFLARE_PUBLIC_DOMAIN: z.string().optional().default(''),
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
    console.error("❌ Invalid environment variables:\n", _serverEnv.error.format());
    throw new Error("Invalid or missing environment variables configuration");
}

export const serverEnv = _serverEnv.data;
