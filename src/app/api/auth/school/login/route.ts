import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schoolAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
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

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await db.query.schoolAdmins.findFirst({
            where: eq(schoolAdmins.email, email.toLowerCase())
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials or school admin not found' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
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
