// This file re-exports server actions from sub-files. 
// Do not use 'use server' here as it can cause build errors with re-exports.


export { fetchAdminStats } from './sub-actions/stats-actions';
export { fetchAdminSchools, saveSchoolAdmin, toggleSchoolStatus, assignPlanToSchool } from './sub-actions/school-actions';
export { fetchAdminCourses, saveCourseAdmin, deleteCourseAdmin } from './sub-actions/course-actions';
export { fetchCourseLessons, saveLessonAdmin, deleteLessonAdmin, saveLessonOrderAdmin, fetchLessonAdmin, cloneLessonAction, fetchGlobalLessons } from './sub-actions/lesson-actions';
export { fetchQuizAdmin, saveQuizAdmin, deleteQuizAdmin, cloneQuizAction, fetchGlobalQuizzes } from './sub-actions/quiz-actions';
export { fetchAdminMetadata, fetchAdminOverviewExtras, savePlanAdmin, deletePlanAdmin, savePromoCode, deletePromoCode, validatePromoCode, fetchAllClasses, createClass, deleteClass, ensureDefaultClasses, syncPlatformMetrics } from './sub-actions/meta-actions';
export { fetchAdminStudents, invalidateAdminCache } from './sub-actions/student-actions';
export { getSystemHealth } from './redis-monitoring';
export {
    fetchCoursesWithCertificates,
    saveCertificateConfig,
    deleteCertificateConfig,
    fetchCompletedStudents,
    issueCertificate,
    revokeCertificate,
} from './sub-actions/certificate-actions';
