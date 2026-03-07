const postgres = require('postgres');
require('dotenv').config();

async function checkCols() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const columns = await sql.unsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_settings'");
        console.log('Columns in "platform_settings":');
        columns.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));
    } finally {
        await sql.end();
    }
}
checkCols();
