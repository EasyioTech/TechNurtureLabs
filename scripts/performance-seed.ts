import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const SCHOOL_NAMES = [
    'Greenwood High', 'Oakridge International', 'Silver Oaks School', 'The Heritage School',
    'Delhi Public School', 'St. Xavier\'s Academy', 'Mount Carmel School', 'Ryan International',
    'Lotus Valley school', 'The Doon School', 'Mayo College', 'Scindia School',
    'Bishop Cotton', 'Lawrence School', 'Indus International', 'Vasant Valley',
    'Sishya School', 'Step by Step', 'The Valley School', 'Welham Girls',
    'Global Genesis', 'Bright Mind Academy', 'Future Stars School', 'Little Angels',
    'Modern Era School', 'St. Mary\'s Convent', 'Don Bosco School', 'Loreto Convent',
    'Pathways World School', 'The British School', 'American Embassy School',
    'Treamis World School', 'Inventure Academy', 'Presidency School', 'Vidya Niketan',
    'National Public School', 'Mallya Aditi', 'Canadian International', 'Stonehill International',
    'Ebenezer International', 'Chrysalis High', 'Vibgyor High', 'Orchid International',
    'Klay Prep Schools', 'Euro Kids', 'Podar International', 'Kendriya Vidyalaya',
    'Army Public School', 'Navodaya Vidyalaya', 'Sainik School'
];

const CITIES = [
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'
];

const STATES = [
    'Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'West Bengal', 'Rajasthan', 'Uttar Pradesh'
];

const FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ishaan', 'Aaryan', 'Shaurya', 'Ansh',
    'Aadhya', 'Ananya', 'Saanvi', 'Diya', 'Pari', 'Anika', 'Ira', 'Avni', 'Myra', 'Kyra',
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Karan', 'Pooja', 'Sanjay', 'Megha'
];

const LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Jain', 'Reddy', 'Patel', 'Iyer', 'Nair',
    'Deshmukh', 'Kulkarni', 'Joshi', 'Bose', 'Chatterjee', 'Mukherjee', 'Das', 'Sen', 'Dutta'
];

const PASSWORD_HASH = '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu'; // AdminPassword123!

async function main() {
    console.log('🚀 Starting Performance Seed (50 Schools)...');

    // 1. Get Payment Plans and Classes
    const plans = await sql`SELECT id, name, price FROM payment_plans WHERE is_active = true`;
    if (plans.length === 0) {
        console.error('❌ No active payment plans found. Run basic seed first.');
        process.exit(1);
    }

    const availableClasses = await sql`SELECT id FROM classes WHERE deleted_at IS NULL`;
    if (availableClasses.length === 0) {
        console.error('❌ No classes found. Run basic seed first.');
        process.exit(1);
    }

    // 2. Loop to create 50 schools
    for (let i = 0; i < 50; i++) {
        const schoolName = `${SCHOOL_NAMES[i % SCHOOL_NAMES.length]} ${i > 49 ? Math.floor(i/50) : ''}`.trim();
        const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);
        const cityIndex = i % CITIES.length;
        const city = CITIES[cityIndex];
        const state = STATES[cityIndex];

        process.stdout.write(`   - Seeding School ${i + 1}/50: ${schoolName}... `);

        try {
            await sql.begin(async (tx) => {
                // a. Create School
                const [school] = await tx`
                    INSERT INTO schools (name, slug, email, phone, city, state, country, pincode, is_active)
                    VALUES (${schoolName}, ${slug}, ${`info@${slug}.edu`}, ${`+91${9000000000 + i}`}, ${city}, ${state}, 'IN', ${`5600${10 + i}`}, true)
                    RETURNING id
                `;

                // b. Create Academic Session
                const [session] = await tx`
                    INSERT INTO academic_sessions (school_id, name, start_date, end_date, is_current)
                    VALUES (${school.id}, '2025-26 Academic Year', '2025-04-01', '2026-03-31', true)
                    RETURNING id
                `;

                // c. Create School Admin
                const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
                const lastName = LAST_NAMES[i % LAST_NAMES.length];
                await tx`
                    INSERT INTO school_admins (school_id, first_name, last_name, email, password_hash, is_active)
                    VALUES (${school.id}, ${firstName}, ${lastName}, ${`admin@${slug}.edu`}, ${PASSWORD_HASH}, true)
                `;

                // d. Map Classes
                for (const cls of availableClasses) {
                    await tx`
                        INSERT INTO school_class_mapping (school_id, class_id, is_active)
                        VALUES (${school.id}, ${cls.id}, true)
                    `;
                }

                // e. Create Students (3-5)
                const studentCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
                for (let j = 0; j < studentCount; j++) {
                    const sFirstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
                    const sLastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                    const studentEmail = `student.${i}.${j}@${slug}.edu`;
                    const sClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];

                    const [student] = await tx`
                        INSERT INTO students (school_id, first_name, last_name, email, password_hash, is_active, is_verified)
                        VALUES (${school.id}, ${sFirstName}, ${sLastName}, ${studentEmail}, ${PASSWORD_HASH}, true, true)
                        RETURNING id
                    `;

                    // Academic Record
                    await tx`
                        INSERT INTO student_academic_records (user_id, school_id, session_id, class_id, roll_number, section)
                        VALUES (${student.id}, ${school.id}, ${session.id}, ${sClass.id}, ${String(j + 1)}, 'A')
                    `;
                }

                // f. Subscription and Payment
                const plan = plans[Math.floor(Math.random() * plans.length)];
                const [subscription] = await tx`
                    INSERT INTO school_subscriptions (school_id, plan_id, status, current_period_start, current_period_end)
                    VALUES (${school.id}, ${plan.id}, 'active', NOW(), NOW() + interval '1 year')
                    RETURNING id
                `;

                const [transaction] = await tx`
                    INSERT INTO payment_transactions (school_id, subscription_id, razorpay_order_id, razorpay_payment_id, amount, status)
                    VALUES (${school.id}, ${subscription.id}, ${`order_${uuidv4().substring(0, 8)}`}, ${`pay_${uuidv4().substring(0, 8)}`}, ${plan.price}, 'captured')
                    RETURNING id
                `;

                await tx`
                    INSERT INTO invoices (school_id, subscription_id, transaction_id, invoice_number, status, subtotal, tax_amount, total, billing_name, paid_at, issued_at)
                    VALUES (${school.id}, ${subscription.id}, ${transaction.id}, ${`INV-${1000 + i}`}, 'paid', ${plan.price}, 0, ${plan.price}, ${schoolName}, NOW(), NOW())
                `;
            });
            console.log('✅');
        } catch (err) {
            console.log('❌');
            console.error(`      Error seeding ${schoolName}:`, err);
        }
    }

    console.log('\n✅ Performance Seed Complete.');
    console.log(`   - 50 Schools created`);
    console.log(`   - 50 School Admins created`);
    console.log(`   - ~200 Students created`);
    console.log(`   - Subscriptions and Payments generated`);
    
    await sql.end();
}

main().catch((err) => {
    console.error('❌ Run failed:', err);
    process.exit(1);
});
