import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { superAdmins, schoolAdmins, students } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { rateLimitService } from '@/lib/services/rate-limit';

export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limit by IP to prevent user enumeration via activity tracking
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
        const { allowed: ipAllowed } = await rateLimitService.check({
            key: `auth-me:ip:${ip}`,
            limit: 100,
            windowSeconds: 60  // 100 requests per minute per IP (aggregate)
        });

        if (!ipAllowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // SECURITY: Also rate limit per authenticated user to prevent polling
        // Even if IP limit is high, individual users can't spam their own /auth/me
        const { allowed: userAllowed } = await rateLimitService.check({
            key: `auth-me:user:${session.userId}`,
            limit: 30,
            windowSeconds: 60  // 30 requests per minute per user
        });

        if (!userAllowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

        // SECURITY: Exclude sensitive fields (passwords, 2FA secrets, backup codes)
        const { password_hash, two_factor_secret, backup_codes, ...safeUser } = user;

        // SECURITY: Handle XP safely to prevent precision loss on large numbers
        // cumulative_xp is stored as bigint in DB. JavaScript numbers lose precision above 2^53.
        // Return as string to preserve full precision for frontend calculation.
        let totalXpString = '0';
        let totalXpNumber = 0;

        if (safeUser.cumulative_xp) {
            // Get value as string to preserve full precision
            const xpValue = safeUser.cumulative_xp;
            if (typeof xpValue === 'bigint') {
                totalXpString = xpValue.toString();
                totalXpNumber = Number(xpValue);
            } else if (typeof xpValue === 'number') {
                totalXpNumber = xpValue;
                totalXpString = Math.floor(xpValue).toString();
            } else {
                totalXpNumber = parseInt(String(xpValue)) || 0;
                totalXpString = totalXpNumber.toString();
            }
        }

        // Level calculation: use the safe numeric value for display
        const level = Math.max(1, Math.floor(totalXpNumber / 1000) + 1);

        return NextResponse.json({
            user: {
                ...safeUser,
                cumulative_xp: totalXpString,  // Return as string for precision
                role: userType,
                full_name: `${safeUser.first_name || ''} ${safeUser.last_name || ''}`.trim() || 'User',
                level,
            },
            role: userType
        });

    } catch (err) {
        // Log only in development to avoid information leakage
        if (process.env.NODE_ENV === 'development') {
            console.error('Me route error:', err);
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
