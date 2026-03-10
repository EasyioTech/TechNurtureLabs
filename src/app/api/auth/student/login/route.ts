import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const { isRateLimited, response } = await checkRateLimit(`login-student:${ip}`, 10, 900);
        if (isRateLimited) return response!;

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and PIN are required' }, { status: 400 });
        }

        const user = await db.query.students.findFirst({
            where: eq(students.email, email.toLowerCase())
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials or student not found' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await createSession({ userId: user.id, userType: 'student' });

        const { password_hash, ...userData } = user;
        return NextResponse.json({ success: true, user: { ...userData, role: 'student' } });
    } catch (error: any) {
        console.error('Student login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
