// School Admin Types

export type SchoolStats = {
    totalStudents: number;
    activeStudents: number;   // active in last 7 days
    avgXp: number;
    totalXp: number;
    enrolledCourses: number;
    totalLessonsCompleted: number;
    totalQuizzesTaken: number;
    avgCompletionRate: number;
    pendingStudents: number;
    planName: string | null;
    subscriptionStatus: string | null;
    planExpiry: string | null;
};

export type SchoolStudentMetric = {
    id: string;
    full_name: string;
    email: string;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    lessons_completed: number;
    is_active: boolean;
    last_active_at: string | null;
    class_name?: string;
};

export type SchoolCourseMetric = {
    id: string;
    title: string;
    thumbnail_url: string | null;
    is_published: boolean;
    lesson_count: number;
    enrolled_count: number;
    completion_rate: number;
    avg_xp: number;
    total_time_mins: number;
    mapped_classes: string[];
    description: string | null;
};

export type SchoolLeaderboardEntry = {
    rank: number;
    id: string;
    full_name: string;
    email: string;
    total_xp: number;
    level: number;
    current_streak: number;
    lessons_completed: number;
};
