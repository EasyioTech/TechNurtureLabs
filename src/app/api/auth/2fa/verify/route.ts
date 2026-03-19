import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students, schoolAdmins, superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import { verify } from 'otplib';
import bcrypt from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';
import { decryptSecret } from '@/lib/crypto';

export async function POST(request: NextRequest) {
    try {
        // Rate-limit 2FA attempts per userId to prevent brute-force of TOTP codes.
        // (6-digit TOTP has only 1,000,000 combinations.)
        const { userId, token } = await request.json();

        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and token are required' }, { status: 400 });
        }

        const { allowed } = await rateLimitService.checkUserLimit(userId, '2fa-verify', 10, 300);
        if (!allowed) {
            return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
        }

        let user: any = await db.query.students.findFirst({ where: eq(students.id, userId) });
        let table: any = students;
        let role = 'student';

        if (!user) {
            user = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, userId) });
            table = schoolAdmins;
            role = 'school_admin';
        }
        if (!user) {
            user = await db.query.superAdmins.findFirst({ where: eq(superAdmins.id, userId) });
            table = superAdmins;
            role = 'super_admin';
        }

        if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
            return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 403 });
        }

        // Decrypt stored secret before passing to TOTP verifier
        const plainSecret = decryptSecret(user.two_factor_secret);

        const result = await verify({ token, secret: plainSecret });

        if (!result.valid) {
            // Backup codes are stored as bcrypt hashes — use compare, NOT indexOf.
            // The old indexOf() check was broken because it compared plaintext to hashes.
            const storedHashes = (user.two_factor_backup_codes as string[]) ?? [];
            let matchedIndex = -1;

            for (let i = 0; i < storedHashes.length; i++) {
                const isMatch = await bcrypt.compare(token.trim().toUpperCase(), storedHashes[i]);
                if (isMatch) { matchedIndex = i; break; }
            }

            if (matchedIndex === -1) {
                return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
            }

            // Invalidate the used backup code (single-use)
            const remaining = storedHashes.filter((_, i) => i !== matchedIndex);
            await db.update(table)
                .set({ two_factor_backup_codes: remaining })
                .where(eq(table.id, user.id));
        }

        await createSession({ userId: user.id, userType: role as any });

        const { password_hash, two_factor_secret, ...userData } = user;
        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
