import { db } from './src/lib/db';
import { schoolAdmins, schools } from './src/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function diagnostic() {
    console.log('--- School Admin Login Diagnostic ---');
    
    // Get all active school admins
    const admins = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.is_active, true),
            isNull(schoolAdmins.deleted_at)
        ),
        with: {
            school: true
        }
    });

    if (!admins) {
        console.log('No active school admins found.');
        return;
    }

    console.log(`Found admin: ${admins.email} for school: ${admins.school?.name}`);
    console.log(`Stored Hash: ${admins.password_hash}`);
    
    // Test common password "Welcome@123"
    const isWelcome = await bcrypt.compare('Welcome@123', admins.password_hash);
    console.log(`Password match with 'Welcome@123': ${isWelcome}`);
    
    // Check if hash starts with $2a$ or $2b$ (valid bcrypt)
    if (admins.password_hash.startsWith('$2a$') || admins.password_hash.startsWith('$2b$')) {
        console.log('Hash format looks valid (bcrypt).');
    } else {
        console.warn('CRITICAL: Hash format does NOT look like bcrypt! Password might be plain text or different algorithm.');
    }
}

diagnostic().catch(console.error);
