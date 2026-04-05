import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { students } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';
import { handleStudentEngagement } from '@/lib/gamification';
import { z } from 'zod';
import { analyticsService } from '@/lib/services/analytics-service';
import { createApiHandler, AppError } from '../../../../../lib/core/api-handler';
import { traceStorage } from '../../../../../lib/core/context';
import { logger } from '../../../../../lib/logger';

const loginSchema = z.object({
    email: z.string().min(1, 'Email or phone is required').max(256),
    password: z.string().min(1, 'Password is required').max(128),
});

/**
 * STUDENT LOGIN — Refactored & Hardened
 * 
 * - Fail-Closed Rate Limiting (Strict)
 * - Unified API Handler for Tracing
 * - Student Verification Checks
 */

export const POST = createApiHandler(
    {
        action: 'STUDENT_LOGIN',
        bodySchema: loginSchema
    },
    async (req, { body }) => {
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        
        // SECURITY: Strict Rate Limiting (Fail-Closed)
        const { allowed, reset } = await rateLimitService.check({
            key: `login-student:${ip}`,
            limit: 10,
            windowSeconds: 900,
            strict: true
        });

        if (!allowed) {
            throw new AppError('Too many attempts. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter: reset });
        }

        const { email, password } = body;
        const identifier = email.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const digitsOnly = identifier.replace(/\D/g, '');
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
        const normalizedIdentifier = isEmail ? identifier.toLowerCase() : digitsOnly;

        const user = await db.query.students.findFirst({
            where: and(
                isEmail
                    ? eq(students.email, normalizedIdentifier)
                    : or(
                        eq(students.phone, digitsOnly),
                        eq(students.phone, identifier),
                        eq(students.phone, last10),
                        sql`${students.phone} LIKE ${'%' + last10}`
                      ),
                sql`${students.deleted_at} IS NULL`,
                eq(students.is_active, true)
            )
        });

        const DUMMY_HASH = '$2b$10$invalidhashusedtomaintainresponsetimingXXXXXXXXXXXXXXXXX';
        const isValidPassword = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

        if (!user || !isValidPassword) {
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        if (!user.is_verified) {
            throw new AppError('Your account is pending verification by your school admin.', 'ACCOUNT_PENDING', 403);
        }

        await createSession({ userId: user.id, userType: 'student' });

        // Metadata injection for logging
        const store = traceStorage.getStore();
        if (store) {
            store.userId = user.id;
            store.schoolId = user.school_id!;
        }

        // Track login & engagement
        const now = new Date();
        analyticsService.trackLoginHour(now.getDay(), now.getHours()).catch(() => {});
        await handleStudentEngagement(user.id);

        const { password_hash, ...userData } = user;
        return { success: true, user: { ...userData, role: 'student' } };
    }
);
