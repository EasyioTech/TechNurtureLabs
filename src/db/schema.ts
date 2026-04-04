import {
    pgTable, pgEnum,
    text, timestamp, boolean, integer, bigint, numeric, jsonb, uuid, date, inet,
    uniqueIndex, index, check, primaryKey
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// ENUM TYPES
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'school_admin', 'student']);
export const userTypeEnum = pgEnum('user_type', ['super_admin', 'school_admin', 'student']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'trialing', 'past_due', 'cancelled', 'expired']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'quarterly', 'semi_annual', 'annual']);
export const paymentStatusEnum = pgEnum('payment_status', ['created', 'authorized', 'captured', 'failed', 'refunded']);
export const lessonContentTypeEnum = pgEnum('lesson_content_type', ['video', 'ppt', 'pdf', 'quiz']);
export const questionTypeEnum = pgEnum('question_type', ['mcq', 'true_false', 'fill_blank', 'multi_select']);
export const xpSourceEnum = pgEnum('xp_source', ['lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment']);
export const achievementTierEnum = pgEnum('achievement_tier', ['bronze', 'silver', 'gold', 'platinum']);
export const challengeStatusEnum = pgEnum('challenge_status', ['active', 'completed', 'expired']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion', 'pin_reset_request']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'void', 'overdue']);
export const storageTypeEnum = pgEnum('storage_type', ['r2', 'local']);
export const assetTypeEnum = pgEnum('asset_type', ['video', 'image', 'document']);
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);

// ============================================================================
// CORE TENANT TABLES
// ============================================================================

