import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import { rateLimitService } from '@/lib/services/rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid email').max(256),
    password: z.string().min(1, 'Password is required').max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
    const { allowed, reset } = await rateLimitService.check({
        key: `admin-login:${ip}`,
        limit: 5,
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
      return NextResponse.json(
        { error: body.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }
    const { email, password } = body.data;

    const admin = await db.query.superAdmins.findFirst({
      where: and(eq(superAdmins.email, email.toLowerCase()), isNull(superAdmins.deleted_at), eq(superAdmins.is_active, true))
    });

    if (!admin) {
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
