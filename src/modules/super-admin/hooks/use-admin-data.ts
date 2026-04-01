'use client';

import { useEffect } from 'react';
import { useAdminMeta } from './use-admin-meta';
import { useAdminCourses } from './use-admin-courses';
import { useAdminSchools } from './use-admin-schools';
import { useAdminLibrary } from './use-admin-library';
import { useAdminCertifications } from './use-admin-certifications';

export { USER_METRICS_PAGE_SIZE } from './use-admin-schools';

/**
 * Composes the four focused sub-hooks into a single unified API.
 * Each sub-hook owns its own state slice and handles its mutations surgically —
 * mutations only reload the data they affect, not the entire dashboard.
 */
export function useAdminData() {
    const meta    = useAdminMeta();
    const courses = useAdminCourses();
    const schools = useAdminSchools();
    const library = useAdminLibrary();
    const certs   = useAdminCertifications();

    // Load stats + metadata once on mount
    useEffect(() => { meta.fetchInitialData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // ── Meta (stats, plans, promos, settings) ─────────────────
        loading:          meta.loading,
        stats:            meta.stats,
        paymentPlans:     meta.paymentPlans,
        promoCodes:       meta.promoCodes,
        classes:          meta.classes,
        platformSettings: meta.platformSettings,
        platformMetrics:  meta.platformMetrics,
        loginHeatmap:     meta.loginHeatmap,
        fetchInitialData: meta.fetchInitialData,
        fetchAllData:     meta.fetchInitialData, // backward-compat alias

        showPlanDialog: meta.showPlanDialog, setShowPlanDialog: meta.setShowPlanDialog,
        editingPlan: meta.editingPlan, setEditingPlan: meta.setEditingPlan,
        showPromoCodeDialog: meta.showPromoCodeDialog, setShowPromoCodeDialog: meta.setShowPromoCodeDialog,
        editingPromoCode: meta.editingPromoCode, setEditingPromoCode: meta.setEditingPromoCode,
        savePlan: meta.savePlan, deletePlan: meta.deletePlan,
        savePromoCode: meta.savePromoCode, deletePromoCode: meta.deletePromoCode,
        syncMetrics: meta.syncMetrics,

        // ── Courses & Lessons ──────────────────────────────────────
        courses:          courses.courses,
        selectedCourse:   courses.selectedCourse,
        lessons:          courses.lessons,
        setLessons:       courses.setLessons,
        courseClassMappings: courses.courseClassMappings,
        coursesPage:      courses.coursesPage,
        setCoursesPage:   courses.setCoursesPage,
        totalCoursesPages: courses.totalCoursesPages,

        showCourseDialog: courses.showCourseDialog, setShowCourseDialog: courses.setShowCourseDialog,
        editingCourse: courses.editingCourse, setEditingCourse: courses.setEditingCourse,
        showLessonDialog: courses.showLessonDialog, setShowLessonDialog: courses.setShowLessonDialog,
        editingLesson: courses.editingLesson, setEditingLesson: courses.setEditingLesson,

        loadCourses:    courses.loadCourses,
        selectCourse:   courses.selectCourse,
        saveCourse:     courses.saveCourse,
        deleteCourse:   courses.deleteCourse,
        saveLesson:     courses.saveLesson,
        deleteLesson:   courses.deleteLesson,
        saveLessonOrder: courses.saveLessonOrder,
        deleteQuiz:     courses.deleteQuiz,
        cloneLesson:    courses.cloneLesson,
        cloneQuiz:      courses.cloneQuiz,

        // ── Schools & Students ─────────────────────────────────────
        schoolsList:       schools.schoolsList,
        userMetrics:       schools.userMetrics,
        schoolsPage:       schools.schoolsPage,
        setSchoolsPage:    schools.setSchoolsPage,
        totalSchoolsPages: schools.totalSchoolsPages,
        userMetricsPage:   schools.userMetricsPage,
        setUserMetricsPage: schools.setUserMetricsPage,
        totalStudentsCount: schools.totalStudentsCount,
        totalStudentPages: schools.totalStudentPages,
        studentsLoading:   schools.studentsLoading,
        schoolsLoading:    schools.schoolsLoading,
        hasMoreSchools:    schools.hasMoreSchools,

        showSchoolDialog: schools.showSchoolDialog, setShowSchoolDialog: schools.setShowSchoolDialog,
        editingSchoolItem: schools.editingSchoolItem, setEditingSchoolItem: schools.setEditingSchoolItem,

        loadStudents:       schools.loadStudents,
        loadSchools:        schools.loadSchools,
        toggleSchoolStatus: schools.toggleSchoolStatus,
        assignPlan:         schools.assignPlan,
        saveSchool:         schools.saveSchool,

        // ── Library ────────────────────────────────────────────────
        globalLessons:           library.globalLessons,
        globalQuizzes:           library.globalQuizzes,
        globalLoading:           library.globalLoading,
        globalLessonsPage:       library.globalLessonsPage,
        totalGlobalLessonsPages: library.totalGlobalLessonsPages,
        globalQuizzesPage:       library.globalQuizzesPage,
        totalGlobalQuizzesPages: library.totalGlobalQuizzesPages,
        loadGlobalLessons:       library.loadGlobalLessons,
        loadGlobalQuizzes:       library.loadGlobalQuizzes,

        // ── Certifications ─────────────────────────────────────────
        certCourses:           certs.certCourses,
        certLoading:           certs.certLoading,
        certInitialized:       certs.certInitialized,
        loadCertCourses:       certs.loadCertCourses,
        saveCert:              certs.saveCert,
        deleteCert:            certs.deleteCert,
        getCompletedStudents:  certs.getCompletedStudents,
        issueCert:             certs.issueCert,
        revokeCert:            certs.revokeCert,
    };
}
