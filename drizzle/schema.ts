import { pgTable, uniqueIndex, foreignKey, uuid, timestamp, unique, text, integer, boolean, numeric, date, index, jsonb, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const achievementTier = pgEnum("achievement_tier", ['bronze', 'silver', 'gold', 'platinum'])
export const assetType = pgEnum("asset_type", ['video', 'image', 'document'])
export const auditAction = pgEnum("audit_action", ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion'])
export const billingCycle = pgEnum("billing_cycle", ['monthly', 'quarterly', 'semi_annual', 'annual'])
export const challengeStatus = pgEnum("challenge_status", ['active', 'completed', 'expired'])
export const discountType = pgEnum("discount_type", ['percentage', 'fixed'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'issued', 'paid', 'void', 'overdue'])
export const lessonContentType = pgEnum("lesson_content_type", ['video', 'ppt', 'pdf', 'quiz'])
export const paymentStatus = pgEnum("payment_status", ['created', 'authorized', 'captured', 'failed', 'refunded'])
export const questionType = pgEnum("question_type", ['mcq', 'true_false', 'fill_blank', 'multi_select'])
export const storageType = pgEnum("storage_type", ['r2', 'local'])
export const subscriptionStatus = pgEnum("subscription_status", ['active', 'trialing', 'past_due', 'cancelled', 'expired'])
export const userRole = pgEnum("user_role", ['super_admin', 'school_admin', 'student'])
export const xpSource = pgEnum("xp_source", ['lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment'])


export const courseClassMapping = pgTable("course_class_mapping", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	classId: uuid("class_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_course_class").using("btree", table.courseId.asc().nullsLast().op("uuid_ops"), table.classId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "course_class_mapping_course_id_courses_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.classId],
		foreignColumns: [classes.id],
		name: "course_class_mapping_class_id_classes_id_fk"
	}).onDelete("cascade"),
]);

export const classes = pgTable("classes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	level: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("classes_name_unique").on(table.name),
	unique("classes_level_unique").on(table.level),
]);

export const schoolClassMapping = pgTable("school_class_mapping", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	classId: uuid("class_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_school_class").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops"), table.classId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "school_class_mapping_school_id_schools_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.classId],
		foreignColumns: [classes.id],
		name: "school_class_mapping_class_id_classes_id_fk"
	}).onDelete("cascade"),
]);

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	subscriptionId: uuid("subscription_id").notNull(),
	transactionId: uuid("transaction_id"),
	invoiceNumber: text("invoice_number").notNull(),
	status: invoiceStatus().default('draft').notNull(),
	subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default('0').notNull(),
	total: numeric({ precision: 12, scale: 2 }).notNull(),
	currency: text().default('INR').notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true, mode: 'string' }),
	dueDate: date("due_date"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	billingName: text("billing_name").notNull(),
	billingAddress: text("billing_address"),
	gstin: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "invoices_school_id_schools_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.subscriptionId],
		foreignColumns: [schoolSubscriptions.id],
		name: "invoices_subscription_id_school_subscriptions_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.transactionId],
		foreignColumns: [paymentTransactions.id],
		name: "invoices_transaction_id_payment_transactions_id_fk"
	}).onDelete("set null"),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const promoCodes = pgTable("promo_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	discountType: discountType("discount_type").notNull(),
	discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
	maxUses: integer("max_uses"),
	currentUses: integer("current_uses").default(0).notNull(),
	validFrom: timestamp("valid_from", { withTimezone: true, mode: 'string' }),
	validUntil: timestamp("valid_until", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("promo_codes_code_unique").on(table.code),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	description: text(),
	thumbnailUrl: text("thumbnail_url"),
	isPublished: boolean("is_published").default(false).notNull(),
	allClasses: boolean("all_classes").default(false).notNull(),
	totalLessons: integer("total_lessons").default(0).notNull(),
	totalXp: integer("total_xp").default(0).notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	category: text().default('General').notNull(),
	topics: text().default('Technology').notNull(),
}, (table) => [
	index("idx_courses_published").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "courses_created_by_users_id_fk"
	}).onDelete("restrict"),
	unique("courses_slug_unique").on(table.slug),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	schoolId: uuid("school_id"),
	action: auditAction().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "audit_logs_user_id_users_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "audit_logs_school_id_schools_id_fk"
	}).onDelete("set null"),
]);

