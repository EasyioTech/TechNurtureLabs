'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { students, schools, achievements, userAchievements, lessonProgress, quizAttempts, studentAcademicRecords, xpEvents } from '@/db/schema';
import { eq, and, gt, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';
import { redis } from '@/lib/redis';

export async function getStudentProfileData() {
    const session = await verifySession();
    if (!session) {
        // Return null instead of redirect — redirect() throws errors that bypass Promise.all().catch()
        // Dashboard page checks statsData and handles redirect properly
        return null;
    }

    // CACHING FIX #2: Try Redis cache first (3 min TTL)
    const cacheKey = `profile:${session.userId}`;
    let cached: string | null = null;
    try {
        cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Profile] Redis cache fetch error:', (err as any).message);
    }

    const profile = await db.query.students.findFirst({
        where: and(eq(students.id, session.userId), sql`${students.deleted_at} IS NULL`, eq(students.is_active, true)),
        with: {
            academicRecords: {
                where: eq(studentAcademicRecords.user_id, session.userId),
                with: {
                    academicClass: true
                },
                limit: 1
            }
        }
    });

    const allAchievements = await db.query.achievements.findMany();
    const userAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, session.userId)
    });

    const unlockedMap = new Map(userAchvs.map(ua => [ua.achievement_id, ua.earned_at]));

    const formattedAchievements = allAchievements.map(a => ({
        ...a,
        icon: a.icon_url || '',
        category: a.tier,
        is_hidden: false,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id)
    }));

    formattedAchievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });

    // Calculate rank at school level
    const schoolFilter = profile?.school_id
        ? eq(students.school_id, profile.school_id)
        : sql`${students.school_id} IS NULL`;

    const studentsWithMoreXpResult = await db.select({ count: sql<number>`count(*)` })
        .from(students)
        .where(
            and(
                gt(students.cumulative_xp, Number(profile?.cumulative_xp) || 0),
                schoolFilter
            )
        );

    const totalSchoolStudentsResult = await db.select({ count: sql<number>`count(*)` })
        .from(students)
        .where(schoolFilter);

    const totalSchoolStudents = Number(totalSchoolStudentsResult[0]?.count) || 1;
    const rank = (Number(studentsWithMoreXpResult[0]?.count) || 0) + 1;
    const rankPercentage = Math.min(100, Math.max(1, Math.round((rank / totalSchoolStudents) * 100)));

    const lessonsData = await db.select({
        count: sql<number>`count(*)`,
        total_time: sql<number>`sum(${lessonProgress.time_spent_secs})`
    }).from(lessonProgress).where(and(eq(lessonProgress.user_id, session.userId), sql`${lessonProgress.completed_at} is not null`));

    // Get all quiz attempts to calculate accuracy (as percentage) and pass rate
    const quizStats = await db.select({
        count: sql<number>`count(*)`,
        passed: sql<number>`count(*) filter (where ${quizAttempts.passed} = true)`,
        avgScore: sql<number>`avg(${quizAttempts.score}::float / NULLIF(${quizAttempts.max_score}::float, 0) * 100)`
    }).from(quizAttempts).where(eq(quizAttempts.user_id, session.userId));

    const totalAttempts = Number(quizStats[0]?.count) || 0;
    const passedAttempts = Number(quizStats[0]?.passed) || 0;
    const avgScore = Math.round(Number(quizStats[0]?.avgScore) || 0);

    const lessonsCompleted = Number(lessonsData[0]?.count) || 0;
    const xpNum = Number(profile?.cumulative_xp) || 0;
    const efficiency = lessonsCompleted > 0 ? Math.min(100, Math.round((xpNum / (lessonsCompleted * 50)) * 100)) : 0;

    const stats = {
        xp: xpNum,
        streak: profile?.current_streak || 0,
        level: Math.floor(xpNum / 1000) + 1,
        lessonsCompleted: lessonsCompleted,
        learningTimeMinutes: Math.floor((Number(lessonsData[0]?.total_time) || 0) / 60),
        quizzesPassed: passedAttempts,
        accuracy: avgScore, // Using average score as 'Score'
        efficiency: efficiency,
        rank: rank,
        rankPercentage: rankPercentage
    };

    const school = profile?.school_id
        ? await db.query.schools.findFirst({
            where: eq(schools.id, profile.school_id),
            columns: { id: true, name: true, logo_url: true }
          })
        : null;

    const result = {
        profile: profile ? {
            ...profile,
            className: (profile.academicRecords?.[0] as any)?.academicClass?.name || 'Unassigned',
            full_name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Student',
            total_xp: Number(profile.cumulative_xp),
            level: stats.level,
            bio: profile.bio || '',
            avatar_style: profile.avatar_url,
            total_lessons_completed: stats.lessonsCompleted,
            total_quizzes_completed: stats.quizzesPassed,
            total_learning_time_minutes: stats.learningTimeMinutes,
        } : null,
        stats,
        achievements: formattedAchievements,
        rank,
        rankPercentage,
        school: school ?? null,
    };

    // CACHING FIX #2: Cache for 3 minutes
    try {
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 180);
    } catch (err) {
        console.warn('[Profile] Redis cache set error:', (err as any).message);
    }

    return result;
}

