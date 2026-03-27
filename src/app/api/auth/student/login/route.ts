import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';
import { handleStudentEngagement } from '@/lib/gamification';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().min(1, 'Email or phone is required').max(256),
    password: z.string().min(1, 'Password is required').max(128),
});

export async function POST(request: NextRequest) {
    try {
        // CF-Connecting-IP is set by Cloudflare and cannot be spoofed by clients.
        // x-real-ip is the nginx fallback. x-forwarded-for is intentionally NOT used
        // because it is trivially spoofable and would bypass rate limiting.
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed, reset } = await rateLimitService.check({
            key: `login-student:${ip}`,
            limit: 10,
            windowSeconds: 900
        });

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': reset.toString() } }
            );
        }

        const body = loginSchema.safeParse(await request.json());
        if (!body.success) {
            return NextResponse.json({ error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { email, password } = body.data;

        const identifier = email.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        // Strip all non-digits for phone lookup — matches however the number was stored
        const digitsOnly = identifier.replace(/\D/g, '');
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
        const normalizedIdentifier = isEmail ? identifier.toLowerCase() : digitsOnly;

        const user = await db.query.students.findFirst({
            where: and(
                isEmail
                    ? eq(students.email, normalizedIdentifier)
                    // Robust phone match: digits-only, explicit match, or end-of-string match (last 10)
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

        // Always run bcrypt even when user is not found to prevent timing-based
        // user enumeration (an absent user returns in ~0ms, valid user in ~100ms).
        const DUMMY_HASH = '$2b$10$invalidhashusedtomaintainresponsetimingXXXXXXXXXXXXXXXXX';
        const isValidPassword = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

        if (!user || !isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (!user.is_verified) {
            return NextResponse.json({ error: 'Your account is pending verification by your school admin.' }, { status: 403 });
        }

        await createSession({ userId: user.id, userType: 'student' });
        
        // Handle streak and login challenges
        await handleStudentEngagement(user.id);

        const { password_hash, ...userData } = user;
        return NextResponse.json({ success: true, user: { ...userData, role: 'student' } });
    } catch (error: any) {
        console.error('Student login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
