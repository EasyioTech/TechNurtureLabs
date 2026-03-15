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
    const redisStats = await analyticsService.getGlobalStats();
    
    // Check for "well-known" keys to determine if cache is warm
    if (redisStats && redisStats.total_students) {
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
            totalEnrollments: Number(redisStats.total_enrollments || 0),
        };
    }

    // 2. Fallback to SQL and Warm up the Redis cache (Lazy Sync)
    const [
        sCount,
        schData,
        cData,
        lCount,
        eCount,
        subCount,
        xpRes,
        revenueData,
        completionData
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
        db.select({ val: count() }).from(lessons),
        db.select({ val: count() }).from(enrollments),
        db.select({ val: count() }).from(schoolSubscriptions).where(inArray(schoolSubscriptions.status, ['active', 'trialing'])),
        db.select({ val: sql<number>`sum(${students.cumulative_xp})` }).from(students).where(isNull(students.deleted_at)),
        db.select({ totalRevenue: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)` })
            .from(paymentTransactions)
            .where(eq(paymentTransactions.status, 'captured')),
        db.select({
            avg: sql<number>`coalesce(avg(case when ${lessonProgress.completed_at} is not null then 1.0 else 0.0 end), 0) * 100`
        }).from(lessonProgress)
    ]);

    const stats = {
        totalStudents: Number(sCount[0].val),
        activeStudents: 0, 
        totalSchools: Number((schData[0] as any).total),
        activeSchools: Number((schData[0] as any).active),
        totalCourses: Number((cData[0] as any).total),
        publishedCourses: Number((cData[0] as any).published),
        totalLessons: Number(lCount[0].val),
        totalXp: Number(xpRes[0].val || 0),
        avgCompletion: Math.round(Number(completionData[0].avg || 0)),
        totalRevenue: Number(revenueData[0].totalRevenue || 0),
        activeSubscriptions: Number(subCount[0].val),
        totalEnrollments: Number(eCount[0].val),
    };

    // Cache for future loads
    analyticsService.syncFromDb({
        total_students: stats.totalStudents,
        total_schools: stats.totalSchools,
        total_courses: stats.totalCourses,
        total_lessons: stats.totalLessons,
        total_xp: stats.totalXp,
        total_revenue: stats.totalRevenue,
        total_subscriptions: stats.activeSubscriptions,
        total_enrollments: stats.totalEnrollments,
        avg_completion: stats.avgCompletion
    }).catch(() => {});

    return stats;
}
