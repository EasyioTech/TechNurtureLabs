import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const { isRateLimited, response } = await checkRateLimit(`admin-login:${ip}`, 5, 900); // Stricter for admin
    if (isRateLimited) return response!;

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await db.query.superAdmins.findFirst({
      where: eq(superAdmins.email, email.toLowerCase())
    });

    if (!admin || !admin.is_active) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await db.update(superAdmins).set({ last_active_at: new Date() }).where(eq(superAdmins.id, admin.id));
    await createSession({ userId: admin.id, userType: 'super_admin' });

    const { password_hash, ...adminData } = admin;

    return NextResponse.json({
      success: true,
      user: {
        ...adminData,
        role: 'super_admin',
        full_name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Super Admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
