export type Course = {
    id: string;
    title: string;
    slug?: string;
    description: string | null;
    thumbnail: string | null;
    thumbnail_url?: string | null;
    published: boolean;
    is_published?: boolean;
    created_at: Date | string;
    lesson_count?: number;
    enrolled_count?: number;
    total_xp?: number;
    created_by?: string;
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
    sequence_order?: number;
    content_type: string;
    content_url: string;
    xp_reward: number;
    duration: number;
    duration_minutes?: number;
    mcq_questions?: MCQQuestion[];
    file_path?: string;
    is_published?: boolean;
};

export type PaymentPlan = {
    id: string;
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: string[];
    max_students: number | null;
    trial_days?: number;
    is_active: boolean;
};

export type SchoolInfo = {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    city: string | null;
    state: string | null;
    is_active: boolean;
    created_at: Date | string;
    subscription_status?: string | null;
    plan_name?: string | null;
    student_count?: number;
};

export type Stats = {
    totalStudents: number;
    activeStudents: number;
    totalSchools: number;
    activeSchools: number;
    totalCourses: number;
    totalLessons: number;
    totalXp: number;
    avgCompletion: number;
    totalRevenue: number;
    activeSubscriptions: number;
    totalEnrollments: number;
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
    avg_xp: number;
};