export const dailyChallenges = pgTable("daily_challenges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	xpReward: integer("xp_reward").default(5).notNull(),
	criteria: jsonb().default({}).notNull(),
	challengeDate: date("challenge_date").notNull(),
	status: challengeStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_daily_challenge_date").using("btree", table.challengeDate.asc().nullsLast().op("date_ops")),
]);

export const achievements = pgTable("achievements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	iconUrl: text("icon_url"),
	tier: achievementTier().default('bronze').notNull(),
	xpThreshold: integer("xp_threshold"),
	criteria: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("achievements_name_unique").on(table.name),
]);

export const courseMetricsDaily = pgTable("course_metrics_daily", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	metricDate: date("metric_date").notNull(),
	totalEnrollments: integer("total_enrollments").default(0).notNull(),
	activeLearners: integer("active_learners").default(0).notNull(),
	completions: integer().default(0).notNull(),
	avgProgressPct: numeric("avg_progress_pct", { precision: 5, scale: 2 }),
	avgQuizScore: numeric("avg_quiz_score", { precision: 5, scale: 2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalXpAwarded: bigint("total_xp_awarded", { mode: "number" }).default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_course_metric_date").using("btree", table.courseId.asc().nullsLast().op("date_ops"), table.metricDate.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "course_metrics_daily_course_id_courses_id_fk"
	}).onDelete("cascade"),
]);

export const academicSessions = pgTable("academic_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: text().notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	isCurrent: boolean("is_current").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "academic_sessions_school_id_schools_id_fk"
	}).onDelete("cascade"),
]);

export const courseProgress = pgTable("course_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	courseId: uuid("course_id").notNull(),
	enrollmentId: uuid("enrollment_id").notNull(),
	lessonsCompleted: integer("lessons_completed").default(0).notNull(),
	totalLessons: integer("total_lessons").default(0).notNull(),
	progressPct: numeric("progress_pct", { precision: 5, scale: 2 }).default('0').notNull(),
	totalXpEarned: integer("total_xp_earned").default(0).notNull(),
	totalTimeSecs: integer("total_time_secs").default(0).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_user_course_enrollment").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.courseId.asc().nullsLast().op("uuid_ops"), table.enrollmentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "course_progress_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "course_progress_course_id_courses_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.enrollmentId],
		foreignColumns: [enrollments.id],
		name: "course_progress_enrollment_id_enrollments_id_fk"
	}).onDelete("cascade"),
]);

export const enrollments = pgTable("enrollments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	courseId: uuid("course_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	enrolledAt: timestamp("enrolled_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_enrollments_school").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_enrollment").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.courseId.asc().nullsLast().op("uuid_ops"), table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "enrollments_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "enrollments_course_id_courses_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "enrollments_school_id_schools_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.sessionId],
		foreignColumns: [academicSessions.id],
		name: "enrollments_session_id_academic_sessions_id_fk"
	}).onDelete("restrict"),
]);

export const emailVerificationTokens = pgTable("email_verification_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "email_verification_tokens_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	subscriptionId: uuid("subscription_id").notNull(),
	razorpayOrderId: text("razorpay_order_id"),
	razorpayPaymentId: text("razorpay_payment_id"),
	razorpaySignature: text("razorpay_signature"),
	amount: numeric({ precision: 12, scale: 2 }).notNull(),
	currency: text().default('INR').notNull(),
	status: paymentStatus().default('created').notNull(),
	gatewayResponse: jsonb("gateway_response"),
	failureReason: text("failure_reason"),
	refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	promoCodeId: uuid("promo_code_id"),
}, (table) => [
	index("idx_transactions_school").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("idx_transactions_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.promoCodeId],
		foreignColumns: [promoCodes.id],
		name: "payment_transactions_promo_code_id_promo_codes_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "payment_transactions_school_id_schools_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.subscriptionId],
		foreignColumns: [schoolSubscriptions.id],
		name: "payment_transactions_subscription_id_school_subscriptions_id_fk"
	}).onDelete("restrict"),
]);

