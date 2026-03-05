import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password_hash, ...safeUser } = user;
        const role = session.role === 'admin' ? 'admin' : user.role;
        return NextResponse.json({ user: safeUser, role });

    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
