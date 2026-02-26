import { pgTable, text, timestamp, boolean, integer, uuid, primaryKey, numeric, jsonb } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    full_name: text('full_name').notNull(),
    role: text('role').notNull(), // 'student', 'school_admin', 'super_admin'
    school_id: uuid('school_id'),
    class_id: uuid('class_id'),
    grade: integer('grade'),
    bio: text('bio'),
    total_xp: integer('total_xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    current_streak: integer('current_streak').default(0).notNull(),
    longest_streak: integer('longest_streak').default(0).notNull(),
    total_lessons_completed: integer('total_lessons_completed').default(0).notNull(),
    total_learning_time_minutes: integer('total_learning_time_minutes').default(0).notNull(),
    avatar_style: text('avatar_style'),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    last_login: timestamp('last_login'),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const schools = pgTable('schools', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    udise_code: text('udise_code'),
    address: text('address'),
    district: text('district'),
    state: text('state'),
    pincode: text('pincode'),
    school_type: text('school_type'),
    grades_available: integer('grades_available').array(),
    student_count: integer('student_count').default(0),
    contact_email: text('contact_email'),
    contact_phone: text('contact_phone'),
    principal_name: text('principal_name'),
    branding_config: jsonb('branding_config'),
    is_approved: boolean('is_approved').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const classes = pgTable('classes', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    level_index: integer('level_index').notNull(),
    school_id: uuid('school_id').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const paymentPlans = pgTable('payment_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: numeric('price').notNull(),
    billing_cycle: text('billing_cycle').notNull(),
    features: text('features').array(),
    max_students: integer('max_students'),
    max_courses: integer('max_courses'),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const courses = pgTable('courses', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'),
    grade: integer('grade'),
    all_grades: boolean('all_grades').default(false).notNull(),
    published: boolean('published').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const lessons = pgTable('lessons', {
    id: uuid('id').defaultRandom().primaryKey(),
    course_id: uuid('course_id').references(() => courses.id).notNull(),
    title: text('title').notNull(),
    sequence_index: integer('sequence_index').notNull(),
    content_type: text('content_type').notNull(), // 'video', 'mcq', 'ppt'
    content_url: text('content_url'),
    duration: integer('duration').default(10).notNull(),
    xp_reward: integer('xp_reward').default(50).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const progressTracking = pgTable('progress_tracking', {
    user_id: uuid('user_id').references(() => profiles.id).notNull(),
    lesson_id: uuid('lesson_id').references(() => lessons.id).notNull(),
    last_position: numeric('last_position'),
    status: text('status').default('locked').notNull(), // 'locked', 'available', 'completed'
    score: integer('score'),
    completed_at: timestamp('completed_at'),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.lesson_id] }),
    };
});

export const dailyChallenges = pgTable('daily_challenges', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    challenge_type: text('challenge_type').notNull(), // 'lessons_completed', 'learning_time'
    target_value: integer('target_value').notNull(),
    xp_reward: integer('xp_reward').notNull(),
    icon: text('icon').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const userDailyChallenges = pgTable('user_daily_challenges', {
    user_id: uuid('user_id').references(() => profiles.id).notNull(),
    challenge_id: uuid('challenge_id').references(() => dailyChallenges.id).notNull(),
    challenge_date: text('challenge_date').notNull(), // e.g. '2023-11-20'
    current_progress: integer('current_progress').default(0).notNull(),
    is_completed: boolean('is_completed').default(false).notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.challenge_id, table.challenge_date] }),
    };
});

export const achievements = pgTable('achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    category: text('category').notNull(),
    is_hidden: boolean('is_hidden').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
    user_id: uuid('user_id').references(() => profiles.id).notNull(),
    achievement_id: uuid('achievement_id').references(() => achievements.id).notNull(),
    unlocked_at: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.achievement_id] }),
    };
});
