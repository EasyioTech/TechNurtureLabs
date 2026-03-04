import { db } from './src/lib/db';
import { users, schools } from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkDb() {
    const recentSchools = await db.query.schools.findMany({
        orderBy: [desc(schools.created_at)],
        limit: 5
    });
    console.log("Recent Schools:", recentSchools.map(s => ({ id: s.id, name: s.name, email: s.email })));

    const recentUsers = await db.query.users.findMany({
        where: eq(users.role, 'school_admin'),
        orderBy: [desc(users.created_at)],
        limit: 5
    });
    console.log("Recent School Admins:", recentUsers.map(u => ({ id: u.id, email: u.email, role: u.role, school_id: u.school_id })));

    process.exit(0);
}
checkDb().catch(console.error);
