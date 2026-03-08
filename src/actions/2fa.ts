'use server';

import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { users, platformSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function generate2FASecret() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
    });

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

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 12).toUpperCase()
    );

    await db.update(users)
        .set({
            two_factor_secret: secret,
            two_factor_enabled: true,
            two_factor_backup_codes: recoveryCodes,
        })
        .where(eq(users.id, session.userId));

    revalidatePath('/admin');
    return { success: true, recoveryCodes };
}

export async function disable2FA(token: string) {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
    });

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

    await db.update(users)
        .set({
            two_factor_secret: null,
            two_factor_enabled: false,
            two_factor_backup_codes: [],
        })
        .where(eq(users.id, session.userId));

    revalidatePath('/admin');
    return { success: true };
}
