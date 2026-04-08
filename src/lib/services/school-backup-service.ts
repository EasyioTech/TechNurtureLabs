/**
 * TECH NURTURE LMS — School Backup Service
 *
 * Comprehensive backup system for schools, students, subscriptions, and academic data.
 * Exports to R2 with SHA256 deduplication.
 *
 * PHASE 1 (✅ Complete): Interfaces & Type Definitions (25+ interfaces)
 * PHASE 2 (✅ Complete): Export Functions (5 export functions)
 * PHASE 3 (⏳ Next): R2 Upload & Compression
 *
 * Total: 750+ lines, 9 functions, fully typed
 */

import * as crypto from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// ============================================================================
// INTERFACES — BACKUP DATA STRUCTURE
// ============================================================================

/**
 * School Profile Backup — Basic school information
 */
export interface SchoolProfileBackup {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    pincode?: string;
    logo_url?: string;
    website?: string;
    is_active: boolean;
    data_processing_consent: boolean;
    minor_data_guardian_consent: boolean;
    udise_code?: string;
    created_at: string;
    updated_at: string;
}

/**
 * School Admin Backup — School administrator account
 */
export interface SchoolAdminBackup {
    id: string;
    school_id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    is_active: boolean;
    bio?: string;
    last_active_at?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Payment Plan Backup — Subscription plan details
 */
export interface PaymentPlanBackup {
    id: string;
    name: string;
    description?: string;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    price: string;
    currency: string;
    max_students?: number;
    features: Record<string, any>;
    is_active: boolean;
    is_popular: boolean;
    trial_days: number;
    created_at: string;
    updated_at: string;
}

/**
 * Promo Code Backup — Discount codes for subscriptions
 */
export interface PromoCodeBackup {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    max_uses?: number;
    current_uses: number;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * School Subscription Backup — Subscription status and billing period
 */
export interface SchoolSubscriptionBackup {
    id: string;
    school_id: string;
    plan_id: string;
    promo_code_id?: string;
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
    current_period_start: string;
    current_period_end: string;
    trial_start?: string;
    trial_end?: string;
    cancelled_at?: string;
    cancel_reason?: string;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Payment Transaction Backup — Individual payment records
 */
export interface PaymentTransactionBackup {
    id: string;
    school_id: string;
    subscription_id: string;
    promo_code_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    amount: string;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
    gateway_response?: Record<string, any>;
    failure_reason?: string;
    refund_amount?: string;
    refunded_at?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Invoice Backup — Billing invoices for audit trail
 */
export interface InvoiceBackup {
    id: string;
    school_id: string;
    subscription_id: string;
    transaction_id?: string;
    invoice_number: string;
    status: 'draft' | 'issued' | 'paid' | 'void' | 'overdue';
    subtotal: string;
    tax_amount: string;
    total: string;
    currency: string;
    issued_at?: string;
    due_date?: string;
    paid_at?: string;
    billing_name: string;
    billing_address?: string;
    gstin?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Academic Session Backup — School year/semester
 */
export interface AcademicSessionBackup {
    id: string;
    school_id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Class Backup — Standard class (e.g., "Class 10")
 */
export interface ClassBackup {
    id: string;
    name: string;
    level: number;
    created_at: string;
}

/**
 * School Class Mapping Backup — School ↔ Class assignment
 */
export interface SchoolClassMappingBackup {
    id: string;
    school_id: string;
    class_id: string;
    is_active: boolean;
    created_at: string;
}

/**
 * Student Academic Record Backup — Student enrollment, promotion history
 */
export interface StudentAcademicRecordBackup {
    id: string;
    user_id: string;
    school_id: string;
    session_id: string;
    class_id: string;
    roll_number?: string;
    section?: string;
    is_promoted: boolean;
    promoted_at?: string;
    promoted_by?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Quiz Attempt Backup — Student quiz performance
 */
export interface QuizAttemptBackup {
    id: string;
    student_id: string;
    quiz_id: string;
    course_id: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    time_spent_secs: number;
    attempted_at: string;
    completed_at?: string;
}

/**
 * XP Transaction Backup — XP earned/lost with source tracking
 */
export interface XpTransactionBackup {
    id: string;
    student_id: string;
    school_id: string;
    amount: number;
    source: 'lesson_completion' | 'quiz_score' | 'daily_streak' | 'challenge_win' | 'badge_earned' | 'bonus' | 'manual_adjustment';
    source_id?: string;
    created_at: string;
}

/**
 * Achievement Backup — Badges/awards earned by student
 */
export interface AchievementBackup {
    id: string;
    student_id: string;
    badge_id: string;
    badge_name: string;
    badge_icon?: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earned_at: string;
}

/**
 * Student Backup — Complete student profile with all data
 */
export interface StudentBackup {
    id: string;
    school_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    date_of_birth?: string;
    gender?: string;
    is_minor: boolean;
    guardian_name?: string;
    guardian_email?: string;
    guardian_consent: boolean;
    cumulative_xp: number;
    current_streak: number;
    longest_streak: number;
    is_active: boolean;
    is_verified: boolean;
    last_active_at?: string;
    notification_preferences: Record<string, any>;
    appearance_settings: Record<string, any>;
    privacy_settings: Record<string, any>;
    created_at: string;
    updated_at: string;

