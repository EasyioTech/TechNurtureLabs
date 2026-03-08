'use server';

import { db } from '@/lib/db';
import { lessonProgress, courseProgress, quizAttempts, users } from '@/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function getStudentDailyAnalytics() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!currentUser) throw new Error('User not found');

    // 7-day trailing analytics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get completed lessons over last 7 days
    const recentLessons = await db.select({
        date: sql<Date>`DATE(${lessonProgress.updated_at})`,
        count: sql<number>`count(*)::integer`,
        xp: sql<number>`sum(${lessonProgress.xp_earned})::integer`
    }).from(lessonProgress)
        .where(and(
            eq(lessonProgress.user_id, userId),
            gte(lessonProgress.updated_at, sevenDaysAgo)
        ))
        .groupBy(sql`DATE(${lessonProgress.updated_at})`)
        .orderBy(sql`DATE(${lessonProgress.updated_at})`);

    // Get recent quiz grades
    const recentQuizzes = await db.select({
        date: sql<Date>`DATE(${quizAttempts.completed_at})`,
        avgScore: sql<number>`avg((${quizAttempts.score}::float / ${quizAttempts.max_score}::float) * 100)::integer`
    }).from(quizAttempts)
        .where(and(
            eq(quizAttempts.user_id, userId),
            gte(quizAttempts.completed_at, sevenDaysAgo)
        ))
        .groupBy(sql`DATE(${quizAttempts.completed_at})`);

    // Combine into a 7 day array mapping
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateStr = targetDate.toISOString().split('T')[0];

        // Find matches
        const lessonMatch = recentLessons.find(l => (l.date as unknown as string).startsWith(dateStr));
        const quizMatch = recentQuizzes.find(q => (q.date as unknown as string).startsWith(dateStr));

        chartData.push({
            date: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
            lessons: lessonMatch ? (lessonMatch.count || 0) : 0,
            xp: lessonMatch ? (lessonMatch.xp || 0) : 0,
            accuracy: quizMatch ? (quizMatch.avgScore || 0) : 0
        });
    }

    // Totals for the week
    const weeklyLessons = chartData.reduce((a, b) => a + b.lessons, 0);
    const weeklyXp = chartData.reduce((a, b) => a + b.xp, 0);
    const accuracies = chartData.filter(d => d.accuracy > 0).map(d => d.accuracy);
    const avgWeeklyAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

    return {
        profile: {
            xp: Number(currentUser.cumulative_xp) || 0,
            level: Math.floor((Number(currentUser.cumulative_xp) || 0) / 1000) + 1,
            longest_streak: currentUser.longest_streak || 0
        },
        chartData,
        summary: {
            weeklyLessons,
            weeklyXp,
            avgWeeklyAccuracy
        }
    };
}
