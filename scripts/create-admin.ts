import { db } from '../src/lib/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const adminEmail = 'admin@technurture.com';
    const adminPassword = 'AdminPassword123!'; // User should change this

    console.log(`Checking for super admin: ${adminEmail}`);

    const existing = await db.query.users.findFirst({
        where: eq(users.email, adminEmail)
    });

    if (existing) {
        console.log('Super admin already exists. Updating password and role...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.update(users).set({
            role: 'super_admin',
            password_hash: hashedPassword,
            is_active: true
        }).where(eq(users.id, existing.id));
    } else {
        console.log('Creating new super admin...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.insert(users).values({
            email: adminEmail,
            password_hash: hashedPassword,
            first_name: 'Super',
            last_name: 'Admin',
            role: 'super_admin',
            is_active: true,
            cumulative_xp: 0,
            current_streak: 0,
            longest_streak: 0
        } as any);
    }

    console.log('--------------------------------------------------');
    console.log('Admin User Ready!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('--------------------------------------------------');
    process.exit(0);
}

main().catch(err => {
    console.error('Failed to create admin:', err);
    process.exit(1);
});