export const schools = pgTable('schools', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    email: text('email').notNull(),
    phone: text('phone'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    country: text('country').notNull().default('IN'),
    pincode: text('pincode'),
    logo_url: text('logo_url'),
    website: text('website'),
    is_active: boolean('is_active').notNull().default(true),
    data_processing_consent: boolean('data_processing_consent').notNull().default(false),
    minor_data_guardian_consent: boolean('minor_data_guardian_consent').notNull().default(false),
    udise_code: text('udise_code'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

export const academicSessions = pgTable('academic_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    start_date: date('start_date').notNull(),
    end_date: date('end_date').notNull(),
    is_current: boolean('is_current').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// USER SYSTEM (specialized)
// ============================================================================

export const superAdmins = pgTable('super_admins', {
    id: uuid('id').defaultRandom().primaryKey(),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    avatar_url: text('avatar_url'),
    two_factor_secret: text('two_factor_secret'),
    two_factor_enabled: boolean('two_factor_enabled').notNull().default(false),
    two_factor_backup_codes: jsonb('two_factor_backup_codes').notNull().default([]),
    is_active: boolean('is_active').notNull().default(true),
    last_active_at: timestamp('last_active_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

export const schoolAdmins = pgTable('school_admins', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email'),
    password_hash: text('password_hash').notNull(),
    phone: text('phone'),
    avatar_url: text('avatar_url'),
    is_active: boolean('is_active').notNull().default(true),
    last_active_at: timestamp('last_active_at', { withTimezone: true }),
    bio: text('bio'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    uniqueIndex('uq_school_admins_email')
        .on(table.email)
        .where(sql`deleted_at IS NULL`),
    index('idx_school_admins_school').on(table.school_id),
]);

export const students = pgTable('students', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email'),
    password_hash: text('password_hash').notNull(), // Student PIN
    phone: text('phone'),
    avatar_url: text('avatar_url'),
    bio: text('bio'),
    date_of_birth: date('date_of_birth'),
    gender: text('gender'),
    is_minor: boolean('is_minor').notNull().default(false),
    guardian_name: text('guardian_name'),
    guardian_email: text('guardian_email'),
    guardian_consent: boolean('guardian_consent').notNull().default(false),
    cumulative_xp: bigint('cumulative_xp', { mode: 'number' }).notNull().default(0),
    current_streak: integer('current_streak').notNull().default(0),
    longest_streak: integer('longest_streak').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    is_verified: boolean('is_verified').notNull().default(false),
    last_active_at: timestamp('last_active_at', { withTimezone: true }),
    // ISSUE 26: Persistence for student preferences
    notification_preferences: jsonb('notification_preferences').notNull().default({
        mobile_push: true,
        email_reports: true,
        new_content: true
    }),
    appearance_settings: jsonb('appearance_settings').notNull().default({
        dark_mode: false
    }),
    privacy_settings: jsonb('privacy_settings').notNull().default({
        public_profile: true
    }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    uniqueIndex('uq_students_email')
        .on(table.email)
        .where(sql`deleted_at IS NULL`),
    uniqueIndex('uq_students_phone')
        .on(table.phone)
        .where(sql`deleted_at IS NULL`),
    index('idx_students_school').on(table.school_id),
    index('idx_students_xp').on(table.cumulative_xp),
]);

// ============================================================================
// PAYMENT & SUBSCRIPTION
// ============================================================================

export const paymentPlans = pgTable('payment_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    billing_cycle: billingCycleEnum('billing_cycle').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('INR'),
    max_students: integer('max_students'),
    features: jsonb('features').notNull().default({}),
    is_active: boolean('is_active').notNull().default(true),
    is_popular: boolean('is_popular').notNull().default(false),
    trial_days: integer('trial_days').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    uniqueIndex('uq_payment_plans_name')
        .on(table.name)
        .where(sql`deleted_at IS NULL`),
]);

export const promoCodes = pgTable('promo_codes', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    discount_type: discountTypeEnum('discount_type').notNull(),
    discount_value: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
    max_uses: integer('max_uses'),
    current_uses: integer('current_uses').notNull().default(0),
    valid_from: timestamp('valid_from', { withTimezone: true }),
    valid_until: timestamp('valid_until', { withTimezone: true }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    uniqueIndex('uq_promo_codes_code')
        .on(table.code)
        .where(sql`deleted_at IS NULL`),
]);

export const schoolSubscriptions = pgTable('school_subscriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'restrict' }),
    plan_id: uuid('plan_id').notNull().references(() => paymentPlans.id, { onDelete: 'restrict' }),
    promo_code_id: uuid('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
    status: subscriptionStatusEnum('status').notNull().default('trialing'),
    current_period_start: timestamp('current_period_start', { withTimezone: true }).notNull(),
    current_period_end: timestamp('current_period_end', { withTimezone: true }).notNull(),
    trial_start: timestamp('trial_start', { withTimezone: true }),
    trial_end: timestamp('trial_end', { withTimezone: true }),
    cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
    cancel_reason: text('cancel_reason'),
    auto_renew: boolean('auto_renew').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_subscriptions_school').on(table.school_id),
    index('idx_subscriptions_status').on(table.status),
    // ISSUE 2: Prevent duplicate active/trialing subscriptions — race condition in checkout
    uniqueIndex('uq_school_one_active_sub')
        .on(table.school_id)
        .where(sql`status IN ('active', 'trialing')`),
    // ISSUE 11: Composite index for frequent "get active subscription for school" query
    index('idx_sub_school_status').on(table.school_id, table.status),
]);

export const paymentTransactions = pgTable('payment_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'restrict' }),
    subscription_id: uuid('subscription_id').notNull().references(() => schoolSubscriptions.id, { onDelete: 'restrict' }),
    promo_code_id: uuid('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
    razorpay_order_id: text('razorpay_order_id'),
    razorpay_payment_id: text('razorpay_payment_id'),
    razorpay_signature: text('razorpay_signature'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('INR'),
    status: paymentStatusEnum('status').notNull().default('created'),
    gateway_response: jsonb('gateway_response'),
    failure_reason: text('failure_reason'),
    refund_amount: numeric('refund_amount', { precision: 12, scale: 2 }),
    refunded_at: timestamp('refunded_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_transactions_school').on(table.school_id),
    index('idx_transactions_status').on(table.status),
]);

export const invoices = pgTable('invoices', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'restrict' }),
    subscription_id: uuid('subscription_id').notNull().references(() => schoolSubscriptions.id, { onDelete: 'restrict' }),
    transaction_id: uuid('transaction_id').references(() => paymentTransactions.id, { onDelete: 'set null' }),
    invoice_number: text('invoice_number').notNull().unique(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    tax_amount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('INR'),
    issued_at: timestamp('issued_at', { withTimezone: true }),
    due_date: date('due_date'),
    paid_at: timestamp('paid_at', { withTimezone: true }),
    billing_name: text('billing_name').notNull(),
    billing_address: text('billing_address'),
    gstin: text('gstin'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// ACADEMIC STRUCTURE
// ============================================================================

export const classes = pgTable('classes', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    level: integer('level').notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_classes_name')
        .on(table.name)
        .where(sql`deleted_at IS NULL`),
    uniqueIndex('uq_classes_level')
        .on(table.level)
        .where(sql`deleted_at IS NULL`),
]);

export const schoolClassMapping = pgTable('school_class_mapping', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    class_id: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    is_active: boolean('is_active').notNull().default(true),
    // ISSUE 21: soft delete — unassigning a class must NOT permanently erase historical context
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_school_class')
        .on(table.school_id, table.class_id)
        .where(sql`deleted_at IS NULL`),
]);

export const studentAcademicRecords = pgTable('student_academic_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    session_id: uuid('session_id').notNull().references(() => academicSessions.id, { onDelete: 'restrict' }),
    class_id: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'restrict' }),
    roll_number: text('roll_number'),
    section: text('section'),
    is_promoted: boolean('is_promoted').notNull().default(false),
    promoted_at: timestamp('promoted_at', { withTimezone: true }),
    promoted_by: uuid('promoted_by').references(() => schoolAdmins.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_student_session').on(table.user_id, table.session_id),
    index('idx_sar_school_session').on(table.school_id, table.session_id),
]);

// ============================================================================
// CONTENT SYSTEM
// ============================================================================

export const courses = pgTable('courses', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    thumbnail_url: text('thumbnail_url'),
    is_published: boolean('is_published').notNull().default(false),
    all_classes: boolean('all_classes').notNull().default(false),
    total_lessons: integer('total_lessons').notNull().default(0),
    total_xp: integer('total_xp').notNull().default(0),
    category: text('category').notNull().default('General'),
    // ISSUE 15: array column instead of plain text — enables proper multi-topic filtering with GIN index
    topics: text('topics').array().notNull().default(sql`'{}'`),
    created_by: uuid('created_by').notNull().references(() => superAdmins.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    index('idx_courses_published').on(table.is_published),
    // ISSUE 9: Partial index — only index active (non-deleted) published courses
    index('idx_courses_active_published').on(table.is_published).where(sql`deleted_at IS NULL`),
    // Quick Win #3: GIN index for efficient multi-topic filtering
    index('idx_course_topics').using('gin', table.topics),
]);

export const courseClassMapping = pgTable('course_class_mapping', {
    id: uuid('id').defaultRandom().primaryKey(),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    class_id: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    // ISSUE 21: soft delete — de-mapping a course/class must not lose historical context
    is_active: boolean('is_active').notNull().default(true),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_course_class')
        .on(table.course_id, table.class_id),
]);

export const lessons = pgTable('lessons', {
    id: uuid('id').defaultRandom().primaryKey(),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    content_type: lessonContentTypeEnum('content_type').notNull(),
    content_url: text('content_url'),
    content_items: text('content_items'), // JSON: Array<{id,type,url}> for multi-block lessons
    asset_id: uuid('asset_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    sequence_order: integer('sequence_order').notNull(),
    duration_minutes: integer('duration_minutes'),
    xp_reward: integer('xp_reward').notNull().default(10),
    is_published: boolean('is_published').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    // INTEGRATED CONSTRAINT: uniqueIndex replaced by DEFERRABLE UNIQUE constraint in base schema
    // to allow reorder transactions without temporary violations. (uq_lesson_sequence_per_course)
    index('idx_lessons_course').on(table.course_id),
    // ISSUE 9: Partial index — only active (non-deleted) lessons
    index('idx_lessons_active').on(table.course_id).where(sql`deleted_at IS NULL`),
    // ISSUE 11: Composite index for "published lessons in course" queries
    index('idx_lessons_course_published').on(table.course_id, table.is_published),
]);

export const quizzes = pgTable('quizzes', {
    id: uuid('id').defaultRandom().primaryKey(),
    lesson_id: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    time_limit_secs: integer('time_limit_secs'),
    pass_percentage: numeric('pass_percentage', { precision: 5, scale: 2 }).notNull().default('60.00'),
    max_attempts: integer('max_attempts').notNull().default(3),
    xp_reward: integer('xp_reward').notNull().default(20),
    is_published: boolean('is_published').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

export const quizQuestions = pgTable('quiz_questions', {
    id: uuid('id').defaultRandom().primaryKey(),
    quiz_id: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    question_text: text('question_text').notNull(),
    question_type: questionTypeEnum('question_type').notNull(),
    explanation: text('explanation'),
    points: integer('points').notNull().default(1),
    time_limit_secs: integer('time_limit_secs'),
    sequence_order: integer('sequence_order').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    // INTEGRATED CONSTRAINT: uniqueIndex replaced by DEFERRABLE UNIQUE constraint in base schema
    // to allow reorder transactions without temporary violations. (uq_quiz_question_sequence)
    index('idx_quiz_questions_quiz').on(table.quiz_id),
]);

export const quizOptions = pgTable('quiz_options', {
    id: uuid('id').defaultRandom().primaryKey(),
    question_id: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
    option_text: text('option_text').notNull(),
    is_correct: boolean('is_correct').notNull().default(false),
    sequence_order: integer('sequence_order').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_quiz_options_question').on(table.question_id),
]);

// ============================================================================
// ENROLLMENT & PROGRESS
// ============================================================================

export const enrollments = pgTable('enrollments', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    session_id: uuid('session_id').notNull().references(() => academicSessions.id, { onDelete: 'restrict' }),
    enrolled_at: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    is_active: boolean('is_active').notNull().default(true),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    // in the same session. Re-enrollment API must UPSERT (reactivate row) not INSERT.
    uniqueIndex('uq_enrollment')
        .on(table.user_id, table.course_id, table.session_id)
        .where(sql`deleted_at IS NULL`),
    index('idx_enrollments_school').on(table.school_id),
    // ISSUE 11: Composite index for "active enrollments for a user" query
    index('idx_enroll_user_active').on(table.user_id, table.is_active),
]);

export const lessonProgress = pgTable('lesson_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    lesson_id: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    enrollment_id: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    // ISSUE 17: session_id added — avoids expensive JOIN through enrollments to filter by academic year
    session_id: uuid('session_id').notNull().references(() => academicSessions.id, { onDelete: 'restrict' }),
    // ISSUE 25: school_id added — enables direct school-scoped analytics without extra joins
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    progress_pct: numeric('progress_pct', { precision: 5, scale: 2 }).notNull().default('0'),
    last_position_secs: integer('last_position_secs').notNull().default(0),
    time_spent_secs: integer('time_spent_secs').notNull().default(0),
    verified_watch_seconds: integer('verified_watch_seconds').notNull().default(0),
    content_watched: boolean('content_watched').notNull().default(false),
    completion_locked: boolean('completion_locked').notNull().default(false),
    max_page_viewed: integer('max_page_viewed').notNull().default(0),
    slides_viewed_array: jsonb('slides_viewed_array').notNull().default([]),
    xp_earned: integer('xp_earned').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_user_lesson').on(table.user_id, table.lesson_id, table.enrollment_id),
    index('idx_lp_user').on(table.user_id),
    index('idx_lp_enrollment').on(table.enrollment_id),
    index('idx_lp_session').on(table.session_id),
    index('idx_lp_school').on(table.school_id),
    index('idx_lp_content_watched').on(table.content_watched),
    // High-Integrity Completion Logic: Database enforces valid percentage ranges
    check('lp_progress_pct_range', sql`${table.progress_pct} >= 0 AND ${table.progress_pct} <= 100`)
]);

export const lessonSessions = pgTable('lesson_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    lesson_id: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    session_token: text('session_token').notNull().unique(),
    device_hash: text('device_hash'),
    user_agent: text('user_agent'),
    ip_hash: text('ip_hash'),
    last_nonce: bigint('last_nonce', { mode: 'number' }).notNull().default(0),
    ip_address: inet('ip_address'),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    last_heartbeat_at: timestamp('last_heartbeat_at', { withTimezone: true }).notNull().defaultNow(),
    last_playback_time: integer('last_playback_time').notNull().default(0),
    total_verified_seconds: integer('total_verified_seconds').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
}, (table) => [
    index('idx_sessions_user_lesson').on(table.user_id, table.lesson_id),
    index('idx_sessions_token').on(table.session_token),
    index('idx_sessions_active').on(table.is_active),
]);

export const courseProgress = pgTable('course_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    enrollment_id: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    // ISSUE 17: session_id added — avoids expensive JOIN through enrollments to filter by academic year
    session_id: uuid('session_id').notNull().references(() => academicSessions.id, { onDelete: 'restrict' }),
    // ISSUE 25: school_id added — enables direct school-scoped analytics without extra joins
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    lessons_completed: integer('lessons_completed').notNull().default(0),
    total_lessons: integer('total_lessons').notNull().default(0),
    progress_pct: numeric('progress_pct', { precision: 5, scale: 2 }).notNull().default('0'),
    total_xp_earned: integer('total_xp_earned').notNull().default(0),
    total_time_secs: integer('total_time_secs').notNull().default(0),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_user_course_enrollment').on(table.user_id, table.course_id, table.enrollment_id),
    index('idx_cp_session').on(table.session_id),
    index('idx_cp_school').on(table.school_id),
    // High-Integrity Progress Tracking: Database enforces valid percentage ranges
    check('cp_progress_pct_range', sql`${table.progress_pct} >= 0 AND ${table.progress_pct} <= 100`)
]);

export const quizAttempts = pgTable('quiz_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    quiz_id: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    enrollment_id: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    attempt_number: integer('attempt_number').notNull().default(1),
    score: numeric('score', { precision: 5, scale: 2 }).notNull().default('0'),
    max_score: numeric('max_score', { precision: 5, scale: 2 }).notNull(),
    passed: boolean('passed').notNull().default(false),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    time_taken_secs: integer('time_taken_secs'),
    xp_earned: integer('xp_earned').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_qattempts_user').on(table.user_id),
    // COMPOUND INDEX: Speeds up max-attempts check (WHERE user_id = ? AND quiz_id = ?)
    // without this, high quiz traffic causes a partial index scan on user_id alone.
    index('idx_qattempts_user_quiz').on(table.user_id, table.quiz_id),
]);

export const quizAttemptAnswers = pgTable('quiz_attempt_answers', {
    id: uuid('id').defaultRandom().primaryKey(),
    attempt_id: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
    question_id: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
    option_id: uuid('option_id').references(() => quizOptions.id, { onDelete: 'set null' }),
    text_answer: text('text_answer'),
    is_correct: boolean('is_correct').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_qa_answers_attempt').on(table.attempt_id),
]);

// ============================================================================
// GAMIFICATION
// ============================================================================

export const xpEvents = pgTable('xp_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    source: xpSourceEnum('source').notNull(),
    xp_amount: integer('xp_amount').notNull(),
    reference_type: text('reference_type'),
    reference_id: uuid('reference_id'),
    description: text('description'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_xp_user').on(table.user_id),
    index('idx_xp_school').on(table.school_id),
    index('idx_xp_created').on(table.created_at),
    // Composite for leaderboard queries ("XP events for a user in a date range")
    index('idx_xp_user_created').on(table.user_id, table.created_at),
    // IDEMPOTENCY INDEX: Required for duplicate XP award prevention in background workers.
    // Query: WHERE user_id = ? AND reference_id = ? AND source = ?
    index('idx_xp_user_ref_source').on(table.user_id, table.reference_id, table.source),
]);

export const achievements = pgTable('achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    icon_url: text('icon_url'),
    tier: achievementTierEnum('tier').notNull().default('bronze'),
    category: text('category').notNull().default('Beginner'),
    xp_threshold: integer('xp_threshold'),
    criteria: jsonb('criteria').notNull().default({}),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userAchievements = pgTable('user_achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    achievement_id: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
    earned_at: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_user_achievement').on(table.user_id, table.achievement_id),
]);

export const dailyChallenges = pgTable('daily_challenges', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    xp_reward: integer('xp_reward').notNull().default(5),
    criteria: jsonb('criteria').notNull().default({}),
    challenge_date: date('challenge_date').notNull(),
    status: challengeStatusEnum('status').notNull().default('active'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_daily_challenge_date').on(table.challenge_date),
    uniqueIndex('uq_daily_challenge_item').on(table.challenge_date, table.title),
]);

export const userDailyChallenges = pgTable('user_daily_challenges', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    challenge_id: uuid('challenge_id').notNull().references(() => dailyChallenges.id, { onDelete: 'cascade' }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    xp_earned: integer('xp_earned').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_user_daily_challenge').on(table.user_id, table.challenge_id),
]);

// ============================================================================
// CERTIFICATION
// ============================================================================

export const certificates = pgTable('certificates', {
    id: uuid('id').defaultRandom().primaryKey(),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    template_url: text('template_url'),
    min_progress_pct: numeric('min_progress_pct', { precision: 5, scale: 2 }).notNull().default('100.00'),
    min_quiz_score: numeric('min_quiz_score', { precision: 5, scale: 2 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    check('cert_min_progress_range', sql`${table.min_progress_pct} >= 0 AND ${table.min_progress_pct} <= 100`),
    check('cert_min_quiz_score_range', sql`${table.min_quiz_score} >= 0 AND ${table.min_quiz_score} <= 100`)
]);

export const userCertificates = pgTable('user_certificates', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    certificate_id: uuid('certificate_id').notNull().references(() => certificates.id, { onDelete: 'restrict' }),
    enrollment_id: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'restrict' }),
    certificate_url: text('certificate_url'),
    verification_code: text('verification_code').notNull().unique(),
    issued_at: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_user_cert_enrollment').on(table.user_id, table.certificate_id, table.enrollment_id),
]);

// ============================================================================
// ANALYTICS SUPPORT
// ============================================================================

export const platformMetricsDaily = pgTable('platform_metrics_daily', {
    id: uuid('id').defaultRandom().primaryKey(),
    metric_date: date('metric_date').notNull().unique(),
    total_schools: integer('total_schools').notNull().default(0),
    active_schools: integer('active_schools').notNull().default(0),
    total_students: integer('total_students').notNull().default(0),
    active_students: integer('active_students').notNull().default(0),
    total_enrollments: integer('total_enrollments').notNull().default(0),
    total_xp_awarded: bigint('total_xp_awarded', { mode: 'number' }).notNull().default(0),
    revenue_total: numeric('revenue_total', { precision: 14, scale: 2 }).notNull().default('0'),
    new_subscriptions: integer('new_subscriptions').notNull().default(0),
    churned_subscriptions: integer('churned_subscriptions').notNull().default(0),
    peak_concurrent: integer('peak_concurrent').notNull().default(0), // peak PCU recorded during this day
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schoolMetricsDaily = pgTable('school_metrics_daily', {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    metric_date: date('metric_date').notNull(),
    active_students: integer('active_students').notNull().default(0),
    total_lessons_completed: integer('total_lessons_completed').notNull().default(0),
    total_quizzes_taken: integer('total_quizzes_taken').notNull().default(0),
    avg_quiz_score: numeric('avg_quiz_score', { precision: 5, scale: 2 }),
    total_xp_awarded: bigint('total_xp_awarded', { mode: 'number' }).notNull().default(0),
    avg_session_minutes: numeric('avg_session_minutes', { precision: 8, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_school_metric_date').on(table.school_id, table.metric_date),
]);

export const courseMetricsDaily = pgTable('course_metrics_daily', {
    id: uuid('id').defaultRandom().primaryKey(),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    metric_date: date('metric_date').notNull(),
    total_enrollments: integer('total_enrollments').notNull().default(0),
    active_learners: integer('active_learners').notNull().default(0),
    completions: integer('completions').notNull().default(0),
    avg_progress_pct: numeric('avg_progress_pct', { precision: 5, scale: 2 }),
    avg_quiz_score: numeric('avg_quiz_score', { precision: 5, scale: 2 }),
    total_xp_awarded: bigint('total_xp_awarded', { mode: 'number' }).notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('uq_course_metric_date').on(table.course_id, table.metric_date),
]);

// ============================================================================
// AUDIT & SECURITY
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom(),
    user_id: uuid('user_id'),
    user_type: userTypeEnum('user_type'),
    school_id: uuid('school_id').references(() => schools.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: uuid('entity_id'),
    old_values: jsonb('old_values'),
    new_values: jsonb('new_values'),
    metadata: jsonb('metadata').notNull().default({}),
    ip_address: inet('ip_address'),
    user_agent: text('user_agent'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.id, table.created_at] }),
    index('idx_audit_user').on(table.user_id),
    index('idx_audit_created').on(table.created_at),
    index('idx_audit_user_created').on(table.user_id, table.created_at),
    index('idx_audit_school_created').on(table.school_id, table.created_at),
]);

export const pinResetRequests = pgTable('pin_reset_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    student_id: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    school_id: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
    requested_at: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    resolved_at: timestamp('resolved_at', { withTimezone: true }),
    resolved_by: uuid('resolved_by').references(() => schoolAdmins.id, { onDelete: 'set null' }),
    new_pin: text('new_pin'), // Temporarily store if generated by admin
}, (table) => [
    index('idx_pin_reset_student').on(table.student_id),
    index('idx_pin_reset_school').on(table.school_id),
    index('idx_pin_reset_status').on(table.status),
]);

export const loginAttempts = pgTable('login_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    user_id: uuid('user_id'), // Polymorphic
    user_type: userTypeEnum('user_type'),
    // ISSUE 5: inet type instead of text — prevents IPv4/IPv6 mismatch in rate-limiting/ban queries
    ip_address: inet('ip_address').notNull(),
    user_agent: text('user_agent'),
    success: boolean('success').notNull(),
    failure_reason: text('failure_reason'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_login_email').on(table.email),
    index('idx_login_created').on(table.created_at),
]);

// ============================================================================
// MEDIA LIBRARY
// ============================================================================

export const mediaAssets = pgTable('media_assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    file_name: text('file_name').notNull(),         // UUID-based storage key/filename
    original_name: text('original_name').notNull(), // Original filename from the user
    file_url: text('file_url'),
    file_path: text('file_path').notNull(),          // Storage key (R2) or relative local path
    mime_type: text('mime_type').notNull(),
    file_size: bigint('file_size', { mode: 'number' }).notNull().default(0),
    storage_type: storageTypeEnum('storage_type').notNull().default('local'),
    asset_type: assetTypeEnum('asset_type').notNull().default('document'),
    uploaded_by: uuid('uploaded_by'), // Polymorphic - students, school_admins, or super_admins
    folder: text('folder'), // course, lesson, settings, etc
    processing_status: text('processing_status').notNull().default('completed'), // 'pending', 'processing', 'completed', 'failed'
    error_message: text('error_message'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_media_asset_type').on(table.asset_type),
    index('idx_media_uploaded_by').on(table.uploaded_by),
    index('idx_media_folder').on(table.folder),
    index('idx_media_storage_type').on(table.storage_type),
    index('idx_media_created').on(table.created_at),
]);

export const platformSettings = pgTable('platform_settings', {
    id: text('id').primaryKey(), // Usually 'default'
    logo_url: text('logo_url'),
    favicon_url: text('favicon_url'),
    logo_data: text('logo_data'), // base64 data URI stored in DB
    favicon_data: text('favicon_data'), // base64 data URI stored in DB
    platform_name: text('platform_name').notNull().default('TechNurture'),
    logo_layout: text('logo_layout').notNull().default('horizontal'), // 'horizontal', 'stacked', 'icon_only'
    show_platform_name: boolean('show_platform_name').notNull().default(true),
    logo_height: integer('logo_height').notNull().default(40),
    hero_video_url: text('hero_video_url').notNull().default(''),
    hero_video_type: text('hero_video_type').notNull().default('youtube'), // 'upload', 'youtube', 'vimeo', 'link', 'stream'
    show_hero_video: boolean('show_hero_video').notNull().default(true),
    support_email: text('support_email'),
    currency_default: text('currency_default').notNull().default('INR'),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(), // Polymorphic
    user_type: userTypeEnum('user_type').notNull(),
    token_hash: text('token_hash').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    used_at: timestamp('used_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_prt_token').on(table.token_hash),
    index('idx_prt_user').on(table.user_id),
    index('idx_prt_expires').on(table.expires_at),
]);

export const emailVerificationTokens = pgTable('email_verification_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(), // Polymorphic
    user_type: userTypeEnum('user_type').notNull(),
    token_hash: text('token_hash').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_evt_token').on(table.token_hash),
    index('idx_evt_user').on(table.user_id),
]);

