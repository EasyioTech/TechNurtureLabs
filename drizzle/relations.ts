import { relations } from "drizzle-orm/relations";
import { courses, courseClassMapping, classes, schools, schoolClassMapping, invoices, schoolSubscriptions, paymentTransactions, users, auditLogs, courseMetricsDaily, academicSessions, courseProgress, enrollments, emailVerificationTokens, promoCodes, loginAttempts, mediaAssets, passwordResetTokens, quizAttempts, quizzes, lessonProgress, lessons, quizQuestions, paymentPlans, userAchievements, achievements, userDailyChallenges, dailyChallenges, certificates, schoolMetricsDaily, studentAcademicRecords, userCertificates, xpEvents } from "./schema";

export const courseClassMappingRelations = relations(courseClassMapping, ({one}) => ({
	course: one(courses, {
		fields: [courseClassMapping.courseId],
		references: [courses.id]
	}),
	class: one(classes, {
		fields: [courseClassMapping.classId],
		references: [classes.id]
	}),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	courseClassMappings: many(courseClassMapping),
	user: one(users, {
		fields: [courses.createdBy],
		references: [users.id]
	}),
	courseMetricsDailies: many(courseMetricsDaily),
	courseProgresses: many(courseProgress),
	enrollments: many(enrollments),
	lessons: many(lessons),
	quizzes: many(quizzes),
	certificates: many(certificates),
}));

export const classesRelations = relations(classes, ({many}) => ({
	courseClassMappings: many(courseClassMapping),
	schoolClassMappings: many(schoolClassMapping),
	studentAcademicRecords: many(studentAcademicRecords),
}));

export const schoolClassMappingRelations = relations(schoolClassMapping, ({one}) => ({
	school: one(schools, {
		fields: [schoolClassMapping.schoolId],
		references: [schools.id]
	}),
	class: one(classes, {
		fields: [schoolClassMapping.classId],
		references: [classes.id]
	}),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	schoolClassMappings: many(schoolClassMapping),
	invoices: many(invoices),
	auditLogs: many(auditLogs),
	academicSessions: many(academicSessions),
	enrollments: many(enrollments),
	paymentTransactions: many(paymentTransactions),
	schoolSubscriptions: many(schoolSubscriptions),
	users: many(users),
	schoolMetricsDailies: many(schoolMetricsDaily),
	studentAcademicRecords: many(studentAcademicRecords),
	xpEvents: many(xpEvents),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	school: one(schools, {
		fields: [invoices.schoolId],
		references: [schools.id]
	}),
	schoolSubscription: one(schoolSubscriptions, {
		fields: [invoices.subscriptionId],
		references: [schoolSubscriptions.id]
	}),
	paymentTransaction: one(paymentTransactions, {
		fields: [invoices.transactionId],
		references: [paymentTransactions.id]
	}),
}));

