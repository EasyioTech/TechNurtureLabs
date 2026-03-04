import { registerSchool, fetchActivePaymentPlans } from '../src/modules/auth/register-actions';
import { db } from '../src/lib/db';
import { schools, schoolSubscriptions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    try {
        const plans = await fetchActivePaymentPlans();
        if (plans.length === 0) {
            console.log('No active plans found');
            return;
        }

        const planId = plans[0].id;
        console.log('Registering school with plan:', planId);

        const formData = {
            name: 'Test School 123',
            email: 'test12345@school.com',
            udise_code: '12345678901',
            state: 'Delhi',
            district: 'South Delhi',
            school_type: 'high',
            grades_available: [9, 10],
            plan_id: planId
        };

        const newSchool = await registerSchool(formData);
        console.log('Registered School ID:', newSchool.id);

        const sub = await db.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.school_id, newSchool.id)
        });

        console.log('Subscription found:', !!sub);
        if (sub) {
            console.log('Sub Plan ID:', sub.plan_id);
            console.log('Sub Status:', sub.status);
        }

        await db.delete(schools).where(eq(schools.id, newSchool.id));
        console.log('Test completed and cleaned up.');
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}
test();