// ============================================================================
// SECURITY — SESSION TRACKING (ISSUE 8)
// ============================================================================

/**
 * ISSUE 8: User sessions / refresh tokens table.
 * Without this there is NO way to:
 *  - Invalidate a session after password change / account suspension
 *  - Revoke individual device sessions ("log out everywhere")
 *  - List active sessions per user
 *
 * Auth flow: on login, create a row here with a hashed refresh token.
 * POST /auth/logout must set revoked_at, not just discard the JWT client-side.
 */
export const userSessions = pgTable('user_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    user_type: userTypeEnum('user_type').notNull(),
    refresh_token_hash: text('refresh_token_hash').notNull(),
    device_info: text('device_info'),
    ip_address: inet('ip_address'),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
}, (table) => [
    index('idx_sessions_user').on(table.user_id),
    index('idx_sessions_expires').on(table.expires_at),
    // POST /auth/refresh lookup O(1) instead of a full table scan
    uniqueIndex('uq_sessions_token_hash').on(table.refresh_token_hash),
]);

// ============================================================================
// RELATIONS (for Drizzle query API)
// ============================================================================

export const schoolsRelations = relations(schools, ({ many }) => ({
    students: many(students),
    schoolAdmins: many(schoolAdmins),
    academicSessions: many(academicSessions),
    subscriptions: many(schoolSubscriptions),
    classMapping: many(schoolClassMapping),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
    school: one(schools, { fields: [students.school_id], references: [schools.id] }),
    academicRecords: many(studentAcademicRecords),
    enrollments: many(enrollments),
    xpEvents: many(xpEvents),
    achievements: many(userAchievements),
    dailyChallenges: many(userDailyChallenges),
    certificates: many(userCertificates),
    lessonSessions: many(lessonSessions),
    lessonProgress: many(lessonProgress),
    courseProgress: many(courseProgress),
    quizAttempts: many(quizAttempts),
}));