export async function updateStudentBio(bio: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/login');
    }
    await db.update(students).set({ bio }).where(eq(students.id, session.userId));

    // CRITICAL FIX #4: Invalidate profile cache after update
    try {
        await redis.del(`profile:${session.userId}`);
        await redis.del(`achievements:${session.userId}`);
        await cacheService.invalidateTag(`user:${session.userId}:profile`);
        await cacheService.invalidateTag(`user:${session.userId}:dashboard`);
    } catch (err) {
        console.warn('[Profile] Cache invalidation error:', (err as any).message);
    }

    revalidatePath('/student/profile');
}

export async function updateStudentProfile(data: {
    first_name: string;
    last_name: string;
    bio: string;
    phone?: string | null;
}) {
    const session = await verifySession();
    if (!session) {
        redirect('/login');
    }
    await db.update(students).set({
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        phone: data.phone
    }).where(eq(students.id, session.userId));

    try {
        const { checkAndAwardAchievements } = await import('@/modules/student/actions/achievement-actions');
        await checkAndAwardAchievements();
    } catch (e) { }

    // CRITICAL FIX #4: Invalidate profile cache after update
    try {
        await redis.del(`profile:${session.userId}`);
        await redis.del(`achievements:${session.userId}`);
        await cacheService.invalidateTag(`user:${session.userId}:profile`);
        await cacheService.invalidateTag(`user:${session.userId}:dashboard`);
        await cacheService.invalidateTag(`user:${session.userId}:stats`);
    } catch (err) {
        console.warn('[Profile] Cache invalidation error:', (err as any).message);
    }

    revalidatePath('/student/profile');
}

export async function updateStudentAvatar(avatarStyle: string) {
    const session = await verifySession();
    if (!session) {
        redirect('/login');
    }
    await db.update(students).set({ avatar_url: avatarStyle }).where(eq(students.id, session.userId));

    // CRITICAL FIX #4: Invalidate profile cache after update
    try {
        await redis.del(`profile:${session.userId}`);
        await redis.del(`achievements:${session.userId}`);
        await cacheService.invalidateTag(`user:${session.userId}:profile`);
        await cacheService.invalidateTag(`user:${session.userId}:dashboard`);
    } catch (err) {
        console.warn('[Profile] Cache invalidation error:', (err as any).message);
    }

    revalidatePath('/student/profile');
    revalidatePath('/student');
}

/**
 * Fetch recent student activities from audit logs and XP events
 */
export async function getStudentActivitiesAction() {
    const session = await verifySession();
    if (!session) return [];
    
    // Fetch XP events as a proxy for activity
    const activities = await db.query.xpEvents.findMany({
        where: eq(xpEvents.user_id, session.userId),
        orderBy: [desc(xpEvents.created_at)],
        limit: 10
    });

    return activities.map(a => ({
        id: a.id,
        type: a.source,
        description: `Earned ${a.xp_amount} XP from ${a.source.replace(/_/g, ' ')}`,
        timestamp: a.created_at
    }));
}

/**
 * Request account deletion (soft delete)
 */
export async function deleteStudentAccountAction() {
    const session = await verifySession();
    if (!session) redirect('/login');

    await db.update(students)
        .set({ deleted_at: new Date() })
        .where(eq(students.id, session.userId));
    
    // In a real app, you'd also sign out
    redirect('/login?deleted=true');
}

// Aliases for better ergonomics in dashboard
export const getStudentProfileAndStats = getStudentProfileData;
