import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, paymentPlans } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    try {
        // Create super admin if not exists
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await db.insert(users).values({
            id: 'e0000000-0000-0000-0000-000000000001',
            role: 'super_admin',
            first_name: 'Platform',
            last_name: 'Admin',
            email: 'admin@technurture.com',
            password_hash: hashedPassword,
            is_active: true,
            cumulative_xp: 0,
            current_streak: 0,
            longest_streak: 0
        }).onConflictDoNothing({ target: users.id });

        // Create default payment plan required for school registration flow
        await db.insert(paymentPlans).values({
            id: 'c0000000-0000-0000-0000-000000000001',
            name: 'Starter Plan',
            description: 'Ideal for small schools to get started (up to 200 students)',
            billing_cycle: 'annual',
            price: '49999.00',
            max_students: 200,
            trial_days: 14,
            is_active: true,
            features: [
                "Full Digital Lesson Library",
                "Advanced Quiz & Assessments",
                "School Reporting Dashboard",
                "Gamification Engine"
            ]
        }).onConflictDoNothing({ target: paymentPlans.id });

        return NextResponse.json({
            success: true,
            message: 'Database connection verified! Super Admin user and Starter Plan seeded successfully.'
        });
    } catch (e: any) {
        console.error('Seeding error:', e);
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