export const loginAttempts = pgTable("login_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	userId: uuid("user_id"),
	ipAddress: text("ip_address").notNull(),
	userAgent: text("user_agent"),
	success: boolean().notNull(),
	failureReason: text("failure_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_login_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_login_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "login_attempts_user_id_users_id_fk"
	}).onDelete("set null"),
]);

export const mediaAssets = pgTable("media_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileName: text("file_name").notNull(),
	originalName: text("original_name").notNull(),
	fileUrl: text("file_url").notNull(),
	filePath: text("file_path").notNull(),
	mimeType: text("mime_type").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }).default(0).notNull(),
	storageType: storageType("storage_type").default('local').notNull(),
	assetType: assetType("asset_type").default('document').notNull(),
	uploadedBy: uuid("uploaded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_media_asset_type").using("btree", table.assetType.asc().nullsLast().op("enum_ops")),
	index("idx_media_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_media_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.uploadedBy],
		foreignColumns: [users.id],
		name: "media_assets_uploaded_by_users_id_fk"
	}).onDelete("set null"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "password_reset_tokens_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const quizAttempts = pgTable("quiz_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	enrollmentId: uuid("enrollment_id").notNull(),
	attemptNumber: integer("attempt_number").default(1).notNull(),
	score: numeric({ precision: 5, scale: 2 }).default('0').notNull(),
	maxScore: numeric("max_score", { precision: 5, scale: 2 }).notNull(),
	passed: boolean().default(false).notNull(),
	answers: jsonb().default([]).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	timeTakenSecs: integer("time_taken_secs"),
	xpEarned: integer("xp_earned").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_quiz_attempt").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.quizId.asc().nullsLast().op("uuid_ops"), table.enrollmentId.asc().nullsLast().op("int4_ops"), table.attemptNumber.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "quiz_attempts_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.quizId],
		foreignColumns: [quizzes.id],
		name: "quiz_attempts_quiz_id_quizzes_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.enrollmentId],
		foreignColumns: [enrollments.id],
		name: "quiz_attempts_enrollment_id_enrollments_id_fk"
	}).onDelete("cascade"),
]);

export const lessonProgress = pgTable("lesson_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	lessonId: uuid("lesson_id").notNull(),
	enrollmentId: uuid("enrollment_id").notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	progressPct: numeric("progress_pct", { precision: 5, scale: 2 }).default('0').notNull(),
	timeSpentSecs: integer("time_spent_secs").default(0).notNull(),
	xpEarned: integer("xp_earned").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_lp_enrollment").using("btree", table.enrollmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_lp_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_user_lesson").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.lessonId.asc().nullsLast().op("uuid_ops"), table.enrollmentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "lesson_progress_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.lessonId],
		foreignColumns: [lessons.id],
		name: "lesson_progress_lesson_id_lessons_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.enrollmentId],
		foreignColumns: [enrollments.id],
		name: "lesson_progress_enrollment_id_enrollments_id_fk"
	}).onDelete("cascade"),
]);

export const platformMetricsDaily = pgTable("platform_metrics_daily", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	metricDate: date("metric_date").notNull(),
	totalSchools: integer("total_schools").default(0).notNull(),
	activeSchools: integer("active_schools").default(0).notNull(),
	totalStudents: integer("total_students").default(0).notNull(),
	activeStudents: integer("active_students").default(0).notNull(),
	totalEnrollments: integer("total_enrollments").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalXpAwarded: bigint("total_xp_awarded", { mode: "number" }).default(0).notNull(),
	revenueTotal: numeric("revenue_total", { precision: 14, scale: 2 }).default('0').notNull(),
	newSubscriptions: integer("new_subscriptions").default(0).notNull(),
	churnedSubscriptions: integer("churned_subscriptions").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("platform_metrics_daily_metric_date_unique").on(table.metricDate),
]);

export const platformSettings = pgTable("platform_settings", {
	id: text().primaryKey().notNull(),
	heroVideoUrl: text("hero_video_url").default('').notNull(),
	heroVideoType: text("hero_video_type").default('youtube').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	logoUrl: text("logo_url"),
	platformName: text("platform_name").default('TechNurture').notNull(),
});

