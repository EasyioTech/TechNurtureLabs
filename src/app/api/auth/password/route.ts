import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await db.update(users)
            .set({ password_hash: newPasswordHash })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
