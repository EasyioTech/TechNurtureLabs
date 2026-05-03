import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students, schoolSubscriptions } from '@/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Check if a school can add more students based on their payment plan (Public Version)
 *
 * GET /api/school/check-registration-limit?school_id=UUID
 *
 * Authentication: None (Public endpoint)
 */

export async function GET(request: NextRequest) {
    try {
        const schoolId = request.nextUrl.searchParams.get('school_id');

        if (!schoolId) {
            return NextResponse.json(
                { error: 'school_id parameter is required' },
                { status: 400 }
            );
        }

        // Get active subscription for the school
        const subscription = await db.query.schoolSubscriptions.findFirst({
            where: and(
                eq(schoolSubscriptions.school_id, schoolId),
                eq(schoolSubscriptions.status, 'active')
            ),
            with: { plan: true }
        });

        // If no active subscription, allow unlimited students
        if (!subscription) {
            return NextResponse.json({
                can_add: true,
                current_count: 0,
                max_students: null,
                available_slots: null,
                plan_name: 'No Active Subscription',
                message: 'No active subscription found. Registration available.'
            });
        }

        const plan = subscription.plan;
        const maxStudents = plan.max_students;

        // Get current student count for this school
        const result = await db
            .select({
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(students)
            .where(
                and(
                    eq(students.school_id, schoolId),
                    isNull(students.deleted_at)
                )
            );

        const currentCount = result[0]?.count || 0;

        // If max_students is null, unlimited
        if (maxStudents === null) {
            return NextResponse.json({
                can_add: true,
                current_count: currentCount,
                max_students: null,
                available_slots: null,
                plan_name: plan.name,
                message: `Unlimited registration available. Current students: ${currentCount}`
            });
        }

        // Check if school has reached the limit
        const canAdd = currentCount < maxStudents;
        const availableSlots = Math.max(0, maxStudents - currentCount);

        return NextResponse.json({
            can_add: canAdd,
            current_count: currentCount,
            max_students: maxStudents,
            available_slots: availableSlots,
            plan_name: plan.name,
            message: canAdd
                ? `${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available for registration.`
                : `Student registration limit reached! This school has reached its capacity of ${maxStudents} students. Please contact the school administrator.`
        });

    } catch (error: any) {
        logger.error('[Public Check Student Limit] Error', { message: error?.message });
        return NextResponse.json(
            { error: 'Failed to check registration eligibility', can_add: true }, // Default to true on error to not block registration if API fails
            { status: 500 }
        );
    }
}
