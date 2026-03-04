import 'dotenv/config';
import { registerSchool } from './src/modules/auth/register-actions';

async function checkDb() {
    try {
        console.log("Simulating Registration...");
        const result = await registerSchool({
            name: "Test School " + Date.now(),
            udise_code: "12345678901",
            state: "Delhi",
            district: "South Delhi",
            contact_email: "test.admin" + Date.now() + "@school.com",
            contact_phone: "9999999999",
            principal_name: "Test Principal",
            password: "password123",
            plan_id: "c0000000-0000-0000-0000-000000000001" // Trying to assign a plan if it exists
        });
        console.log("Registration Result:", result);
    } catch (e) { console.error("Error during registration:", e) }
    process.exit(0);
}
checkDb();