export const schoolAdminsRelations = relations(schoolAdmins, ({ one, many }) => ({
    school: one(schools, { fields: [schoolAdmins.school_id], references: [schools.id] }),
    promotedRecords: many(studentAcademicRecords),
}));

export const superAdminsRelations = relations(superAdmins, ({ many }) => ({
    createdCourses: many(courses),
}));

export const academicSessionsRelations = relations(academicSessions, ({ one }) => ({
    school: one(schools, { fields: [academicSessions.school_id], references: [schools.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    createdBy: one(superAdmins, { fields: [courses.created_by], references: [superAdmins.id] }),
    classMapping: many(courseClassMapping),
    lessons: many(lessons),
    enrollments: many(enrollments),
    quizzes: many(quizzes),
    certificates: many(certificates),
    progress: many(courseProgress),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
    course: one(courses, { fields: [lessons.course_id], references: [courses.id] }),
    quiz: one(quizzes, { fields: [lessons.id], references: [quizzes.lesson_id] }),
    asset: one(mediaAssets, { fields: [lessons.asset_id], references: [mediaAssets.id] }),
    progress: many(lessonProgress),
    sessions: many(lessonSessions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
    student: one(students, { fields: [enrollments.user_id], references: [students.id] }),
    course: one(courses, { fields: [enrollments.course_id], references: [courses.id] }),
    school: one(schools, { fields: [enrollments.school_id], references: [schools.id] }),
    session: one(academicSessions, { fields: [enrollments.session_id], references: [academicSessions.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
    student: one(students, { fields: [lessonProgress.user_id], references: [students.id] }),
    lesson: one(lessons, { fields: [lessonProgress.lesson_id], references: [lessons.id] }),
    enrollment: one(enrollments, { fields: [lessonProgress.enrollment_id], references: [enrollments.id] }),
    session: one(academicSessions, { fields: [lessonProgress.session_id], references: [academicSessions.id] }),
    school: one(schools, { fields: [lessonProgress.school_id], references: [schools.id] }),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
    student: one(students, { fields: [courseProgress.user_id], references: [students.id] }),
    course: one(courses, { fields: [courseProgress.course_id], references: [courses.id] }),
    enrollment: one(enrollments, { fields: [courseProgress.enrollment_id], references: [enrollments.id] }),
    session: one(academicSessions, { fields: [courseProgress.session_id], references: [academicSessions.id] }),
    school: one(schools, { fields: [courseProgress.school_id], references: [schools.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
    userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
    student: one(students, { fields: [userAchievements.user_id], references: [students.id] }),
    achievement: one(achievements, { fields: [userAchievements.achievement_id], references: [achievements.id] }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
    userChallenges: many(userDailyChallenges),
}));

export const userDailyChallengesRelations = relations(userDailyChallenges, ({ one }) => ({
    student: one(students, { fields: [userDailyChallenges.user_id], references: [students.id] }),
    challenge: one(dailyChallenges, { fields: [userDailyChallenges.challenge_id], references: [dailyChallenges.id] }),
}));

export const paymentPlansRelations = relations(paymentPlans, ({ many }) => ({
    subscriptions: many(schoolSubscriptions),
}));

export const schoolSubscriptionsRelations = relations(schoolSubscriptions, ({ one, many }) => ({
    school: one(schools, { fields: [schoolSubscriptions.school_id], references: [schools.id] }),
    plan: one(paymentPlans, { fields: [schoolSubscriptions.plan_id], references: [paymentPlans.id] }),
    promoCode: one(promoCodes, { fields: [schoolSubscriptions.promo_code_id], references: [promoCodes.id] }),
    transactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
    school: one(schools, { fields: [paymentTransactions.school_id], references: [schools.id] }),
    subscription: one(schoolSubscriptions, { fields: [paymentTransactions.subscription_id], references: [schoolSubscriptions.id] }),
    promoCode: one(promoCodes, { fields: [paymentTransactions.promo_code_id], references: [promoCodes.id] }),
}));

export const studentAcademicRecordsRelations = relations(studentAcademicRecords, ({ one }) => ({
    student: one(students, { fields: [studentAcademicRecords.user_id], references: [students.id] }),
    school: one(schools, { fields: [studentAcademicRecords.school_id], references: [schools.id] }),
    session: one(academicSessions, { fields: [studentAcademicRecords.session_id], references: [academicSessions.id] }),
    academicClass: one(classes, { fields: [studentAcademicRecords.class_id], references: [classes.id] }),
    promotedBy: one(schoolAdmins, { fields: [studentAcademicRecords.promoted_by], references: [schoolAdmins.id] }),
}));

export const courseClassMappingRelations = relations(courseClassMapping, ({ one }) => ({
    course: one(courses, { fields: [courseClassMapping.course_id], references: [courses.id] }),
    academicClass: one(classes, { fields: [courseClassMapping.class_id], references: [classes.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
    lesson: one(lessons, { fields: [quizzes.lesson_id], references: [lessons.id] }),
    course: one(courses, { fields: [quizzes.course_id], references: [courses.id] }),
    questions: many(quizQuestions),
    attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
    quiz: one(quizzes, { fields: [quizQuestions.quiz_id], references: [quizzes.id] }),
    options: many(quizOptions),
}));

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
    question: one(quizQuestions, { fields: [quizOptions.question_id], references: [quizQuestions.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
    student: one(students, { fields: [quizAttempts.user_id], references: [students.id] }),
    quiz: one(quizzes, { fields: [quizAttempts.quiz_id], references: [quizzes.id] }),
    enrollment: one(enrollments, { fields: [quizAttempts.enrollment_id], references: [enrollments.id] }),
    answers: many(quizAttemptAnswers),
}));

export const quizAttemptAnswersRelations = relations(quizAttemptAnswers, ({ one }) => ({
    attempt: one(quizAttempts, { fields: [quizAttemptAnswers.attempt_id], references: [quizAttempts.id] }),
    question: one(quizQuestions, { fields: [quizAttemptAnswers.question_id], references: [quizQuestions.id] }),
    option: one(quizOptions, { fields: [quizAttemptAnswers.option_id], references: [quizOptions.id] }),
}));

export const schoolClassMappingRelations = relations(schoolClassMapping, ({ one }) => ({
    school: one(schools, { fields: [schoolClassMapping.school_id], references: [schools.id] }),
    academicClass: one(classes, { fields: [schoolClassMapping.class_id], references: [classes.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
    // Use loose relation or specific if needed, for now uploader is plain UUID in table
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    // Polymorphic, Drizzle relations don't support well without discriminator in one()
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
    school: one(schools, { fields: [invoices.school_id], references: [schools.id] }),
    subscription: one(schoolSubscriptions, { fields: [invoices.subscription_id], references: [schoolSubscriptions.id] }),
    transaction: one(paymentTransactions, { fields: [invoices.transaction_id], references: [paymentTransactions.id] }),
}));

export const lessonSessionsRelations = relations(lessonSessions, ({ one }) => ({
    student: one(students, { fields: [lessonSessions.user_id], references: [students.id] }),
    lesson: one(lessons, { fields: [lessonSessions.lesson_id], references: [lessons.id] }),
}));

export const xpEventsRelations = relations(xpEvents, ({ one }) => ({
    student: one(students, { fields: [xpEvents.user_id], references: [students.id] }),
    school: one(schools, { fields: [xpEvents.school_id], references: [schools.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
    course: one(courses, { fields: [certificates.course_id], references: [courses.id] }),
    userCertificates: many(userCertificates),
}));

export const userCertificatesRelations = relations(userCertificates, ({ one }) => ({
    student: one(students, { fields: [userCertificates.user_id], references: [students.id] }),
    certificate: one(certificates, { fields: [userCertificates.certificate_id], references: [certificates.id] }),
    enrollment: one(enrollments, { fields: [userCertificates.enrollment_id], references: [enrollments.id] }),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
    subscriptions: many(schoolSubscriptions),
    transactions: many(paymentTransactions),
}));

export const classesRelations = relations(classes, ({ many }) => ({
    studentAcademicRecords: many(studentAcademicRecords),
    schoolMappings: many(schoolClassMapping),
    courseMappings: many(courseClassMapping),
}));

export const platformMetricsDailyRelations = relations(platformMetricsDaily, () => ({}));
export const schoolMetricsDailyRelations = relations(schoolMetricsDaily, ({ one }) => ({
    school: one(schools, { fields: [schoolMetricsDaily.school_id], references: [schools.id] }),
}));
export const courseMetricsDailyRelations = relations(courseMetricsDaily, ({ one }) => ({
    course: one(courses, { fields: [courseMetricsDaily.course_id], references: [courses.id] }),
}));
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    school: one(schools, { fields: [auditLogs.school_id], references: [schools.id] }),
}));
export const loginAttemptsRelations = relations(loginAttempts, () => ({}));
export const pinResetRequestsRelations = relations(pinResetRequests, ({ one }) => ({
    student: one(students, { fields: [pinResetRequests.student_id], references: [students.id] }),
    school: one(schools, { fields: [pinResetRequests.school_id], references: [schools.id] }),
    resolver: one(schoolAdmins, { fields: [pinResetRequests.resolved_by], references: [schoolAdmins.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, () => ({}));
export const emailVerificationTokensRelations = relations(emailVerificationTokens, () => ({}));