export const paymentPlans = pgTable("payment_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	billingCycle: billingCycle("billing_cycle").notNull(),
	price: numeric({ precision: 12, scale: 2 }).notNull(),
	currency: text().default('INR').notNull(),
	maxStudents: integer("max_students"),
	features: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isPopular: boolean("is_popular").default(false).notNull(),
	trialDays: integer("trial_days").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const lessons = pgTable("lessons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	title: text().notNull(),
	description: text(),
	contentType: lessonContentType("content_type").notNull(),
	contentUrl: text("content_url"),
	sequenceOrder: integer("sequence_order").notNull(),
	durationMinutes: integer("duration_minutes"),
	xpReward: integer("xp_reward").default(10).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_lessons_course").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_lesson_sequence_per_course").using("btree", table.courseId.asc().nullsLast().op("int4_ops"), table.sequenceOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "lessons_course_id_courses_id_fk"
	}).onDelete("cascade"),
]);

export const quizQuestions = pgTable("quiz_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	questionText: text("question_text").notNull(),
	questionType: questionType("question_type").notNull(),
	options: jsonb().default([]).notNull(),
	correctAnswer: jsonb("correct_answer").notNull(),
	explanation: text(),
	points: integer().default(1).notNull(),
	sequenceOrder: integer("sequence_order").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_quiz_question_sequence").using("btree", table.quizId.asc().nullsLast().op("int4_ops"), table.sequenceOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.quizId],
		foreignColumns: [quizzes.id],
		name: "quiz_questions_quiz_id_quizzes_id_fk"
	}).onDelete("cascade"),
]);

export const quizzes = pgTable("quizzes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonId: uuid("lesson_id"),
	courseId: uuid("course_id").notNull(),
	title: text().notNull(),
	description: text(),
	timeLimitSecs: integer("time_limit_secs"),
	passPercentage: numeric("pass_percentage", { precision: 5, scale: 2 }).default('60.00').notNull(),
	maxAttempts: integer("max_attempts").default(3).notNull(),
	xpReward: integer("xp_reward").default(20).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.lessonId],
		foreignColumns: [lessons.id],
		name: "quizzes_lesson_id_lessons_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "quizzes_course_id_courses_id_fk"
	}).onDelete("cascade"),
]);

export const schoolSubscriptions = pgTable("school_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	planId: uuid("plan_id").notNull(),
	status: subscriptionStatus().default('trialing').notNull(),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }).notNull(),
	trialStart: timestamp("trial_start", { withTimezone: true, mode: 'string' }),
	trialEnd: timestamp("trial_end", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancelReason: text("cancel_reason"),
	autoRenew: boolean("auto_renew").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	promoCodeId: uuid("promo_code_id"),
}, (table) => [
	index("idx_subscriptions_school").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("idx_subscriptions_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.promoCodeId],
		foreignColumns: [promoCodes.id],
		name: "school_subscriptions_promo_code_id_promo_codes_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "school_subscriptions_school_id_schools_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.planId],
		foreignColumns: [paymentPlans.id],
		name: "school_subscriptions_plan_id_payment_plans_id_fk"
	}).onDelete("restrict"),
]);

export const userAchievements = pgTable("user_achievements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	achievementId: uuid("achievement_id").notNull(),
	earnedAt: timestamp("earned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_user_achievement").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.achievementId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_achievements_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.achievementId],
		foreignColumns: [achievements.id],
		name: "user_achievements_achievement_id_achievements_id_fk"
	}).onDelete("cascade"),
]);

export const userDailyChallenges = pgTable("user_daily_challenges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	challengeId: uuid("challenge_id").notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	xpEarned: integer("xp_earned").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_user_daily_challenge").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.challengeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_daily_challenges_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.challengeId],
		foreignColumns: [dailyChallenges.id],
		name: "user_daily_challenges_challenge_id_daily_challenges_id_fk"
	}).onDelete("cascade"),
]);

export const certificates = pgTable("certificates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	title: text().notNull(),
	description: text(),
	templateUrl: text("template_url"),
	minProgressPct: numeric("min_progress_pct", { precision: 5, scale: 2 }).default('100.00').notNull(),
	minQuizScore: numeric("min_quiz_score", { precision: 5, scale: 2 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.courseId],
		foreignColumns: [courses.id],
		name: "certificates_course_id_courses_id_fk"
	}).onDelete("cascade"),
]);

