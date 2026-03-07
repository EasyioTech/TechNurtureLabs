const postgres = require('postgres');
require('dotenv').config();

async function descTable() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'courses'
        `;
        console.log('Columns in "users" table:');
        columns.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));
    } catch (error) {
        console.error('Failed to desc table:', error);
    } finally {
        await sql.end();
    }
}

descTable();
