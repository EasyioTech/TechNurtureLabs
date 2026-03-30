const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Manual DB Connection to avoid alias issues
const dbUrl = 'postgresql://postgres:admin@localhost:5433/technurturelabs';

async function diagnostic() {
    console.log('--- School Admin Login Diagnostic (Direct SQL) ---');
    const sql = postgres(dbUrl);
    
    try {
        const admins = await sql`
            SELECT sa.*, s.name as school_name 
            FROM school_admins sa
            JOIN schools s ON sa.school_id = s.id
            WHERE sa.is_active = true AND sa.deleted_at IS NULL
            LIMIT 1
        `;

        if (admins.length === 0) {
            console.log('No active school admins found.');
            return;
        }

        const admin = admins[0];
        console.log(`Found admin: ${admin.email}`);
        
        // Test "AdminPassword123!"
        const isCorrect = await bcrypt.compare('AdminPassword123!', admin.password_hash);
        console.log(`Password match with 'AdminPassword123!': ${isCorrect}`);

    } catch (err) {
        console.error('Error during diagnostic:', err);
    } finally {
        await sql.end();
    }
}

diagnostic();