export const schools = pgTable("schools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	email: text().notNull(),
	phone: text(),
	address: text(),
	city: text(),
	state: text(),
	country: text().default('IN').notNull(),
	pincode: text(),
	logoUrl: text("logo_url"),
	website: text(),
	isActive: boolean("is_active").default(true).notNull(),
	dataProcessingConsent: boolean("data_processing_consent").default(false).notNull(),
	minorDataGuardianConsent: boolean("minor_data_guardian_consent").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("schools_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id"),
	role: userRole().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	phone: text(),
	avatarUrl: text("avatar_url"),
	dateOfBirth: date("date_of_birth"),
	isMinor: boolean("is_minor").default(false).notNull(),
	guardianName: text("guardian_name"),
	guardianEmail: text("guardian_email"),
	guardianConsent: boolean("guardian_consent").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cumulativeXp: bigint("cumulative_xp", { mode: "number" }).default(0).notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	bio: text(),
}, (table) => [
	index("idx_users_cumulative_xp").using("btree", table.cumulativeXp.asc().nullsLast().op("int8_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	index("idx_users_school").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_users_email_active").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "users_school_id_schools_id_fk"
	}).onDelete("cascade"),
]);

export const schoolMetricsDaily = pgTable("school_metrics_daily", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	metricDate: date("metric_date").notNull(),
	activeStudents: integer("active_students").default(0).notNull(),
	totalLessonsCompleted: integer("total_lessons_completed").default(0).notNull(),
	totalQuizzesTaken: integer("total_quizzes_taken").default(0).notNull(),
	avgQuizScore: numeric("avg_quiz_score", { precision: 5, scale: 2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalXpAwarded: bigint("total_xp_awarded", { mode: "number" }).default(0).notNull(),
	avgSessionMinutes: numeric("avg_session_minutes", { precision: 8, scale: 2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_school_metric_date").using("btree", table.schoolId.asc().nullsLast().op("date_ops"), table.metricDate.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "school_metrics_daily_school_id_schools_id_fk"
	}).onDelete("cascade"),
]);

export const studentAcademicRecords = pgTable("student_academic_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	classId: uuid("class_id").notNull(),
	rollNumber: text("roll_number"),
	section: text(),
	isPromoted: boolean("is_promoted").default(false).notNull(),
	promotedAt: timestamp("promoted_at", { withTimezone: true, mode: 'string' }),
	promotedBy: uuid("promoted_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sar_school_session").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops"), table.sessionId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_student_session").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.classId],
		foreignColumns: [classes.id],
		name: "student_academic_records_class_id_classes_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "student_academic_records_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "student_academic_records_school_id_schools_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.sessionId],
		foreignColumns: [academicSessions.id],
		name: "student_academic_records_session_id_academic_sessions_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.promotedBy],
		foreignColumns: [users.id],
		name: "student_academic_records_promoted_by_users_id_fk"
	}).onDelete("set null"),
]);

export const userCertificates = pgTable("user_certificates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	certificateId: uuid("certificate_id").notNull(),
	enrollmentId: uuid("enrollment_id").notNull(),
	certificateUrl: text("certificate_url"),
	verificationCode: text("verification_code").notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_user_cert_enrollment").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.certificateId.asc().nullsLast().op("uuid_ops"), table.enrollmentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_certificates_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.certificateId],
		foreignColumns: [certificates.id],
		name: "user_certificates_certificate_id_certificates_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.enrollmentId],
		foreignColumns: [enrollments.id],
		name: "user_certificates_enrollment_id_enrollments_id_fk"
	}).onDelete("restrict"),
	unique("user_certificates_verification_code_unique").on(table.verificationCode),
]);

export const xpEvents = pgTable("xp_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	source: xpSource().notNull(),
	xpAmount: integer("xp_amount").notNull(),
	referenceType: text("reference_type"),
	referenceId: uuid("reference_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_xp_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_xp_school").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("idx_xp_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "xp_events_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "xp_events_school_id_schools_id_fk"
	}).onDelete("cascade"),
]);
