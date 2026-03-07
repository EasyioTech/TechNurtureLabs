const postgres = require('postgres');
require('dotenv').config();

async function checkTable() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const result = await sql.unsafe('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
        console.log('Tables in "public" schema:');
        result.forEach(row => console.log(row.table_name));
    } catch (error) {
        console.error('Failed to list tables:', error);
    } finally {
        await sql.end();
    }
}

checkTable();
