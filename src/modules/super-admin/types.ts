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
    all_classes: boolean;
};

export type Lesson = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    content_type: string;
    content_url: string;
    asset_id?: string | null;
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
    is_popular: boolean;
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

export type PromoCode = {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number | string;
    max_uses: number | null;
    current_uses: number;
    valid_from: Date | string | null;
    valid_until: Date | string | null;
    is_active: boolean;
};

export type RedisHealthMetrics = {
    used_memory: string;
    used_memory_human: string;
    maxmemory: string;
    maxmemory_human: string;
    mem_fragmentation_ratio: number;
    evicted_keys: number;
    keyspace_hits: number;
    keyspace_misses: number;
    hit_ratio: number;
    connected_clients: number;
    blocked_clients: number;
    dbsize: number;
    uptime_in_seconds: number;
    total_commands_processed: number;
    namespace_counts: Record<string, number>;
    leaderboard_health: Array<{ key: string; size: number; is_safe: boolean }>;
    health_score: number;
    alerts: string[];
};

export type ServerHealthMetrics = {
    cpuCount: number;
    loadAvg1m: number;
    loadAvg5m: number;
    loadAvg15m: number;
    totalMemMb: number;
    usedMemMb: number;
    freeMemMb: number;
    memUsagePercent: number;
    uptimeHours: number;
    platform: string;
    arch: string;
    nodeVersion: string;
    nodeEnv: string;
    appUptimeHours: number;
    heapUsedMb: number;
    heapTotalMb: number;
    heapUsagePercent: number;
    cloudflare?: {
        status: string;
        bucket: string;
        pingMs: number;
    };
};

export type DatabaseHealthMetrics = {
    status: string;
    pingMs: number;
    activeConnections: number;
    totalSize: string;
};

export type SystemHealthData = {
    redis: RedisHealthMetrics;
    server: ServerHealthMetrics;
    database: DatabaseHealthMetrics;
};
