const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Manual DB Connection to avoid alias issues
const dbUrl = 'postgresql://postgres:admin@localhost:5433/technurturelabs';

async function diagnostic() {
    console.log('--- Student PIN Reset Deep Dive ---');
    const sql = postgres(dbUrl);
    
    try {
        const requests = await sql`
            SELECT pr.*, st.first_name, st.last_name, st.email, st.phone, st.password_hash as current_student_hash
            FROM pin_reset_requests pr
            JOIN students st ON pr.student_id = st.id
            WHERE pr.status = 'approved'
            ORDER BY pr.resolved_at DESC
            LIMIT 1
        `;

        if (requests.length === 0) {
            console.log('No approved PIN reset requests found.');
            return;
        }

        const req = requests[0];
        console.log(`\nRequest for: ${req.first_name} ${req.last_name}`);
        console.log(`Email/Phone: ${req.email || req.phone}`);
        console.log(`New PIN Stored in History: ${req.new_pin}`);
        console.log(`Current Student PIN Hash in DB: ${req.current_student_hash}`);
        
        // Verify if Current Student Hash matches New PIN
        const isMatch = await bcrypt.compare(req.new_pin, req.current_student_hash);
        console.log(`Does current hash match new PIN? ${isMatch}`);

        if (isMatch) {
            console.log('SUCCESS: PIN was correctly hashed and updated in students table.');
        } else {
            console.warn('FAILURE: PIN hash in students table does NOT match the approved PIN in history!');
        }

    } catch (err) {
        console.error('Error during diagnostic:', err);
    } finally {
        await sql.end();
    }
}

diagnostic();
