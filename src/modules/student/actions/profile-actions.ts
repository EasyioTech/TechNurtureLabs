'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, achievements, userAchievements, lessonProgress, quizAttempts } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getStudentProfileData() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const profile = await db.query.users.findFirst({
        where: eq(users.id, session.userId)
    });

    const allAchievements = await db.query.achievements.findMany();
    const userAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, session.userId)
    });

    const unlockedMap = new Map(userAchvs.map(ua => [ua.achievement_id, ua.earned_at]));

    const formattedAchievements = allAchievements.map(a => ({
        ...a,
        // Backward-compatible aliases
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

    const usersWithMoreXp = await db.select().from(users).where(and(gt(users.cumulative_xp, Number(profile?.cumulative_xp) || 0), eq(users.role, 'student')));
    const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'student'));
    const rank = usersWithMoreXp.length + 1;
    const rankPercentage = Math.max(1, Math.round((rank / (totalStudents[0]?.count || 1)) * 100));

    const lessonsData = await db.select({
        count: sql<number>`count(*)`,
        total_time: sql<number>`sum(${lessonProgress.time_spent_secs})`
    }).from(lessonProgress).where(and(eq(lessonProgress.user_id, session.userId), sql`${lessonProgress.completed_at} is not null`));

    const quizzesData = await db.select({
        count: sql<number>`count(*)`
    }).from(quizAttempts).where(and(eq(quizAttempts.user_id, session.userId), eq(quizAttempts.passed, true)));

    const stats = {
        xp: Number(profile?.cumulative_xp) || 0,
        streak: profile?.current_streak || 0,
        level: Math.floor((Number(profile?.cumulative_xp) || 0) / 1000) + 1,
        lessonsCompleted: Number(lessonsData[0]?.count) || 0,
        learningTimeMinutes: Math.floor((Number(lessonsData[0]?.total_time) || 0) / 60),
        quizzesPassed: Number(quizzesData[0]?.count) || 0
    };

    return {
        profile: profile ? {
            ...profile,
            // Backward-compatible aliases
            full_name: `${profile.first_name} ${profile.last_name}`,
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
        rankPercentage
    };
}

export async function updateStudentBio(bio: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(users).set({ bio }).where(eq(users.id, session.userId));
    revalidatePath('/student/profile');
}

export async function updateStudentProfile(data: {
    first_name: string;
    last_name: string;
    bio: string;
    phone?: string | null;
}) {
    const session = await verifySession();
    if (!session) return;
    await db.update(users).set({
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        phone: data.phone
    }).where(eq(users.id, session.userId));
    revalidatePath('/student/profile');
}

export async function updateStudentAvatar(avatarStyle: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(users).set({ avatar_url: avatarStyle }).where(eq(users.id, session.userId));
    revalidatePath('/student/profile');
    revalidatePath('/student');
}
