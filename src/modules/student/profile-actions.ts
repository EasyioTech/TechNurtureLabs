'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { profiles, achievements, userAchievements } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function getStudentProfileData() {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, session.userId)
    });

    const allAchievements = await db.query.achievements.findMany();
    const userAchvs = await db.query.userAchievements.findMany({
        where: eq(userAchievements.user_id, session.userId)
    });

    const unlockedMap = new Map(userAchvs.map(ua => [ua.achievement_id, ua.unlocked_at]));

    const formattedAchievements = allAchievements.map(a => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id)
    }));

    formattedAchievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });

    const usersWithMoreXp = await db.select().from(profiles).where(and(gt(profiles.total_xp, profile?.total_xp || 0), eq(profiles.role, 'student')));
    const rank = usersWithMoreXp.length + 1;

    return { profile, achievements: formattedAchievements, rank };
}

export async function updateStudentBio(bio: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(profiles).set({ bio }).where(eq(profiles.id, session.userId));
}

export async function updateStudentAvatar(avatarStyle: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(profiles).set({ avatar_style: avatarStyle }).where(eq(profiles.id, session.userId));
}
