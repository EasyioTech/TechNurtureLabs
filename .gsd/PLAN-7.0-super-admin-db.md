# Plan 7.0: End-to-End Super Admin DB Integration

> **Objective**: Systematically connect every UI element in the Super Admin dashboard to the PostgreSQL database via Drizzle ORM, ensuring full CURD (Create, Update, Read, Delete) capabilities and accurate real-time metrics.

## 1. Core Data Validation & Calculation
Ensure the global data fetch is optimized and mapping logic is robust.
- [ ] Audit `fetchAllAdminData` in `src/modules/super-admin/actions.ts` to ensure it returns all tables.
- [ ] Refine calculation of `Stats` in `useAdminData.ts` (Revenue, Students, Institutions).
- [ ] **Verification**: Dashboard "Health Overview" cards must match SQL query results.

## 2. Institution Management (Schools Tab)
The current implementation lacks creation capability.
- [ ] Implement `createSchoolAdmin` (or a unified `saveSchoolAdmin`) in `actions.ts`.
- [ ] Auto-generate a URL slug from the institution name on creation.
- [ ] Update `SchoolsTab.tsx` to handle "Add Institution" via the existing dialog or a new specialized one.
- [ ] **Verification**: Successfully create a new school and see it in the registry.

## 3. Subscription Management (Plans Tab)
- [ ] Implement `savePlanAdmin` to handle tier features as a JSON array/object.
- [ ] Verify pricing storage (numeric precision) and display consistency.
- [ ] Implement safety check to prevent deletion of plans with active subscriptions.
- [ ] **Verification**: Create a new "Ultra" tier and verify it saves with all features.

## 4. Course & Lesson Management (Courses Tab)
Refine the new thumbnail upload and ensure content ordering is bulletproof.
- [ ] Ensure `saveCourseAdmin` persists the newly added `thumbnail_url`.
- [ ] Verify `saveLessonOrderAdmin` updates `sequence_order` correctly in the database.
- [ ] Verify `updateCourseTotals` triggers on every relevant change.
- [ ] **Verification**: Upload a thumbnail, change lesson order, and refresh to confirm stickiness.

## 5. Analytics & Student Visibility
- [ ] Ensure "Student Leaderboard" and "Course Analytics" show real DB metrics.
- [ ] Implement Student Search in the students tab (if requested, or at least verify visibility).
- [ ] **Verification**: XP on the leaderboard must match the sum of XP events in the database.

## 6. Final Audit & Verification
- [ ] Full smoke test of all GSD "Strict Implementation" rules.
- [ ] Capture empirical evidence of database state matching UI.
