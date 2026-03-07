export type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    totalLessons: number;
    completedLessons: number;
    class?: number | null;
    all_classes?: boolean;
};

export type UserProfile = {
    id: string;
    full_name: string;
    email: string;
    className: string | null;
    total_xp: number;
    level: number;
    current_streak: number;
    total_lessons_completed: number;
    total_learning_time_minutes: number;
    longest_streak: number;
};

export type DailyChallenge = {
    id: string;
    title: string;
    challenge_type: string;
    target_value: number;
    xp_reward: number;
    icon: string;
    current_progress: number;
    is_completed: boolean;
};

export type Achievement = {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocked: boolean;
    unlocked_at?: string;
};
