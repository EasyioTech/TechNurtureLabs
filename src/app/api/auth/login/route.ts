import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimitKey = `rate-limit:login:${ip}`;
        const reqCount = await redis.incr(rateLimitKey);

        if (reqCount === 1) {
            await redis.expire(rateLimitKey, 60 * 15); // 15 minute blackout window
        }

        if (reqCount > 10) {
            return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
        }

        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase())
        });

        if (!user || user.role !== role) {
            return NextResponse.json({ error: 'Invalid credentials or access denied.' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.two_factor_enabled) {
            return NextResponse.json({
                success: true,
                two_factor_required: true,
                userId: user.id
            });
        }

        await createSession({ userId: user.id, role: user.role });

        const { password_hash, ...userData } = user;
        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 });
    }
}
