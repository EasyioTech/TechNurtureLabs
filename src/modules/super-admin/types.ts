export type Course = {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    published: boolean;
    created_at: Date | string;
    lesson_count?: number;
    enrolled_count?: number;
    grade?: number | null;
    all_grades?: boolean;
};

export type MCQQuestion = {
    question: string;
    options: string[];
    correct_answer: number;
};

export type Lesson = {
    id: string;
    course_id: string;
    title: string;
    sequence_index: number;
    content_type: string;
    content_url: string;
    xp_reward: number;
    duration: number;
    mcq_questions?: MCQQuestion[];
    file_path?: string;
};

export type PaymentPlan = {
    id: string;
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: string[];
    max_students: number | null;
    max_courses: number | null;
    is_active: boolean;
};

export type Stats = {
    totalStudents: number;
    activeStudents: number;
    totalSchools: number;
    totalCourses: number;
    totalLessons: number;
    totalXp: number;
    avgCompletion: number;
    monthlyRevenue: number;
};

export type UserMetric = {
    id: string;
    full_name: string;
    school_name: string;
    total_xp: number;
    level: number;
    current_streak: number;
    lessons_completed: number;
    last_activity: string | null;
};

export type CourseMetric = {
    id: string;
    title: string;
    lesson_count: number;
    enrolled_count: number;
    completion_rate: number;
    avg_score: number;
};
