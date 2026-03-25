'use server';

import { db } from '@/lib/db';
import { 
    students, schools, courses, lessons, 
    enrollments, schoolSubscriptions, paymentTransactions, 
    lessonProgress 
} from '@/db/schema';
import { eq, count, sql, isNull, inArray } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Stats } from '../../types';

import { analyticsService } from '@/lib/services/analytics-service';

export async function fetchAdminStats(): Promise<Stats> {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        redirect('/admin-portal/login');
    }

    // 1. Attempt to fetch from high-performance Redis counters
    const redisStats: any = await analyticsService.getGlobalStats();
    
    // Check if cache exists and hasn't explicitly expired (using a 'last_sync' key)
    const lastSync = Number(redisStats.last_sync || 0);
    const CACHE_MINUTES = 15; // Only refresh from DB every 15 mins max
    const isCacheWarm = redisStats.total_students && (Date.now() - lastSync < CACHE_MINUTES * 60 * 1000);

    if (isCacheWarm) {
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
        };
    }

    // 2. Fallback to SQL (only if cache is stale or missing)
    console.log('[Dashboard] Refreshing global stats from DB...');
    const [
        sCount, schData, cData, lCount, subCount, xpRes, revenueData, completionData
    ] = await Promise.all([
        db.select({ val: count() }).from(students).where(isNull(students.deleted_at)),
        db.select({ 
            total: sql`count(*)`, 
            active: sql`count(*) filter (where ${schools.is_active} = true)` 
        }).from(schools),
        db.select({ 
            total: sql`count(*)`, 
            published: sql`count(*) filter (where ${courses.is_published} = true)` 
        }).from(courses),
        db.select({ val: count() }).from(lessons).where(isNull(lessons.deleted_at)),
        db.select({ 
            active: sql`count(distinct ${schoolSubscriptions.school_id}) filter (where ${paymentTransactions.status} = 'captured' and ${schoolSubscriptions.status} = 'active')`,
            trialing: sql`count(*) filter (where ${schoolSubscriptions.status} = 'trialing')`
        }).from(schoolSubscriptions)
          .leftJoin(paymentTransactions, eq(schoolSubscriptions.school_id, paymentTransactions.school_id)),
        db.select({ val: sql<number>`sum(${students.cumulative_xp})` }).from(students).where(isNull(students.deleted_at)),
        db.select({ totalRevenue: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)` }).from(paymentTransactions).where(eq(paymentTransactions.status, 'captured')),
        db.select({ avg: sql<number>`coalesce(avg(case when ${lessonProgress.completed_at} is not null then 1.0 else 0.0 end), 0) * 100` }).from(lessonProgress)
    ]);

    const activeSubscriptions = Number((subCount[0] as any).active || 0);
    const trialingSubscriptions = Number((subCount[0] as any).trialing || 0);
    const totalSchools = Number((schData[0] as any).total || 0);
    const activeSchools = Number((schData[0] as any).active || 0);
    const activePlansPercentage = totalSchools > 0 ? Math.round((activeSubscriptions / totalSchools) * 100) : 0;

    const stats: Stats = {
        totalStudents: Number(sCount[0].val),
        activeStudents: 0, 
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
        activePlansPercentage
    };

    // Cache with a 'last_sync' timestamp to prevent constant DB hammering
    analyticsService.syncFromDb({
        total_students: stats.totalStudents,
        total_schools: stats.totalSchools,
        total_courses: stats.totalCourses,
        total_lessons: stats.totalLessons,
        total_xp: stats.totalXp,
        total_revenue: stats.totalRevenue,
        total_subscriptions: stats.activeSubscriptions,
        trialing_subscriptions: stats.trialingSubscriptions,
        active_plans_pct: stats.activePlansPercentage,
        avg_completion: stats.avgCompletion,
        last_sync: Date.now()
    }).catch(() => {});

    return stats;
}
