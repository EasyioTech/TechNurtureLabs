'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { users, achievements, userAchievements } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

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
    const rank = usersWithMoreXp.length + 1;

    return {
        profile: profile ? {
            ...profile,
            // Backward-compatible aliases
            full_name: `${profile.first_name} ${profile.last_name}`,
            total_xp: Number(profile.cumulative_xp),
            level: Math.floor((Number(profile.cumulative_xp) || 0) / 500) + 1,
            bio: '',
            avatar_style: profile.avatar_url,
        } : null,
        achievements: formattedAchievements,
        rank
    };
}

export async function updateStudentBio(bio: string) {
    const session = await verifySession();
    if (!session) return;
    // bio field not in new schema - store as no-op for now
}

export async function updateStudentAvatar(avatarStyle: string) {
    const session = await verifySession();
    if (!session) return;
    await db.update(users).set({ avatar_url: avatarStyle }).where(eq(users.id, session.userId));
}
