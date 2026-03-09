'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { students, achievements, userAchievements, lessonProgress, quizAttempts, studentAcademicRecords } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getStudentProfileData() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const profile = await db.query.students.findFirst({
        where: eq(students.id, session.userId),
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

    const studentsWithMoreXp = await db.select().from(students).where(
        and(
            gt(students.cumulative_xp, Number(profile?.cumulative_xp) || 0),
            schoolFilter
        )
    );

    const totalSchoolStudentsResult = await db.select({ count: sql<number>`count(*)` })
        .from(students)
        .where(schoolFilter);

    const totalSchoolStudents = Number(totalSchoolStudentsResult[0]?.count) || 1;
    const rank = studentsWithMoreXp.length + 1;
    const rankPercentage = Math.min(100, Math.max(1, Math.round((rank / totalSchoolStudents) * 100)));

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
            className: (profile.academicRecords?.[0] as any)?.academicClass?.name || 'Unassigned',
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
    await db.update(students).set({ bio }).where(eq(students.id, session.userId));
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

    revalidatePath('/student/profile');
}

export async function updateStudentAvatar(avatarStyle: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(students).set({ avatar_url: avatarStyle }).where(eq(students.id, session.userId));
    revalidatePath('/student/profile');
    revalidatePath('/student');
}
