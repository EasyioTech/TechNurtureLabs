import 'dotenv/config';
import postgres from 'postgres';

async function checkSchema() {
    const sql = postgres(process.env.DATABASE_URL!);
    const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'classes'
    `;
    console.log(columns);
    await sql.end();
}

checkSchema();
