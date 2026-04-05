import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { schoolAdmins } from '@/db/schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';
import { z } from 'zod';
import { analyticsService } from '@/lib/services/analytics-service';
import { createApiHandler, AppError } from '../../../../../lib/core/api-handler';
import { traceStorage } from '../../../../../lib/core/context';
import { logger } from '../../../../../lib/logger';

const loginSchema = z.object({
    email: z.string().min(1, 'Email or phone is required').max(256),
    password: z.string().min(1, 'Password is required').max(128),
});

// Constant-time dummy — prevents timing attacks when the user doesn't exist
const DUMMY_HASH = '$2b$10$invalidhashusedtomaintainresponsetimingXXXXXXXXXXXXXXXXX';

/**
 * SCHOOL LOGIN — Refactored & Hardened
 * 
 * - Fail-Closed Rate Limiting (Strict)
 * - Unified API Handler for Tracing
 * - Time-Consistent Bcrypt compares
 */

export const POST = createApiHandler(
    {
        action: 'SCHOOL_LOGIN',
        bodySchema: loginSchema
    },
    async (req, { body }) => {
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        
        // SECURITY: Strict Rate Limiting (Fail-Closed)
        const { allowed, reset } = await rateLimitService.check({
            key: `login-school:${ip}`,
            limit: 10,
            windowSeconds: 900,
            strict: true // Block if Redis is down
        });

        if (!allowed) {
            throw new AppError('Too many attempts. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter: reset });
        }

        const { email, password } = body;
        const identifier = email.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const digitsOnly = identifier.replace(/\D/g, '');
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

        const user = await db.query.schoolAdmins.findFirst({
            where: and(
                isEmail
                    ? eq(schoolAdmins.email, identifier.toLowerCase())
                    : or(
                        eq(schoolAdmins.phone, digitsOnly),
                        eq(schoolAdmins.phone, identifier),
                        eq(schoolAdmins.phone, last10),
                        sql`${schoolAdmins.phone} LIKE ${'%' + last10}`
                    ),
                eq(schoolAdmins.is_active, true),
                isNull(schoolAdmins.deleted_at)
            )
        });

        // Always run bcrypt even when user is not found to prevent timing-based user enumeration.
        const isValidPassword = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

        if (!user || !isValidPassword) {
            logger.warn(`[Login] Failed attempt for: ${identifier}`, { ip });
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        await createSession({ userId: user.id, userType: 'school_admin' });

        // Metadata injection for logging
        const store = traceStorage.getStore();
        if (store) store.userId = user.id;

        // Track login hour — fire-and-forget
        const now = new Date();
        analyticsService.trackLoginHour(now.getDay(), now.getHours()).catch(() => {});

        const { password_hash, ...userData } = user;
        return { success: true, user: { ...userData, role: 'school_admin' } };
    }
);
