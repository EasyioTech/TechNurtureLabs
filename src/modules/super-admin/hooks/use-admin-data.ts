'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    fetchAllAdminData,
    fetchCourseLessons,
    saveCourseAdmin,
    deleteCourseAdmin,
    saveLessonAdmin,
    deleteLessonAdmin,
    saveLessonOrderAdmin,
    savePlanAdmin,
    deletePlanAdmin,
    toggleSchoolStatus as toggleSchoolStatusAction,
    saveSchoolAdmin,
    deleteQuizAdmin,
    assignPlanToSchool,
    savePromoCode as savePromoCodeAction,
    deletePromoCode as deletePromoCodeAction,
} from '../actions';

export const USER_METRICS_PAGE_SIZE = 25;
import {
    Course, Lesson, PaymentPlan, Stats, UserMetric, CourseMetric, SchoolInfo, PromoCode,
} from '../types';

const DEFAULT_STATS: Stats = {
    totalStudents: 0, activeStudents: 0,
    totalSchools: 0, activeSchools: 0,
    totalCourses: 0, publishedCourses: 0,
    totalLessons: 0, totalXp: 0, avgCompletion: 0,
    totalRevenue: 0, activeSubscriptions: 0, totalEnrollments: 0,
};

export function useAdminData() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [schoolsList, setSchoolsList] = useState<SchoolInfo[]>([]);
    const [userMetrics, setUserMetrics] = useState<UserMetric[]>([]);
    const [courseMetrics, setCourseMetrics] = useState<CourseMetric[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [courseClassMappings, setCourseClassMappings] = useState<any[]>([]);
    const [platformSettings, setPlatformSettings] = useState<any | null>(null);
    const [platformMetrics, setPlatformMetrics] = useState<any[]>([]);
    // Pagination
    const [userMetricsPage, setUserMetricsPage] = useState(0);

    // Dialog state
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [showLessonDialog, setShowLessonDialog] = useState(false);
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    const [showSchoolDialog, setShowSchoolDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
    const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
    const [editingPlan, setEditingPlan] = useState<Partial<PaymentPlan> | null>(null);
    const [showPromoCodeDialog, setShowPromoCodeDialog] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<Partial<PromoCode> | null>(null);
    const [editingSchoolItem, setEditingSchoolItem] = useState<Partial<SchoolInfo> | null>(null);

    useEffect(() => { fetchAllData(true); }, []);

    async function fetchAllData(isInitial = false) {
        if (isInitial) setLoading(true);
        const data = await fetchAllAdminData();

        const students = data.students || [];
        const schoolsRaw = data.schools || [];
        const coursesData = data.courses || [];
        const lessonsData = data.lessons || [];
        const plansData = data.plans || [];
        const progressData = data.progress || [];
        const enrollmentsData = data.enrollments || [];
        const subscriptionsData = data.subscriptions || [];
        const transactionsData = data.transactions || [];
        const courseProgressData = data.courseProgress || [];
        const promoCodesData = data.promoCodes || [];

        const getUserLastActivity = (studentId: string) => {
            const userProgress = progressData.filter(p => p.user_id === studentId);
            if (userProgress.length === 0) return null;
            return userProgress.reduce((latest, p) => {
                const pDate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
                return pDate > latest ? pDate : latest;
            }, 0);
        };

        const activeCount = students.filter(s =>
            getUserLastActivity(s.id) && getUserLastActivity(s.id)! > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;

        const completedLessons = progressData.filter(p => p.completed_at != null).length;
        const avgCompletion = progressData.length > 0
            ? Math.round((completedLessons / progressData.length) * 100) : 0;

        const activeSubs = subscriptionsData.filter(s => s.status === 'active' || s.status === 'trialing').length;
        const totalRevenue = transactionsData
            .filter(t => t.status === 'captured')
            .reduce((a, t) => a + Number(t.amount || 0), 0);

        setStats({
            totalStudents: students.length,
            activeStudents: activeCount,
            totalSchools: schoolsRaw.length,
            activeSchools: schoolsRaw.filter(s => s.is_active).length,
            totalCourses: coursesData.length,
            publishedCourses: coursesData.filter(c => c.is_published).length,
            totalLessons: lessonsData.length,
            totalXp: students.reduce((a, s) => a + (s.total_xp || 0), 0),
            avgCompletion,
            totalRevenue,
            activeSubscriptions: activeSubs,
            totalEnrollments: enrollmentsData.length,
        });

        setCourses(coursesData.map(c => {
            const courseLessonIds = lessonsData.filter(l => l.course_id === c.id).map(l => l.id);
            const enrolledUsers = new Set(enrollmentsData.filter(e => e.course_id === c.id).map(e => e.user_id));
            return {
                ...c,
                lesson_count: courseLessonIds.length,
                enrolled_count: enrolledUsers.size,
                total_lessons: c.total_lessons || courseLessonIds.length,
                total_xp: c.total_xp || 0,
            };
        }));

        setPaymentPlans(plansData.map((p: any) => ({
            ...p,
            price: Number(p.price),
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
            trial_days: p.trial_days || 0,
            currency: p.currency || 'INR',
        })));

        setSchoolsList(schoolsRaw.map(s => {
            const sub = subscriptionsData.find(sub => sub.school_id === s.id);
            const plan = sub ? plansData.find(p => p.id === sub.plan_id) : null;
            return {
                ...s,
                plan_name: plan?.name || 'No Plan',
                subscription_status: sub?.status || 'inactive',
                student_count: students.filter(st => st.school_id === s.id).length,
                data_processing_consent: true,
                minor_data_guardian_consent: true,
            };
        }));
        setPromoCodes(promoCodesData);
        setUserMetricsPage(0); // reset to page 1 on data refresh
        setUserMetrics(students.map(s => {
            const school = schoolsRaw.find(sch => sch.id === s.school_id);
            const userProgress = progressData.filter(p => p.user_id === s.id);

            let activeStreak = s.current_streak || 0;
            const actTime = getUserLastActivity(s.id) || (s.last_active_at ? new Date(s.last_active_at).getTime() : 0);
            if (actTime && activeStreak > 0) {
                const lastDate = new Date(actTime);
                lastDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.round(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 1) activeStreak = 0; // Streak currently broken
            }

            return {
                id: s.id, full_name: s.full_name, email: s.email,
                school_name: school?.name || 'Unassigned',
                total_xp: s.total_xp || 0, level: s.level || 1,
                current_streak: activeStreak,
                longest_streak: s.longest_streak || 0,
                lessons_completed: userProgress.filter(p => p.completed_at != null).length,
                last_activity: actTime ? new Date(actTime).toISOString() : null,
            };
        }));

        setCourseMetrics(coursesData.map(c => {
            const courseLessons = lessonsData.filter(l => l.course_id === c.id);
            const courseProgressEntry = courseProgressData.filter(cp => cp.course_id === c.id);
            const uniqueEnrolled = new Set(enrollmentsData.filter(e => e.course_id === c.id).map(e => e.user_id));
            const completed = courseProgressEntry.filter(cp => cp.completed_at != null).length;
            const totalTimeSecs = courseProgressEntry.reduce((sum, cp) => sum + (cp.total_time_secs || 0), 0);
            const totalXpEarned = courseProgressEntry.reduce((sum, cp) => sum + (cp.total_xp_earned || 0), 0);
            return {
                id: c.id, title: c.title,
                is_published: c.is_published,
                lesson_count: courseLessons.length,
                enrolled_count: uniqueEnrolled.size,
                completion_rate: courseProgressEntry.length > 0 ? Math.round((completed / courseProgressEntry.length) * 100) : 0,
                avg_xp: courseProgressEntry.length > 0 ? Math.round(totalXpEarned / courseProgressEntry.length) : 0,
                total_time_mins: Math.round(totalTimeSecs / 60),
            };
        }));

        setClasses(data.classes || []);
        setCourseClassMappings(data.courseClassMappings || []);
        setPlatformSettings(data.platformSettings || null);

        setPlatformMetrics(data.platformMetrics || []);

        setLoading(false);
    }

    // Course CRUD
    async function selectCourse(course: Course) {
        setSelectedCourse(course);
        const data = await fetchCourseLessons(course.id);
        setLessons(data as any || []);
    }

    async function saveCourse() {
        if (!editingCourse?.title) { toast.error('Course title is required'); return; }
        try {
            await saveCourseAdmin(editingCourse);
            toast.success(editingCourse.id ? 'Course updated' : 'Course created');
        } catch { toast.error('Failed to save course'); }
        setShowCourseDialog(false); setEditingCourse(null); fetchAllData();
    }

    async function deleteCourse(id: string) {
        try {
            await deleteCourseAdmin(id);
            toast.success('Course deleted');
            if (selectedCourse?.id === id) { setSelectedCourse(null); setLessons([]); }
            fetchAllData();
        } catch { toast.error('Failed to delete course'); }
    }

    // Lesson CRUD
    async function saveLesson() {
        if (!editingLesson?.title || !selectedCourse) { toast.error('Lesson title is required'); return; }
        try {
            await saveLessonAdmin({
                ...editingLesson,
                course_id: editingLesson.course_id || selectedCourse.id,
                sequence_index: editingLesson.sequence_index ?? lessons.length,
            });
            toast.success(editingLesson.id ? 'Lesson updated' : 'Lesson created');
        } catch { toast.error('Failed to save lesson'); }
        setShowLessonDialog(false); setEditingLesson(null); selectCourse(selectedCourse);
        fetchAllData();
    }

    async function deleteLesson(id: string) {
        try {
            await deleteLessonAdmin(id);
            toast.success('Lesson deleted');
            if (selectedCourse) selectCourse(selectedCourse);
            fetchAllData();
        } catch { toast.error('Failed to delete lesson'); }
    }

    async function saveLessonOrder(customLessons?: Lesson[], silent = false) {
        if (!selectedCourse) return;
        const targetLessons = customLessons || lessons;
        const updates = targetLessons.map((lesson, index) => ({
            id: lesson.id, course_id: lesson.course_id, title: lesson.title, sequence_index: index,
        }));
        try {
            await saveLessonOrderAdmin(updates);
            if (!silent) toast.success('Order saved');
        } catch {
            if (!silent) toast.error('Failed to save order');
        }
    }

    // Plan CRUD
    async function savePlan() {
        if (!editingPlan?.name) { toast.error('Plan name is required'); return; }
        try {
            await savePlanAdmin({
                id: editingPlan.id, name: editingPlan.name,
                description: editingPlan.description || '', price: editingPlan.price || 0,
                billing_cycle: editingPlan.billing_cycle || 'monthly',
                currency: editingPlan.currency || 'INR',
                features: editingPlan.features || [], max_students: editingPlan.max_students,
                trial_days: editingPlan.trial_days || 0,
                is_active: editingPlan.is_active ?? true,
            });
            toast.success(editingPlan.id ? 'Plan updated' : 'Plan created');
        } catch { toast.error('Failed to save plan'); }
        setShowPlanDialog(false); setEditingPlan(null); fetchAllData();
    }

    async function deletePlan(id: string) {
        try { await deletePlanAdmin(id); toast.success('Plan deleted'); fetchAllData(); }
        catch { toast.error('Failed to delete plan'); }
    }

    // Promo Code CRUD
    async function savePromoCode() {
        if (!editingPromoCode?.code) { toast.error('Promo Code is required'); return; }
        if (!editingPromoCode?.discount_type) { toast.error('Discount Type is required'); return; }
        if (editingPromoCode.discount_value == null || Number(editingPromoCode.discount_value) <= 0) { toast.error('Valid Discount Value is required'); return; }

        try {
            await savePromoCodeAction({
                id: editingPromoCode.id,
                code: editingPromoCode.code,
                discount_type: editingPromoCode.discount_type,
                discount_value: editingPromoCode.discount_value,
                max_uses: editingPromoCode.max_uses,
                valid_from: editingPromoCode.valid_from,
                valid_until: editingPromoCode.valid_until,
                is_active: editingPromoCode.is_active ?? true,
            });
            toast.success(editingPromoCode.id ? 'Promo Code updated' : 'Promo Code created');
        } catch { toast.error('Failed to save promo code'); }
        setShowPromoCodeDialog(false); setEditingPromoCode(null); fetchAllData();
    }

    async function deletePromoCode(id: string) {
        try { await deletePromoCodeAction(id); toast.success('Promo Code deleted'); fetchAllData(); }
        catch { toast.error('Failed to delete promo code'); }
    }

    // Quiz
    async function deleteQuiz(quizId: string) {
        try {
            await deleteQuizAdmin(quizId);
            toast.success('Quiz deleted');
            if (selectedCourse) selectCourse(selectedCourse);
            fetchAllData();
        } catch { toast.error('Failed to delete quiz'); }
    }

    // School CRUD
    async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
        try {
            await toggleSchoolStatusAction(schoolId, isActive);
            toast.success(`School ${isActive ? 'activated' : 'deactivated'}`);
            fetchAllData();
        } catch { toast.error('Failed to update school status'); }
    }

    async function assignPlan(schoolId: string, planId: string, billingMonths: number = 12) {
        try {
            await assignPlanToSchool(schoolId, planId, billingMonths);
            toast.success('Plan assigned successfully');
            fetchAllData();
        } catch { toast.error('Failed to assign plan'); }
    }

    async function saveSchool(schoolData: Partial<SchoolInfo>) {
        try {
            if (!schoolData.name || !schoolData.email) {
                toast.error('Name and Email are required');
                return;
            }
            await saveSchoolAdmin(schoolData);
            toast.success(schoolData.id ? 'Institution updated' : 'Institution created');
            setShowSchoolDialog(false);
            setEditingSchoolItem(null);
            fetchAllData();
        } catch { toast.error('Failed to save institution'); }
    }



    return {
        loading, stats, courses, selectedCourse, lessons, setLessons,
        paymentPlans, promoCodes, schoolsList, userMetrics, courseMetrics,
        classes, courseClassMappings, platformSettings, platformMetrics,
        userMetricsPage, setUserMetricsPage,
        showCourseDialog, setShowCourseDialog, editingCourse, setEditingCourse,
        showLessonDialog, setShowLessonDialog, editingLesson, setEditingLesson,
        showPlanDialog, setShowPlanDialog, editingPlan, setEditingPlan,
        showPromoCodeDialog, setShowPromoCodeDialog, editingPromoCode, setEditingPromoCode,
        showSchoolDialog, setShowSchoolDialog, editingSchoolItem, setEditingSchoolItem,

        fetchAllData, selectCourse, saveCourse, deleteCourse,
        saveLesson, deleteLesson, saveLessonOrder, deleteQuiz,
        savePlan, deletePlan, savePromoCode, deletePromoCode, toggleSchoolStatus, saveSchool, assignPlan,
    };
}
