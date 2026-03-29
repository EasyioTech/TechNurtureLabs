'use server';

import { db } from '@/lib/db';
import {
    students, schools, courses, lessons,
    enrollments, schoolSubscriptions, paymentTransactions,
    lessonProgress, paymentPlans
} from '@/db/schema';
import { eq, count, sql, isNull, isNotNull, and, gte } from 'drizzle-orm';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { Stats } from '../../types';
import { analyticsService } from '@/lib/services/analytics-service';

// Normalize billing cycle to a monthly divisor for MRR
function billingCycleMonths(cycle: string): number {
    switch (cycle) {
        case 'yearly':     return 12;
        case 'quarterly':  return 3;
        case 'monthly':
        default:           return 1;
    }
}

export async function fetchAdminStats(): Promise<Stats> {
    await requireSuperAdmin();

    // PCU, DAU, MAU are always real-time reads from Redis regardless of cache state
    const [pcu, dau, mau] = await Promise.all([
        analyticsService.getPCU(),
        analyticsService.getDAU(),
        analyticsService.getMAU(),
    ]);

    // 1. Attempt to fetch the rest from high-performance Redis counters
    const redisStats: any = await analyticsService.getGlobalStats();
    const lastSync = Number(redisStats.last_sync || 0);
    const CACHE_MINUTES = 15;
    const isCacheWarm = redisStats.total_students && (Date.now() - lastSync < CACHE_MINUTES * 60 * 1000);

    if (isCacheWarm) {
        const mrr = Number(redisStats.mrr || 0);
        return {
            totalStudents: Number(redisStats.total_students || 0),
            activeStudents: Number(redisStats.active_students || 0),
            totalSchools: Number(redisStats.total_schools || 0),
            activeSchools: Number(redisStats.active_schools || 0),
            totalCourses: Number(redisStats.total_courses || 0),
            publishedCourses: Number(redisStats.published_courses || 0),
            totalLessons: Number(redisStats.total_lessons || 0),
            totalXp: Number(redisStats.total_xp || 0),
            avgCompletion: Number(redisStats.avg_completion || 0),
            totalRevenue: Number(redisStats.total_revenue || 0),
            activeSubscriptions: Number(redisStats.total_subscriptions || 0),
            trialingSubscriptions: Number(redisStats.trialing_subscriptions || 0),
            activePlansPercentage: Number(redisStats.active_plans_pct || 0),
            activeUsers30d: Number(redisStats.active_users_30d || redisStats.active_students || 0),
            mrr,
            arr: mrr * 12,
            pcu,
            dau,
            mau,
        };
    }

    // 2. Fallback to SQL (only if cache is stale or missing)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
        sCount, activeStudentCount, schData, cData, lCount, subCount,
        xpRes, revenueData, completionData, mrrData
    ] = await Promise.all([
        db.select({ val: count() }).from(students).where(isNull(students.deleted_at)),
        db.select({ val: count() }).from(students).where(
            and(isNull(students.deleted_at), isNotNull(students.last_active_at),
                sql`${students.last_active_at} >= ${thirtyDaysAgo.toISOString()}`)
        ),
        db.select({
            total: sql`count(*)`,
            active: sql`count(*) filter (where ${schools.is_active} = true)`
        }).from(schools).where(isNull(schools.deleted_at)),
        db.select({
            total: sql`count(*)`,
            published: sql`count(*) filter (where ${courses.is_published} = true)`
        }).from(courses),
        db.select({ val: count() }).from(lessons).where(isNull(lessons.deleted_at)),
        db.select({
            active: sql`count(*) filter (where ${schoolSubscriptions.status} = 'active')`,
            trialing: sql`count(*) filter (where ${schoolSubscriptions.status} = 'trialing')`
        }).from(schoolSubscriptions),
        db.select({ val: sql<number>`sum(${students.cumulative_xp})` }).from(students).where(isNull(students.deleted_at)),
        db.select({ totalRevenue: sql<number>`coalesce(sum(${paymentTransactions.amount}::numeric), 0)` })
            .from(paymentTransactions).where(eq(paymentTransactions.status, 'captured')),
        db.select({ avg: sql<number>`coalesce(avg(case when ${lessonProgress.completed_at} is not null then 1.0 else 0.0 end), 0) * 100` })
            .from(lessonProgress),
        // MRR: sum(plan_price / billing_cycle_months) for all active subscriptions
        db.select({
            price: paymentPlans.price,
            billing_cycle: paymentPlans.billing_cycle,
            sub_count: sql<number>`count(*)`,
        })
        .from(schoolSubscriptions)
        .innerJoin(paymentPlans, eq(schoolSubscriptions.plan_id, paymentPlans.id))
        .where(eq(schoolSubscriptions.status, 'active'))
        .groupBy(paymentPlans.price, paymentPlans.billing_cycle),
    ]);

    const activeSubscriptions = Number((subCount[0] as any).active || 0);
    const trialingSubscriptions = Number((subCount[0] as any).trialing || 0);
    const totalSchools = Number((schData[0] as any).total || 0);
    const activeSchools = Number((schData[0] as any).active || 0);
    const activePlansPercentage = totalSchools > 0 ? Math.round((activeSubscriptions / totalSchools) * 100) : 0;

    const mrr = mrrData.reduce((sum, row) => {
        const price = Number(row.price || 0);
        const months = billingCycleMonths(row.billing_cycle as string);
        const subCount = Number(row.sub_count || 0);
        return sum + (price / months) * subCount;
    }, 0);

    const activeUsers30d = Number(activeStudentCount[0].val);

    const stats: Stats = {
        totalStudents: Number(sCount[0].val),
        activeStudents: activeUsers30d,
        totalSchools,
        activeSchools,
        totalCourses: Number((cData[0] as any).total),
        publishedCourses: Number((cData[0] as any).published),
        totalLessons: Number(lCount[0].val),
        totalXp: Number(xpRes[0].val || 0),
        avgCompletion: Math.round(Number(completionData[0].avg || 0)),
        totalRevenue: Number(revenueData[0].totalRevenue || 0),
        activeSubscriptions,
        trialingSubscriptions,
        activePlansPercentage,
        activeUsers30d,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
        pcu,
        dau,
        mau,
    };

    // Cache everything for 15 min
    analyticsService.syncFromDb({
        total_students: stats.totalStudents,
        active_students: stats.activeStudents,
        active_users_30d: activeUsers30d,
        total_schools: stats.totalSchools,
        total_courses: stats.totalCourses,
        published_courses: stats.publishedCourses,
        total_lessons: stats.totalLessons,
        total_xp: stats.totalXp,
        total_revenue: stats.totalRevenue,
        total_subscriptions: stats.activeSubscriptions,
        trialing_subscriptions: stats.trialingSubscriptions,
        active_plans_pct: stats.activePlansPercentage,
        avg_completion: stats.avgCompletion,
        mrr: stats.mrr,
        last_sync: Date.now()
    }).catch(() => {});

    return stats;
}
