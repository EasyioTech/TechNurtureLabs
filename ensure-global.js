const postgres = require('postgres');
require('dotenv').config();

async function run() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        await sql.unsafe("INSERT INTO platform_settings (id, platform_name) VALUES ('global', 'TechNurture') ON CONFLICT (id) DO NOTHING");
        console.log('global settings row ensured');
    } finally {
        await sql.end();
    }
}
run();
