import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let user: any = null;
        const { userId, userType } = session;

        if (userType === 'student') {
            user = await db.query.students.findFirst({
                where: and(eq(students.id, userId), isNull(students.deleted_at), eq(students.is_active, true))
            });
        } else if (userType === 'school_admin') {
            user = await db.query.schoolAdmins.findFirst({
                where: and(eq(schoolAdmins.id, userId), isNull(schoolAdmins.deleted_at), eq(schoolAdmins.is_active, true))
            });
        } else if (userType === 'super_admin') {
            user = await db.query.superAdmins.findFirst({
                where: and(eq(superAdmins.id, userId), isNull(superAdmins.deleted_at), eq(superAdmins.is_active, true))
            });
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // ===== GAMIFICATION & ACTIVITY TRACKING =====
        if (userType === 'student') {
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
                        newStreak += 1;
                    } else if (diffDays > 1) {
                        newStreak = 1;
                    }
                } else {
                    newStreak = 1;
                }

                if (newStreak > longestStreak) {
                    longestStreak = newStreak;
                }

                await db.update(students).set({
                    current_streak: newStreak,
                    longest_streak: longestStreak,
                    last_active_at: now
                }).where(eq(students.id, user.id));

                user.current_streak = newStreak;
                user.longest_streak = longestStreak;
                user.last_active_at = now;
            }
        } else {
            // Admin Activity Tracking
            const tableMap: any = { 'super_admin': superAdmins, 'school_admin': schoolAdmins };
            const targetTable = tableMap[userType];

            if (!user.last_active_at || (now.getTime() - new Date(user.last_active_at).getTime() > 1000 * 60 * 15)) {
                await db.update(targetTable).set({ last_active_at: now }).where(eq(targetTable.id, user.id));
                user.last_active_at = now;
            }
        }

        const { password_hash, ...safeUser } = user;
        return NextResponse.json({
            user: {
                ...safeUser,
                role: userType,
                full_name: `${safeUser.first_name || ''} ${safeUser.last_name || ''}`.trim() || 'User',
                total_xp: Number(safeUser.cumulative_xp || 0),
                level: Math.floor(Number(safeUser.cumulative_xp || 0) / 1000) + 1,
            },
            role: userType
        });

    } catch (err) {
        console.error('Me route error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