export const schoolSubscriptionsRelations = relations(schoolSubscriptions, ({one, many}) => ({
	invoices: many(invoices),
	paymentTransactions: many(paymentTransactions),
	promoCode: one(promoCodes, {
		fields: [schoolSubscriptions.promoCodeId],
		references: [promoCodes.id]
	}),
	school: one(schools, {
		fields: [schoolSubscriptions.schoolId],
		references: [schools.id]
	}),
	paymentPlan: one(paymentPlans, {
		fields: [schoolSubscriptions.planId],
		references: [paymentPlans.id]
	}),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({one, many}) => ({
	invoices: many(invoices),
	promoCode: one(promoCodes, {
		fields: [paymentTransactions.promoCodeId],
		references: [promoCodes.id]
	}),
	school: one(schools, {
		fields: [paymentTransactions.schoolId],
		references: [schools.id]
	}),
	schoolSubscription: one(schoolSubscriptions, {
		fields: [paymentTransactions.subscriptionId],
		references: [schoolSubscriptions.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	courses: many(courses),
	auditLogs: many(auditLogs),
	courseProgresses: many(courseProgress),
	enrollments: many(enrollments),
	emailVerificationTokens: many(emailVerificationTokens),
	loginAttempts: many(loginAttempts),
	mediaAssets: many(mediaAssets),
	passwordResetTokens: many(passwordResetTokens),
	quizAttempts: many(quizAttempts),
	lessonProgresses: many(lessonProgress),
	userAchievements: many(userAchievements),
	userDailyChallenges: many(userDailyChallenges),
	school: one(schools, {
		fields: [users.schoolId],
		references: [schools.id]
	}),
	studentAcademicRecords_userId: many(studentAcademicRecords, {
		relationName: "studentAcademicRecords_userId_users_id"
	}),
	studentAcademicRecords_promotedBy: many(studentAcademicRecords, {
		relationName: "studentAcademicRecords_promotedBy_users_id"
	}),
	userCertificates: many(userCertificates),
	xpEvents: many(xpEvents),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
	school: one(schools, {
		fields: [auditLogs.schoolId],
		references: [schools.id]
	}),
}));

export const courseMetricsDailyRelations = relations(courseMetricsDaily, ({one}) => ({
	course: one(courses, {
		fields: [courseMetricsDaily.courseId],
		references: [courses.id]
	}),
}));

export const academicSessionsRelations = relations(academicSessions, ({one, many}) => ({
	school: one(schools, {
		fields: [academicSessions.schoolId],
		references: [schools.id]
	}),
	enrollments: many(enrollments),
	studentAcademicRecords: many(studentAcademicRecords),
}));

export const courseProgressRelations = relations(courseProgress, ({one}) => ({
	user: one(users, {
		fields: [courseProgress.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [courseProgress.courseId],
		references: [courses.id]
	}),
	enrollment: one(enrollments, {
		fields: [courseProgress.enrollmentId],
		references: [enrollments.id]
	}),
}));

export const enrollmentsRelations = relations(enrollments, ({one, many}) => ({
	courseProgresses: many(courseProgress),
	user: one(users, {
		fields: [enrollments.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [enrollments.courseId],
		references: [courses.id]
	}),
	school: one(schools, {
		fields: [enrollments.schoolId],
		references: [schools.id]
	}),
	academicSession: one(academicSessions, {
		fields: [enrollments.sessionId],
		references: [academicSessions.id]
	}),
	quizAttempts: many(quizAttempts),
	lessonProgresses: many(lessonProgress),
	userCertificates: many(userCertificates),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({one}) => ({
	user: one(users, {
		fields: [emailVerificationTokens.userId],
		references: [users.id]
	}),
}));

export const promoCodesRelations = relations(promoCodes, ({many}) => ({
	paymentTransactions: many(paymentTransactions),
	schoolSubscriptions: many(schoolSubscriptions),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({one}) => ({
	user: one(users, {
		fields: [loginAttempts.userId],
		references: [users.id]
	}),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({one}) => ({
	user: one(users, {
		fields: [mediaAssets.uploadedBy],
		references: [users.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({one}) => ({
	user: one(users, {
		fields: [quizAttempts.userId],
		references: [users.id]
	}),
	quiz: one(quizzes, {
		fields: [quizAttempts.quizId],
		references: [quizzes.id]
	}),
	enrollment: one(enrollments, {
		fields: [quizAttempts.enrollmentId],
		references: [enrollments.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	quizAttempts: many(quizAttempts),
	quizQuestions: many(quizQuestions),
	lesson: one(lessons, {
		fields: [quizzes.lessonId],
		references: [lessons.id]
	}),
	course: one(courses, {
		fields: [quizzes.courseId],
		references: [courses.id]
	}),
}));

export const lessonProgressRelations = relations(lessonProgress, ({one}) => ({
	user: one(users, {
		fields: [lessonProgress.userId],
		references: [users.id]
	}),
	lesson: one(lessons, {
		fields: [lessonProgress.lessonId],
		references: [lessons.id]
	}),
	enrollment: one(enrollments, {
		fields: [lessonProgress.enrollmentId],
		references: [enrollments.id]
	}),
}));

export const lessonsRelations = relations(lessons, ({one, many}) => ({
	lessonProgresses: many(lessonProgress),
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id]
	}),
	quizzes: many(quizzes),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({one}) => ({
	quiz: one(quizzes, {
		fields: [quizQuestions.quizId],
		references: [quizzes.id]
	}),
}));

export const paymentPlansRelations = relations(paymentPlans, ({many}) => ({
	schoolSubscriptions: many(schoolSubscriptions),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const userDailyChallengesRelations = relations(userDailyChallenges, ({one}) => ({
	user: one(users, {
		fields: [userDailyChallenges.userId],
		references: [users.id]
	}),
	dailyChallenge: one(dailyChallenges, {
		fields: [userDailyChallenges.challengeId],
		references: [dailyChallenges.id]
	}),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({many}) => ({
	userDailyChallenges: many(userDailyChallenges),
}));

export const certificatesRelations = relations(certificates, ({one, many}) => ({
	course: one(courses, {
		fields: [certificates.courseId],
		references: [courses.id]
	}),
	userCertificates: many(userCertificates),
}));

export const schoolMetricsDailyRelations = relations(schoolMetricsDaily, ({one}) => ({
	school: one(schools, {
		fields: [schoolMetricsDaily.schoolId],
		references: [schools.id]
	}),
}));

export const studentAcademicRecordsRelations = relations(studentAcademicRecords, ({one}) => ({
	class: one(classes, {
		fields: [studentAcademicRecords.classId],
		references: [classes.id]
	}),
	user_userId: one(users, {
		fields: [studentAcademicRecords.userId],
		references: [users.id],
		relationName: "studentAcademicRecords_userId_users_id"
	}),
	school: one(schools, {
		fields: [studentAcademicRecords.schoolId],
		references: [schools.id]
	}),
	academicSession: one(academicSessions, {
		fields: [studentAcademicRecords.sessionId],
		references: [academicSessions.id]
	}),
	user_promotedBy: one(users, {
		fields: [studentAcademicRecords.promotedBy],
		references: [users.id],
		relationName: "studentAcademicRecords_promotedBy_users_id"
	}),
}));

export const userCertificatesRelations = relations(userCertificates, ({one}) => ({
	user: one(users, {
		fields: [userCertificates.userId],
		references: [users.id]
	}),
	certificate: one(certificates, {
		fields: [userCertificates.certificateId],
		references: [certificates.id]
	}),
	enrollment: one(enrollments, {
		fields: [userCertificates.enrollmentId],
		references: [enrollments.id]
	}),
}));

export const xpEventsRelations = relations(xpEvents, ({one}) => ({
	user: one(users, {
		fields: [xpEvents.userId],
		references: [users.id]
	}),
	school: one(schools, {
		fields: [xpEvents.schoolId],
		references: [schools.id]
	}),
}));