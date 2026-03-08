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

        // ===== STREAK & LAST ACTIVE TRACKING =====
        const now = new Date();
        if (!user.last_active_at || new Date(user.last_active_at).toDateString() !== now.toDateString()) {
            let newStreak = user.current_streak || 0;
            let longestStreak = user.longest_streak || 0;

            if (user.last_active_at) {
                const lastDate = new Date(user.last_active_at);
                lastDate.setHours(0, 0, 0, 0);
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);

                const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak += 1; // Consecutive day logged in
                } else if (diffDays > 1) {
                    newStreak = 1; // Streak broken, reset
                }
            } else {
                newStreak = 1; // First day tracking
            }

            if (newStreak > longestStreak) {
                longestStreak = newStreak;
            }

            await db.update(users).set({
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_active_at: now
            }).where(eq(users.id, user.id));

            user.current_streak = newStreak;
            user.longest_streak = longestStreak;
            user.last_active_at = now;
        }
        // =========================================

        const { password_hash, ...safeUser } = user;
        const role = session.role === 'admin' ? 'admin' : user.role;
        return NextResponse.json({ user: safeUser, role });

    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
