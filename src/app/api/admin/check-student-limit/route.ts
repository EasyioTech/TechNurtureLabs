import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schools, students, schoolSubscriptions, paymentPlans } from '@/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { verifySession } from '@/lib/auth';

/**
 * Check if a school can add more students based on their payment plan
 *
 * GET /api/admin/check-student-limit?school_id=UUID
 *
 * Authentication: Required. User must be a school admin OR super admin.
 * School admins can only check their own school's limit.
 *
 * Response:
 * {
 *   can_add: boolean,
 *   current_count: number,
 *   max_students: number | null (null = unlimited),
 *   available_slots: number | null,
 *   plan_name: string,
 *   message: string
 * }
 */

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Require authentication
        const session = await verifySession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const schoolId = request.nextUrl.searchParams.get('school_id');

        if (!schoolId) {
            return NextResponse.json(
                { error: 'school_id parameter is required' },
                { status: 400 }
            );
        }

        // SECURITY: School admins can only check their own school
        if (session.role !== 'super_admin' && session.school_id !== schoolId) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
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
                message: 'No active subscription found. Unlimited students allowed.'
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
                message: `Your plan has unlimited students. Currently: ${currentCount}`
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
                ? `${availableSlots} student${availableSlots !== 1 ? 's' : ''} slot${availableSlots !== 1 ? 's' : ''} available (${currentCount}/${maxStudents})`
                : `Student limit reached! Your plan allows ${maxStudents} students and you have ${currentCount}. Please upgrade your plan to add more students.`
        });

    } catch (error: any) {
        logger.error('[Check Student Limit] Error', { message: error?.message });
        return NextResponse.json(
            { error: 'Failed to check student limit' },
            { status: 500 }
        );
    }
}
