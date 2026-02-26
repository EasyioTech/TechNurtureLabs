import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role === 'admin') {
            const user = await db.query.adminUsers.findFirst({
                where: eq(adminUsers.id, session.userId)
            });
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            const { password_hash, ...safeUser } = user;
            return NextResponse.json({ user: safeUser, role: 'admin' });
        }

        const user = await db.query.profiles.findFirst({
            where: eq(profiles.id, session.userId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password_hash, ...safeUser } = user;
        return NextResponse.json({ user: safeUser, role: user.role });

    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
