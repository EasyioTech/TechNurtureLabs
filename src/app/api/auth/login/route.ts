import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const { isRateLimited, response } = await checkRateLimit(`login:${ip}`, 10, 900);
        if (isRateLimited) return response!;

        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
        }

        let user: any = null;
        let userType: 'super_admin' | 'school_admin' | 'student';

        const normalizedEmail = email.toLowerCase();

        if (role === 'student') {
            user = await db.query.students.findFirst({
                where: eq(students.email, normalizedEmail)
            });
            userType = 'student';
        } else if (role === 'school_admin' || role === 'admin') {
            user = await db.query.schoolAdmins.findFirst({
                where: eq(schoolAdmins.email, normalizedEmail)
            });
            userType = 'school_admin';
        } else if (role === 'super_admin') {
            user = await db.query.superAdmins.findFirst({
                where: eq(superAdmins.email, normalizedEmail)
            });
            userType = 'super_admin';
        } else {
            return NextResponse.json({ error: 'Invalid role access' }, { status: 403 });
        }

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials or access denied.' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Two factor is only for Super Admins in the current schema implementation
        if (userType === 'super_admin' && (user as any).two_factor_enabled) {
            return NextResponse.json({
                success: true,
                two_factor_required: true,
                userId: user.id
            });
        }

        await createSession({ userId: user.id, userType });

        const { password_hash, ...userData } = user;
        return NextResponse.json({ success: true, user: { ...userData, role: userType } });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
