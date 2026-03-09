'use server';

import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { platformSettings, students, schoolAdmins, superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function findUserById(userId: string) {
    let user: any = await db.query.students.findFirst({ where: eq(students.id, userId) });
    let table: any = students;
    if (!user) {
        user = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, userId) });
        table = schoolAdmins;
    }
    if (!user) {
        user = await db.query.superAdmins.findFirst({ where: eq(superAdmins.id, userId) });
        table = superAdmins;
    }
    return { user, table };
}
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function generate2FASecret() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const { user } = await findUserById(session.userId);

    if (!user) throw new Error('User not found');

    const settings = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'global')
    });

    const secret = generateSecret();
    const otpauth = generateURI({
        label: user.email,
        issuer: settings?.platform_name || 'TechNurture Labs',
        secret
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeUrl };
}

export async function enable2FA(secret: string, token: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const result = await verify({
        token,
        secret,
    });

    if (!result.valid) {
        return { success: false, error: 'Invalid verification code' };
    }

    // APP ISSUE 2 (Issue 4): Hash backup codes before storing.
    // Plain codes are returned ONCE to the caller for the user to save.
    // Stored hashes cannot be reversed — only bcrypt.compare verification works.
    const plainCodes = Array.from({ length: 8 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A1B2C3D4"
    );
    const hashedCodes = await Promise.all(
        plainCodes.map(code => bcrypt.hash(code, 10))
    );

    const { table } = await findUserById(session.userId);
    if (!table) throw new Error('User not found');

    await db.update(table)
        .set({
            two_factor_secret: secret,
            two_factor_enabled: true,
            two_factor_backup_codes: hashedCodes,
        })
        .where(eq(table.id, session.userId));

    revalidatePath('/admin');
    // Return plain codes ONCE — frontend must prompt user to copy/download them
    return { success: true, recoveryCodes: plainCodes };
}

export async function disable2FA(token: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const { user, table } = await findUserById(session.userId);

    if (!user || !user.two_factor_secret) {
        throw new Error('2FA not enabled');
    }

    const result = await verify({
        token,
        secret: user.two_factor_secret,
    });

    if (!result.valid) {
        return { success: false, error: 'Invalid verification code' };
    }

    if (!table) throw new Error('User not found');

    await db.update(table)
        .set({
            two_factor_secret: null as any,
            two_factor_enabled: false,
            two_factor_backup_codes: [],
        })
        .where(eq(table.id, session.userId));

    revalidatePath('/admin');
    return { success: true };
}

/**
 * APP ISSUE 2 (Issue 4): Verify a 2FA backup code using bcrypt compare.
 * Must be called at POST /auth/2fa/verify-backup.
 *
 * - Iterates hashed codes in DB and compares with bcrypt (not string equality).
 * - Removes the used code after successful verification (one-time use).
 * - Never returns the stored hashes to the client.
 */
export async function verify2FABackupCode(userId: string, inputCode: string): Promise<boolean> {
    const { user, table } = await findUserById(userId);
    if (!user) return false;

    const storedHashes = (user.two_factor_backup_codes as string[]) ?? [];
    let matchedIndex = -1;

    for (let i = 0; i < storedHashes.length; i++) {
        const isMatch = await bcrypt.compare(inputCode.trim().toUpperCase(), storedHashes[i]);
        if (isMatch) {
            matchedIndex = i;
            break;
        }
    }

    if (matchedIndex === -1) return false;

    // Remove the used code — backup codes are single-use
    const remainingCodes = storedHashes.filter((_, i) => i !== matchedIndex);
    await db.update(table)
        .set({ two_factor_backup_codes: remainingCodes })
        .where(eq(table.id, userId));

    return true;
}
