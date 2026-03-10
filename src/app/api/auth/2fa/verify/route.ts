import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students, schoolAdmins, superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth';
import { verify } from 'otplib';

export async function POST(request: NextRequest) {
    try {
        const { userId, token } = await request.json();

        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and token are required' }, { status: 400 });
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

        const result = await verify({
            token,
            secret: user.two_factor_secret
        });

        if (!result.valid) {
            // Check backup codes
            const backupCodes = user.two_factor_backup_codes as string[];
            const backupCodeIndex = backupCodes.indexOf(token);

            if (backupCodeIndex !== -1) {
                // Remove used backup code
                const newBackupCodes = [...backupCodes];
                newBackupCodes.splice(backupCodeIndex, 1);

                await db.update(table)
                    .set({ two_factor_backup_codes: newBackupCodes })
                    .where(eq(table.id, user.id));
            } else {
                return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
            }
        }

        await createSession({ userId: user.id, userType: role as any });

        const { password_hash, two_factor_secret, ...userData } = user;
        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
