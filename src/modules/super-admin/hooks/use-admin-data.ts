'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    fetchAdminStats,
    fetchAdminStudents,
    fetchAdminSchools,
    fetchAdminCourses,
    fetchAdminMetadata,
    fetchCourseLessons,
    saveCourseAdmin,
    deleteCourseAdmin,
    saveLessonAdmin,
    deleteLessonAdmin,
    saveLessonOrderAdmin,
    fetchLessonAdmin,
    cloneLessonAction,
    fetchGlobalLessons,
    fetchQuizAdmin,
    saveQuizAdmin,
    cloneQuizAction,
    fetchGlobalQuizzes,
    savePlanAdmin,
    deletePlanAdmin,
    toggleSchoolStatus as toggleSchoolStatusAction,
    saveSchoolAdmin,
    deleteQuizAdmin,
    assignPlanToSchool,
    savePromoCode as savePromoCodeAction,
    deletePromoCode as deletePromoCodeAction,
    syncPlatformMetrics,
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
    totalRevenue: 0, activeSubscriptions: 0, 
    trialingSubscriptions: 0, activePlansPercentage: 0
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
    const [globalLessons, setGlobalLessons] = useState<any[]>([]);
    const [globalQuizzes, setGlobalQuizzes] = useState<any[]>([]);
    const [globalLoading, setGlobalLoading] = useState(false);
    // Pagination
    const [userMetricsPage, setUserMetricsPage] = useState(0);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    const [totalStudentPages, setTotalStudentPages] = useState(0);
    const [studentsLoading, setStudentsLoading] = useState(false);

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

    useEffect(() => { fetchInitialData(); }, []);

    async function fetchInitialData() {
        setLoading(true);
        try {
            const [statsData, metaData] = await Promise.all([
                fetchAdminStats(),
                fetchAdminMetadata()
            ]);

            setStats(statsData);
            setPaymentPlans(metaData.plans);
            setPromoCodes(metaData.promoCodes);
            setClasses(metaData.classes);
            setPlatformSettings(metaData.platformSettings);
            setPlatformMetrics(metaData.platformMetrics);
        } catch (error) {
            console.error("Initial load error:", error);
            toast.error("Failed to load dashboard stats");
        } finally {
            setLoading(false);
        }
    }

    async function loadStudents(page = 0, search?: string) {
        setStudentsLoading(true);
        try {
            const data = await fetchAdminStudents(page, USER_METRICS_PAGE_SIZE, search);
            setUserMetrics(data.students.map((s: any) => ({
                id: s.id,
                full_name: s.full_name,
                email: s.email || '',
                school_name: 'Loading...', 
                total_xp: s.total_xp,
                level: s.level,
                current_streak: s.current_streak || 0,
                longest_streak: s.longest_streak || 0,
                lessons_completed: 0, 
                last_activity: s.last_active_at ? s.last_active_at.toISOString() : null,
            })));
            setTotalStudentsCount(data.total);
            setTotalStudentPages(data.pages);
        } catch (error) {
            toast.error("Failed to load students");
            console.error(error);
        } finally {
            setStudentsLoading(false);
        }
    }

    async function loadSchools() {
        try {
            const data = await fetchAdminSchools();
            setSchoolsList(data as any);
        } catch (error) {
            toast.error("Failed to load schools");
        }
    }

    async function loadCourses() {
        try {
            const data = await fetchAdminCourses();
            setCourses(data as any);
        } catch (error) {
            toast.error("Failed to load courses");
        }
    }

    // Legacy support for refresh requests
    async function fetchAllData() {
        await fetchInitialData();
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
        
        // Ensure each update has a valid ID and sequence index
        const updates = targetLessons.map((lesson, index) => ({
            id: lesson.id,
            sequence_order: index + 1 // Use 1-based indexing for DB sequence_order
        }));

        if (updates.length === 0) return;

        try {
            console.log(`[useAdminData] Saving lesson order for ${updates.length} lessons`);
            await saveLessonOrderAdmin(updates);
            if (!silent) toast.success('Order saved');
        } catch (err: any) {
            console.error('[useAdminData] Failed to save lesson order:', err);
            if (!silent) toast.error('Failed to save order: ' + (err.message || 'Unknown error'));
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
        totalStudentsCount, totalStudentPages, studentsLoading,
        showCourseDialog, setShowCourseDialog, editingCourse, setEditingCourse,
        showLessonDialog, setShowLessonDialog, editingLesson, setEditingLesson,
        showPlanDialog, setShowPlanDialog, editingPlan, setEditingPlan,
        showPromoCodeDialog, setShowPromoCodeDialog, editingPromoCode, setEditingPromoCode,
        showSchoolDialog, setShowSchoolDialog, editingSchoolItem, setEditingSchoolItem,

        fetchAllData, fetchInitialData, loadStudents, loadSchools, loadCourses, selectCourse, saveCourse, deleteCourse,
        saveLesson, deleteLesson, saveLessonOrder, deleteQuiz,
        savePlan, deletePlan, savePromoCode, deletePromoCode, toggleSchoolStatus, saveSchool, assignPlan,

        loadGlobalLessons: async () => {
            setGlobalLoading(true);
            try { setGlobalLessons(await fetchGlobalLessons()); }
            catch { toast.error("Failed to load global lessons"); }
            finally { setGlobalLoading(false); }
        },
        loadGlobalQuizzes: async () => {
            setGlobalLoading(true);
            try { setGlobalQuizzes(await fetchGlobalQuizzes()); }
            catch { toast.error("Failed to load global quizzes"); }
            finally { setGlobalLoading(false); }
        },
        cloneLesson: async (lessonId: string, targetCourseId: string) => {
            try {
                await cloneLessonAction(lessonId, targetCourseId);
                toast.success("Lesson cloned successfully");
                if (selectedCourse?.id === targetCourseId) selectCourse(selectedCourse);
            } catch { toast.error("Failed to clone lesson"); }
        },
        cloneQuiz: async (quizId: string, targetCourseId: string) => {
            console.log(`[useAdminData] Atttempting to clone quiz ${quizId} to course ${targetCourseId}`);
            try {
                const res = await cloneQuizAction(quizId, null, targetCourseId);
                console.log(`[useAdminData] Clone success:`, res);
                toast.success("Quiz cloned successfully");
                if (selectedCourse?.id === targetCourseId) selectCourse(selectedCourse);
            } catch (err: any) { 
                console.error(`[useAdminData] Clone failed:`, err);
                toast.error("Failed to clone quiz: " + (err.message || "Unknown error")); 
            }
        },
        syncMetrics: async () => {
            try {
                const res = await syncPlatformMetrics();
                if (res.success) {
                    toast.success("Metrics synced");
                    fetchInitialData();
                } else throw new Error();
            } catch { toast.error("Sync failed"); }
        },
        globalLessons, globalQuizzes, globalLoading
    };
}
