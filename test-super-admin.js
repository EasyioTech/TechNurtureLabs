const postgres = require('postgres');
require('dotenv').config();

async function run() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const res = await sql.unsafe("SELECT id, email, role FROM users WHERE role = 'super_admin'");
        console.log('Super Admin user:', res);
    } finally {
        await sql.end();
    }
}
run();
