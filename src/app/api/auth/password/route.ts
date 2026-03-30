import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students, userSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // CRITICAL FIX #10: Add rate limiting to password change (prevents password spray attacks)
        const { allowed, reset } = await rateLimitService.check({
            key: `password-change:${session.userId}`,
            limit: 5,  // Max 5 password changes per user per hour
            windowSeconds: 3600
        });

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many password change attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': reset.toString() } }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
        }

        const { userId, userType } = session;
        const tableMap: any = {
            'super_admin': superAdmins,
            'school_admin': schoolAdmins,
            'student': students
        };
        const queryMap: any = {
            'super_admin': db.query.superAdmins,
            'school_admin': db.query.schoolAdmins,
            'student': db.query.students
        };

        const targetTable = tableMap[userType];
        if (!targetTable) return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });

        const user = await queryMap[userType].findFirst({
            where: eq(targetTable.id, userId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await db.transaction(async (tx) => {
            await tx.update(targetTable)
                .set({ password_hash: newPasswordHash })
                .where(eq(targetTable.id, userId));

            // Invalidate all sessions for this user type + id
            const sessions = await tx.query.userSessions.findMany({
                where: and(
                    eq(userSessions.user_id, userId),
                    eq(userSessions.user_type, userType)
                )
            });

            await tx.update(userSessions)
                .set({ revoked_at: new Date() })
                .where(and(
                    eq(userSessions.user_id, userId),
                    eq(userSessions.user_type, userType)
                ));

            // Clean up Redis
            for (const s of sessions) {
                await redis.del(`session:${s.id}`);
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
