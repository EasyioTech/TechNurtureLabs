export type Student = {
    id: string;
    full_name: string;
    total_xp: number;
    current_streak: number;
    level: number;
    class_id: string;
    class_name?: string;
    last_activity_date: string | null;
    progress?: number;
    status: 'active' | 'inactive' | 'graduating';
};

export type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    published: boolean;
    lesson_count: number;
    enrolled_count: number;
};

export type ClassData = {
    id: string;
    name: string;
    level_index: number;
    student_count: number;
};

export type StatsData = {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    totalLessons: number;
    avgProgress: number;
    totalXpEarned: number;
};

export type RecentActivity = {
    id: string;
    action: string;
    user: string;
    time: string;
    icon: any;
    color: string;
};

export type ClassProgressData = {
    name: string;
    progress: number;
    studentCount: number;
};