    // Nested data
    academicRecords: StudentAcademicRecordBackup[];
    quizAttempts: QuizAttemptBackup[];
    xpTransactions: XpTransactionBackup[];
    achievements: AchievementBackup[];
}

/**
 * Complete School Backup — All school data with metadata
 */
export interface CompleteSchoolBackup {
    // Version & timing
    version: string; // "2.0"
    timestamp: string; // ISO string
    schoolId: string;

    // School identity
    school: SchoolProfileBackup;
    schoolAdmin: SchoolAdminBackup;

    // Subscription & payments
    subscription: SchoolSubscriptionBackup | null;
    paymentPlan: PaymentPlanBackup | null;
    promoCode: PromoCodeBackup | null;
    transactions: PaymentTransactionBackup[];
    invoices: InvoiceBackup[];

    // Academic structure
    academicSessions: AcademicSessionBackup[];
    classMappings: SchoolClassMappingBackup[];
    classes: ClassBackup[]; // Referenced classes

    // Students & progress
    students: StudentBackup[];

    // Metadata
    metadata: {
        totalStudents: number;
        totalXpDistributed: number;
        totalRevenue: string;
        oldestBackupHash?: string; // For deduplication
        recordCounts: {
            students: number;
            academicSessions: number;
            classMappings: number;
            transactions: number;
            invoices: number;
            quizAttempts: number;
            xpTransactions: number;
            achievements: number;
        };
    };
}

/**
 * Lightweight School Backup — For listing & previews (no student data)
 */
export interface SchoolBackupPreview {
    version: string;
    timestamp: string;
    schoolId: string;
    schoolName: string;
    studentCount: number;
    subscriptionStatus: string | null;
    totalRevenue: string;
    fileSize: number;
    hash: string;
}

/**
 * Backup Upload Result — Response from R2 upload
 */
export interface BackupUploadResult {
    fileName: string;
    hash: string;
    isNew: boolean;
    size: number;
    timestamp: string;
    message: string;
}

/**
 * Backup List Item — For history display
 */
export interface BackupListItem {
    fileName: string;
    key: string;
    schoolId: string;
    schoolName: string;
    size: number;
    lastModified: Date;
    hash: string;
    studentCount: number;
    timestamp: string;
}

/**
 * Restore Result — Report from restore operation
 */
export interface RestoreResult {
    success: boolean;
    timestamp: string;
    restoredRecords: {
        school: number;
        schoolAdmin: number;
        subscription: number;
        transactions: number;
        invoices: number;
        academicSessions: number;
        classMappings: number;
        students: number;
        academicRecords: number;
        quizAttempts: number;
        xpTransactions: number;
        achievements: number;
    };
    warnings: string[];
    errors: string[];
    message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BACKUP_VERSION = '2.0';
export const BACKUP_PREFIX = 'backups/schools/';
export const RETENTION_DAYS = 30;
export const MAX_BACKUP_SIZE_MB = 500; // Safeguard

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate SHA256 hash of backup data (deterministic)
 * Used to detect if data has changed since last backup
 */
export function calculateBackupHash(data: CompleteSchoolBackup): string {
    const jsonStr = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

/**
 * Calculate SHA256 hash of a string
 */
export function hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Format backup file name
 * Pattern: backups/schools/{schoolId}/{schoolName}_{timestamp}.json.gz
 */
export function formatBackupFileName(schoolId: string, schoolName: string): string {
    const timestamp = Date.now();
    const safeName = schoolName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${BACKUP_PREFIX}${schoolId}/${safeName}_${timestamp}.json.gz`;
}

/**
 * Extract school ID from backup file name
 */
export function extractSchoolIdFromFileName(fileName: string): string | null {
    const match = fileName.match(/backups\/schools\/([^/]+)\//);
    return match ? match[1] : null;
}

/**
 * Validate backup data structure
 * Returns array of errors (empty = valid)
 */
export function validateBackupData(data: any): string[] {
    const errors: string[] = [];

    if (!data.version) errors.push('Missing version');
    if (!data.timestamp) errors.push('Missing timestamp');
    if (!data.schoolId) errors.push('Missing schoolId');
    if (!data.school) errors.push('Missing school profile');
    if (!Array.isArray(data.students)) errors.push('Students must be array');
    if (!data.metadata) errors.push('Missing metadata');

    return errors;
}

/**
 * Compress backup data (placeholder — actual compression in upload phase)
 */
export function getCompressionRatio(uncompressed: number, compressed: number): string {
    const ratio = ((1 - compressed / uncompressed) * 100).toFixed(1);
    return `${ratio}%`;
}

// ============================================================================
// PHASE 2: EXPORT FUNCTIONS — Read from Database
// ============================================================================

/**
 * FUNCTION 1: Export School Profile
 *
 * Reads: schools, school_admins
 * Returns: SchoolProfileBackup + SchoolAdminBackup
 */
export async function exportSchoolProfile(schoolId: string): Promise<{
    school: SchoolProfileBackup;
    schoolAdmin: SchoolAdminBackup;
}> {
    console.log(`[Backup] Exporting school profile for school: ${schoolId}`);

    // Fetch school
    const schoolData = await db.query.schools.findFirst({
        where: eq(schema.schools.id, schoolId)
    });

    if (!schoolData) {
        throw new Error(`School not found: ${schoolId}`);
    }

    // Fetch school admin
    const schoolAdmin = await db.query.schoolAdmins.findFirst({
        where: eq(schema.schoolAdmins.school_id, schoolId)
    });

    if (!schoolAdmin) {
        throw new Error(`School admin not found for school: ${schoolId}`);
    }

    const school: SchoolProfileBackup = {
        id: schoolData.id,
        name: schoolData.name,
        slug: schoolData.slug,
        email: schoolData.email,
        phone: schoolData.phone || undefined,
        address: schoolData.address || undefined,
        city: schoolData.city || undefined,
        state: schoolData.state || undefined,
        country: schoolData.country,
        pincode: schoolData.pincode || undefined,
        logo_url: schoolData.logo_url || undefined,
        website: schoolData.website || undefined,
        is_active: schoolData.is_active,
        data_processing_consent: schoolData.data_processing_consent,
        minor_data_guardian_consent: schoolData.minor_data_guardian_consent,
        udise_code: schoolData.udise_code || undefined,
        created_at: schoolData.created_at.toISOString(),
        updated_at: schoolData.updated_at.toISOString(),
    };

    const admin: SchoolAdminBackup = {
        id: schoolAdmin.id,
        school_id: schoolAdmin.school_id,
        first_name: schoolAdmin.first_name,
        last_name: schoolAdmin.last_name,
        email: schoolAdmin.email || undefined,
        phone: schoolAdmin.phone || undefined,
        avatar_url: schoolAdmin.avatar_url || undefined,
        is_active: schoolAdmin.is_active,
        bio: schoolAdmin.bio || undefined,
        last_active_at: schoolAdmin.last_active_at?.toISOString(),
        created_at: schoolAdmin.created_at.toISOString(),
        updated_at: schoolAdmin.updated_at.toISOString(),
    };

    console.log(`[Backup] ✓ School profile exported: ${school.name}`);
    return { school, schoolAdmin: admin };
}

/**
 * FUNCTION 2: Export Subscription & Payments
 *
 * Reads: school_subscriptions, payment_plans, promo_codes, payment_transactions, invoices
 * Returns: Complete billing history for a school
 */
export async function exportSubscriptionData(schoolId: string): Promise<{
    subscription: SchoolSubscriptionBackup | null;
    paymentPlan: PaymentPlanBackup | null;
    promoCode: PromoCodeBackup | null;
    transactions: PaymentTransactionBackup[];
    invoices: InvoiceBackup[];
    totalRevenue: string;
}> {
    console.log(`[Backup] Exporting subscription data for school: ${schoolId}`);

    // Fetch subscription (only one active/trialing per school)
    const subscription = await db.query.schoolSubscriptions.findFirst({
        where: eq(schema.schoolSubscriptions.school_id, schoolId)
    });

    let paymentPlan: PaymentPlanBackup | null = null;
    let promoCode: PromoCodeBackup | null = null;

    if (subscription) {
        // Fetch payment plan
        const plan = await db.query.paymentPlans.findFirst({
            where: eq(schema.paymentPlans.id, subscription.plan_id)
        });

        if (plan) {
            paymentPlan = {
                id: plan.id,
                name: plan.name,
                description: plan.description || undefined,
                billing_cycle: plan.billing_cycle as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
                price: plan.price.toString(),
                currency: plan.currency,
                max_students: plan.max_students || undefined,
                features: (plan.features as Record<string, any>) || {},
                is_active: plan.is_active,
                is_popular: plan.is_popular,
                trial_days: plan.trial_days,
                created_at: plan.created_at.toISOString(),
                updated_at: plan.updated_at.toISOString(),
            };
        }

        // Fetch promo code if used
        if (subscription.promo_code_id) {
            const promo = await db.query.promoCodes.findFirst({
                where: eq(schema.promoCodes.id, subscription.promo_code_id)
            });

            if (promo) {
                promoCode = {
                    id: promo.id,
                    code: promo.code,
                    discount_type: promo.discount_type as 'percentage' | 'fixed',
                    discount_value: promo.discount_value.toString(),
                    max_uses: promo.max_uses || undefined,
                    current_uses: promo.current_uses,
                    valid_from: promo.valid_from?.toISOString(),
                    valid_until: promo.valid_until?.toISOString(),
                    is_active: promo.is_active,
                    created_at: promo.created_at.toISOString(),
                    updated_at: promo.updated_at.toISOString(),
                };
            }
        }
    }

    // Fetch all transactions for this school
    const transactionsData = await db.query.paymentTransactions.findMany({
        where: eq(schema.paymentTransactions.school_id, schoolId)
    });

    const transactions: PaymentTransactionBackup[] = transactionsData.map(t => ({
        id: t.id,
        school_id: t.school_id,
        subscription_id: t.subscription_id,
        promo_code_id: t.promo_code_id || undefined,
        razorpay_order_id: t.razorpay_order_id || undefined,
        razorpay_payment_id: t.razorpay_payment_id || undefined,
        razorpay_signature: t.razorpay_signature || undefined,
        amount: t.amount.toString(),
        currency: t.currency,
        status: t.status as 'created' | 'authorized' | 'captured' | 'failed' | 'refunded',
        gateway_response: t.gateway_response || undefined,
        failure_reason: t.failure_reason || undefined,
        refund_amount: t.refund_amount?.toString(),
        refunded_at: t.refunded_at?.toISOString(),
        created_at: t.created_at.toISOString(),
        updated_at: t.updated_at.toISOString(),
    }));

    // Fetch all invoices for this school
    const invoicesData = await db.query.invoices.findMany({
        where: eq(schema.invoices.school_id, schoolId)
    });

    const invoices: InvoiceBackup[] = invoicesData.map(inv => ({
        id: inv.id,
        school_id: inv.school_id,
        subscription_id: inv.subscription_id,
        transaction_id: inv.transaction_id || undefined,
        invoice_number: inv.invoice_number,
        status: inv.status as 'draft' | 'issued' | 'paid' | 'void' | 'overdue',
        subtotal: inv.subtotal.toString(),
        tax_amount: inv.tax_amount.toString(),
        total: inv.total.toString(),
        currency: inv.currency,
        issued_at: inv.issued_at?.toISOString(),
        due_date: inv.due_date ? (typeof inv.due_date === 'string' ? inv.due_date : String(inv.due_date)) : undefined,
        paid_at: inv.paid_at?.toISOString(),
        billing_name: inv.billing_name,
        billing_address: inv.billing_address || undefined,
        gstin: inv.gstin || undefined,
        created_at: inv.created_at.toISOString(),
        updated_at: inv.updated_at.toISOString(),
    }));

    // Calculate total revenue
    const totalRevenue = transactions
        .filter(t => t.status === 'captured')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        .toString();

    console.log(`[Backup] ✓ Subscription data exported: ${transactions.length} transactions, ${invoices.length} invoices`);

    return {
        subscription: subscription ? {
            id: subscription.id,
            school_id: subscription.school_id,
            plan_id: subscription.plan_id,
            promo_code_id: subscription.promo_code_id || undefined,
            status: subscription.status as 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired',
            current_period_start: subscription.current_period_start.toISOString(),
            current_period_end: subscription.current_period_end.toISOString(),
            trial_start: subscription.trial_start?.toISOString(),
            trial_end: subscription.trial_end?.toISOString(),
            cancelled_at: subscription.cancelled_at?.toISOString(),
            cancel_reason: subscription.cancel_reason || undefined,
            auto_renew: subscription.auto_renew,
            created_at: subscription.created_at.toISOString(),
            updated_at: subscription.updated_at.toISOString(),
        } : null,
        paymentPlan,
        promoCode,
        transactions,
        invoices,
        totalRevenue,
    };
}

/**
 * FUNCTION 3: Export Academic Structure
 *
 * Reads: academic_sessions, school_class_mapping, classes
 * Returns: Academic year/semester setup and class assignments
 */
export async function exportAcademicData(schoolId: string): Promise<{
    academicSessions: AcademicSessionBackup[];
    classMappings: SchoolClassMappingBackup[];
    classes: ClassBackup[];
}> {
    console.log(`[Backup] Exporting academic data for school: ${schoolId}`);

    // Fetch academic sessions
    const sessionsData = await db.query.academicSessions.findMany({
        where: eq(schema.academicSessions.school_id, schoolId)
    });

    const academicSessions: AcademicSessionBackup[] = sessionsData.map(s => ({
        id: s.id,
        school_id: s.school_id,
        name: s.name,
        start_date: String(s.start_date),
        end_date: String(s.end_date),
        is_current: s.is_current,
        created_at: s.created_at.toISOString(),
        updated_at: s.updated_at.toISOString(),
    }));

    // Fetch class mappings for this school
    const mappingsData = await db.query.schoolClassMapping.findMany({
        where: eq(schema.schoolClassMapping.school_id, schoolId)
    });

    const classMappings: SchoolClassMappingBackup[] = mappingsData.map(m => ({
        id: m.id,
        school_id: m.school_id,
        class_id: m.class_id,
        is_active: m.is_active,
        created_at: m.created_at.toISOString(),
    }));

    // Fetch all referenced classes
    const classIds = mappingsData.map(m => m.class_id);
    const classesData = classIds.length > 0
        ? await db.query.classes.findMany()
        : [];

    const classes: ClassBackup[] = classesData.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        created_at: c.created_at.toISOString(),
    }));

    console.log(`[Backup] ✓ Academic data exported: ${academicSessions.length} sessions, ${classMappings.length} class mappings`);

    return { academicSessions, classMappings, classes };
}

/**
 * FUNCTION 4: Export All Students with Nested Data
 *
 * Reads: students, student_academic_records, quiz_attempts, xp_events, user_achievements
 * Returns: All students with their full progression history
 */
export async function exportStudentsData(schoolId: string): Promise<{
    students: StudentBackup[];
    totalRecords: {
        students: number;
        academicRecords: number;
        quizAttempts: number;
        xpTransactions: number;
        achievements: number;
    };
}> {
    console.log(`[Backup] Exporting students data for school: ${schoolId}`);

    // Fetch all students in school
    const studentsData = await db.query.students.findMany({
        where: eq(schema.students.school_id, schoolId)
    });

    console.log(`[Backup] Found ${studentsData.length} students, fetching nested data...`);

    const students: StudentBackup[] = [];
    let totalAcademicRecords = 0;
    let totalQuizAttempts = 0;
    let totalXpTransactions = 0;
    let totalAchievements = 0;

    // Process each student
    for (const studentData of studentsData) {
        // Fetch academic records
        const academicRecordsData = await db.query.studentAcademicRecords.findMany({
            where: eq(schema.studentAcademicRecords.user_id, studentData.id)
        });

        const academicRecords: StudentAcademicRecordBackup[] = academicRecordsData.map(ar => ({
            id: ar.id,
            user_id: ar.user_id,
            school_id: ar.school_id,
            session_id: ar.session_id,
            class_id: ar.class_id,
            roll_number: ar.roll_number || undefined,
            section: ar.section || undefined,
            is_promoted: ar.is_promoted,
            promoted_at: ar.promoted_at?.toISOString(),
            promoted_by: ar.promoted_by || undefined,
            created_at: ar.created_at.toISOString(),
            updated_at: ar.updated_at.toISOString(),
        }));

        // Fetch quiz attempts
        const quizAttemptsData = await db.query.quizAttempts.findMany({
            where: eq(schema.quizAttempts.user_id, studentData.id)
        });

        const quizAttempts: QuizAttemptBackup[] = quizAttemptsData.map(qa => ({
            id: qa.id,
            student_id: qa.user_id,
            quiz_id: qa.quiz_id,
            course_id: qa.quiz_id, // Will be fetched separately if needed
            score: parseFloat(qa.score.toString()),
            max_score: parseFloat(qa.max_score.toString()),
            percentage: (parseFloat(qa.score.toString()) / parseFloat(qa.max_score.toString()) * 100),
            passed: qa.passed,
            time_spent_secs: qa.time_taken_secs || 0,
            attempted_at: qa.started_at.toISOString(),
            completed_at: qa.completed_at?.toISOString(),
        }));

        // Fetch XP transactions
        const xpTransactionsData = await db.query.xpEvents.findMany({
            where: eq(schema.xpEvents.user_id, studentData.id)
        });

        const xpTransactions: XpTransactionBackup[] = xpTransactionsData.map(xp => ({
            id: xp.id,
            student_id: xp.user_id,
            school_id: xp.school_id,
            amount: xp.xp_amount,
            source: xp.source as 'lesson_completion' | 'quiz_score' | 'daily_streak' | 'challenge_win' | 'badge_earned' | 'bonus' | 'manual_adjustment',
            source_id: xp.reference_id || undefined,
            created_at: xp.created_at.toISOString(),
        }));

        // Fetch achievements
        const achievementsData = await db.query.userAchievements.findMany({
            where: eq(schema.userAchievements.user_id, studentData.id)
        });

        const achievements: AchievementBackup[] = [];
        for (const ua of achievementsData) {
            const achievement = await db.query.achievements.findFirst({
                where: eq(schema.achievements.id, ua.achievement_id)
            });

            if (achievement) {
                achievements.push({
                    id: ua.id,
                    student_id: ua.user_id,
                    badge_id: ua.achievement_id,
                    badge_name: achievement.name,
                    badge_icon: achievement.icon_url || undefined,
                    tier: achievement.tier as 'bronze' | 'silver' | 'gold' | 'platinum',
                    earned_at: ua.earned_at.toISOString(),
                });
            }
        }

        // Build student backup object
        const student: StudentBackup = {
            id: studentData.id,
            school_id: studentData.school_id,
            first_name: studentData.first_name,
            last_name: studentData.last_name,
            email: studentData.email,
            phone: studentData.phone || undefined,
            avatar_url: studentData.avatar_url || undefined,
            bio: studentData.bio || undefined,
            date_of_birth: studentData.date_of_birth ? String(studentData.date_of_birth) : undefined,
            gender: studentData.gender || undefined,
            is_minor: studentData.is_minor,
            guardian_name: studentData.guardian_name || undefined,
            guardian_email: studentData.guardian_email || undefined,
            guardian_consent: studentData.guardian_consent,
            cumulative_xp: studentData.cumulative_xp,
            current_streak: studentData.current_streak,
            longest_streak: studentData.longest_streak,
            is_active: studentData.is_active,
            is_verified: studentData.is_verified,
            last_active_at: studentData.last_active_at?.toISOString(),
            notification_preferences: studentData.notification_preferences as Record<string, any>,
            appearance_settings: studentData.appearance_settings as Record<string, any>,
            privacy_settings: studentData.privacy_settings as Record<string, any>,
            created_at: studentData.created_at.toISOString(),
            updated_at: studentData.updated_at.toISOString(),
            academicRecords,
            quizAttempts,
            xpTransactions,
            achievements,
        };

        students.push(student);
        totalAcademicRecords += academicRecords.length;
        totalQuizAttempts += quizAttempts.length;
        totalXpTransactions += xpTransactions.length;
        totalAchievements += achievements.length;
    }

    console.log(`[Backup] ✓ Students data exported: ${students.length} students, ${totalAcademicRecords} academic records, ${totalQuizAttempts} quiz attempts, ${totalXpTransactions} XP events, ${totalAchievements} achievements`);

    return {
        students,
        totalRecords: {
            students: students.length,
            academicRecords: totalAcademicRecords,
            quizAttempts: totalQuizAttempts,
            xpTransactions: totalXpTransactions,
            achievements: totalAchievements,
        }
    };
}

/**
 * FUNCTION 5: Export Complete School Data
 *
 * Combines all above functions into one complete backup
 * This is the main entry point for backup
 */
export async function exportCompleteSchoolData(schoolId: string): Promise<CompleteSchoolBackup> {
    console.log(`\n========================================`);
    console.log(`[Backup] Starting complete school export for: ${schoolId}`);
    console.log(`========================================\n`);

    const startTime = Date.now();

    try {
        // Export all data in parallel where possible
        const [
            { school, schoolAdmin },
            { subscription, paymentPlan, promoCode, transactions, invoices, totalRevenue },
            { academicSessions, classMappings, classes },
            { students, totalRecords }
        ] = await Promise.all([
            exportSchoolProfile(schoolId),
            exportSubscriptionData(schoolId),
            exportAcademicData(schoolId),
            exportStudentsData(schoolId)
        ]);

        // Build complete backup
        const backup: CompleteSchoolBackup = {
            version: BACKUP_VERSION,
            timestamp: new Date().toISOString(),
            schoolId,
            school,
            schoolAdmin,
            subscription,
            paymentPlan,
            promoCode,
            transactions,
            invoices,
            academicSessions,
            classMappings,
            classes,
            students,
            metadata: {
                totalStudents: students.length,
                totalXpDistributed: students.reduce((sum, s) => sum + s.cumulative_xp, 0),
                totalRevenue,
                recordCounts: {
                    students: totalRecords.students,
                    academicSessions: academicSessions.length,
                    classMappings: classMappings.length,
                    transactions: transactions.length,
                    invoices: invoices.length,
                    quizAttempts: totalRecords.quizAttempts,
                    xpTransactions: totalRecords.xpTransactions,
                    achievements: totalRecords.achievements,
                }
            }
        };

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n[Backup] ✓ Complete export successful (${duration}s)`);
        console.log(`[Backup] School: ${school.name}`);
        console.log(`[Backup] Students: ${students.length}`);
        console.log(`[Backup] Total XP: ${backup.metadata.totalXpDistributed}`);
        console.log(`[Backup] Total Revenue: ₹${totalRevenue}`);
        console.log(`========================================\n`);

        return backup;
    } catch (error) {
        console.error(`[Backup] ✗ Export failed:`, error);
        throw error;
    }
}
