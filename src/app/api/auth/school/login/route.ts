import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schoolAdmins } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid email').max(256),
    password: z.string().min(1, 'Password is required').max(128),
});

// Constant-time dummy — prevents timing attacks when the user doesn't exist
const DUMMY_HASH = '$2b$10$invalidhashusedtomaintainresponsetimingXXXXXXXXXXXXXXXXX';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed, reset } = await rateLimitService.check({
            key: `login-school:${ip}`,
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

        const user = await db.query.schoolAdmins.findFirst({
            where: and(
                eq(schoolAdmins.email, email.toLowerCase().trim()),
                eq(schoolAdmins.is_active, true),
                isNull(schoolAdmins.deleted_at)
            )
        });

        // Always run bcrypt even when user is not found to prevent timing-based user enumeration.
        const isValidPassword = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

        if (!user || !isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await createSession({ userId: user.id, userType: 'school_admin' });

        const { password_hash, ...userData } = user;
        return NextResponse.json({ success: true, user: { ...userData, role: 'school_admin' } });
    } catch (error: any) {
        console.error('School login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
