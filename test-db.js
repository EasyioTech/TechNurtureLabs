const postgres = require('postgres');
require('dotenv').config();

async function checkConnection() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('Database connected successfully:', result);
    } catch (error) {
        console.error('Failed to connect to database:', error);
    } finally {
        await sql.end();
    }
}

checkConnection();
