
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/lib/db';
import { schoolAdmins } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'admin@greenwood-high-42s.edu';
    const password = 'AdminPassword123!';
    
    console.log(`Checking login for: ${email}`);
    
    const user = await db.query.schoolAdmins.findFirst({
        where: and(eq(schoolAdmins.email, email.toLowerCase()))
    });
    
    if (!user) {
        console.log('❌ User not found');
        return;
    }
    
    console.log(`User found: ${user.first_name} ${user.last_name}`);
    console.log(`Is active: ${user.is_active}`);
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (isValid) {
        console.log('✅ Password matches!');
    } else {
        console.log('❌ Password does NOT match');
        console.log(`Hash in DB: ${user.password_hash}`);
    }
}

main().catch(console.error);
