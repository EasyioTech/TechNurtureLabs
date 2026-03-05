export type Course = {
    id: string;
    title: string;
    slug?: string;
    description: string | null;
    thumbnail_url: string | null;
    thumbnail?: string | null;
    is_published: boolean;
    published?: boolean;
    total_lessons: number;
    total_xp: number;
    created_by?: string;
    created_at: Date | string;
    lesson_count?: number;
    enrolled_count?: number;
};

export type Lesson = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    content_type: string;
    content_url: string;
    sequence_order: number;
    sequence_index?: number;
    duration_minutes: number;
    duration?: number;
    xp_reward: number;
    is_published: boolean;
    file_path?: string;
};

export type PaymentPlan = {
    id: string;
    name: string;
    description: string;
    billing_cycle: string;
    price: number;
    currency: string;
    max_students: number | null;
    trial_days: number;
    features: string[];
    is_active: boolean;
};

export type SchoolInfo = {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    pincode: string | null;
    logo_url: string | null;
    website: string | null;
    is_active: boolean;
    data_processing_consent: boolean;
    minor_data_guardian_consent: boolean;
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
    publishedCourses: number;
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
    email: string;
    school_name: string;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    lessons_completed: number;
    last_activity: string | null;
};

export type CourseMetric = {
    id: string;
    title: string;
    is_published: boolean;
    lesson_count: number;
    enrolled_count: number;
    completion_rate: number;
    avg_xp: number;
    total_time_mins: number;
};
