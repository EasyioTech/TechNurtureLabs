/**
 * Pure Utility for Streak Calculation 
 * DO NOT add 'use server' here as it's used synchronously 
 */
export function calculateTrueStreak(user: any): number {
    let activeStreak = user.current_streak || 0;
    if (user.last_active_at && activeStreak > 0) {
        const lastDate = new Date(user.last_active_at);
        lastDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) activeStreak = 0;
    }
    return activeStreak;
}
