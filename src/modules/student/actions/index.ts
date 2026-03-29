'use server';

// Import all actions
import { 
    getStudentProfileData, 
    getStudentActivitiesAction, 
    deleteStudentAccountAction,
    updateStudentBio,
    updateStudentProfile,
    updateStudentAvatar,
    getStudentProfileAndStats
} from './profile-actions';

import {
    getStudentAchievementsData,
    checkAndAwardAchievements,
    seedAchievementsData
} from './achievement-actions';

import { 
    ensureEnrollment, 
    getCourseDetailsData, 
    getStudentDashboardCourses,
    invalidateStudentDashboardCache
} from './course-actions';

import { 
    getLessonData, 
    completeLessonAndReward, 
    saveVideoProgress, 
    submitAssignment, 
    getSubmissionStatus,
    updateTimeSpent,
    submitQuizAttempt,
    getQuizData
} from './lesson-actions';

import { 
    getOrGenerateDailyChallenges,
    updateDailyChallengeProgress
} from './challenge-actions';

import { 
    updateNotificationPreferences, 
    updateAppearanceSettings, 
    updatePrivacySettings 
} from './settings-actions';

// Export all actions
export {
    // Profile
    getStudentProfileData,
    getStudentActivitiesAction,
    deleteStudentAccountAction,
    updateStudentBio,
    updateStudentProfile,
    updateStudentAvatar,
    getStudentProfileAndStats,

    // Achievements
    getStudentAchievementsData as getStudentAchievementsAction,
    getStudentAchievementsData,
    checkAndAwardAchievements,
    seedAchievementsData,

    // Courses
    ensureEnrollment,
    getCourseDetailsData,
    getStudentDashboardCourses,
    invalidateStudentDashboardCache,

    // Lessons
    getLessonData,
    completeLessonAndReward,
    saveVideoProgress,
    submitAssignment,
    getSubmissionStatus,
    updateTimeSpent,
    submitQuizAttempt,
    getQuizData,

    // Challenges
    getOrGenerateDailyChallenges,
    updateDailyChallengeProgress,

    // Settings
    updateNotificationPreferences,
    updateAppearanceSettings,
    updatePrivacySettings
};
