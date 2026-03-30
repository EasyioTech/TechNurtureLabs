# Course Not Found Bug - Root Cause Analysis & Fix

## The Problem

Users were seeing **"Course Not Found"** error when clicking to view course details, even though:
- ✅ The course was visible in the school dashboard courses page
- ✅ The course existed in the database
- ✅ The course was mapped to the school's classes

This bug has been **FIXED** in `src/modules/school-admin/actions/index.ts`.

---

## Root Cause

### The Logic Mismatch

**Dashboard Display Logic** (`getSchoolCourseAnalytics`):
```ts
// Shows courses where:
where: and(
    eq(courses.is_published, true),
    validCourseIds.length > 0
        ? or(eq(courses.all_classes, true), inArray(courses.id, validCourseIds))
        : eq(courses.all_classes, true)
)
```

**Course Detail Fetch Logic** (`fetchSchoolAdminCourseData` - BEFORE FIX):
```ts
// Required EITHER:
// 1. schoolEnrollments record EXISTS, OR
// 2. course is mapped to school's classes

if (!schoolEnrollments && !isMappedToSchool) {
    return { course: null, ... };  // ❌ Returns "Not Found"
}
```

### The Problem

The validation was **TOO STRICT**. It required:
- Either an `enrollments` record linking the school to the course
- **OR** the course to be mapped to a class

But this failed when:
1. Course was marked `all_classes = true` ✅ (visible in dashboard)
2. Course was mapped to classes ✅ (visible in dashboard)
3. **BUT** no `enrollments` record existed (students hadn't enrolled yet)

Result: **Course displays in dashboard BUT shows "Course not found" when clicking to view details**

---

## The Fix

Changed the validation logic in `fetchSchoolAdminCourseData` (line 894-923) to use **the same logic as the dashboard**:

### Before (❌ Buggy):
```ts
// Checked for enrollments EXISTENCE (not needed for display)
const schoolEnrollments = await db.query.enrollments.findFirst({...});

if (!schoolEnrollments && !isMappedToSchool) {
    return { course: null, ... };  // ❌ WRONG
}
```

### After (✅ Fixed):
```ts
// Check if course is ACCESSIBLE to school (same as dashboard)
let isAccessibleToSchool = course.all_classes === true;
if (!isAccessibleToSchool && schoolClassIds.length > 0) {
    const courseClassMappings = await db.query.courseClassMapping.findFirst({...});
    if (courseClassMappings) isAccessibleToSchool = true;
}

if (!isAccessibleToSchool) {
    return { course: null, ... };  // ✅ CORRECT
}
```

---

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Validation Check** | Requires `enrollments` record OR class mapping | Only checks class mapping & `all_classes` flag |
| **Shows course without enrollments?** | ❌ No (shows "Not Found") | ✅ Yes (displays with "No Enrolled Students" message) |
| **Matches dashboard logic?** | ❌ No (inconsistent) | ✅ Yes (consistent) |
| **Student data display** | N/A (course blocked earlier) | Shows empty table with helpful message |

---

## What Now Works

✅ **Scenario 1: Course with `all_classes = true`**
- Dashboard: Shows course
- Details page: Now shows course (even if no students enrolled)

✅ **Scenario 2: Course mapped to school's classes**
- Dashboard: Shows course
- Details page: Now shows course (even if no students enrolled)

✅ **Scenario 3: Course with enrolled students**
- Dashboard: Shows course with enrollment metrics
- Details page: Shows course with student progress table

✅ **Scenario 4: Course with no enrollments**
- Dashboard: Shows course with 0 enrolled
- Details page: Now shows course with "No Enrolled Students Yet" message (previously showed "Course Not Found")

---

## File Modified

- **`src/modules/school-admin/actions/index.ts`** (lines 894-923)
  - Updated `fetchSchoolAdminCourseData()` function
  - Changed validation logic to match `getSchoolCourseAnalytics()`
  - Added clarifying comments about the fix

---

## Testing

To verify the fix works:

1. ✅ Navigate to School Admin → Courses
2. ✅ See courses displayed (with or without students enrolled)
3. ✅ Click on ANY course to view details
4. ✅ **Should see course details** (NOT "Course Not Found")
5. ✅ If course has no enrolled students, see "No Enrolled Students Yet" message
6. ✅ If course has students, see their progress table

---

## Why This Happened

The original code was overly defensive, checking for `enrollments` records as a way to validate that "someone is using this course in this school." However:

1. **It blocked legitimate access** to courses that were properly configured but had no enrollments yet
2. **It contradicted the dashboard logic** which showed courses based purely on class mappings
3. **It created a UX inconsistency** where users saw a course in the dashboard but couldn't view its details

The fix **aligns both code paths** and **allows courses to be viewed regardless of enrollment status**, which is the correct behavior for an admin viewing course details.

---

## Performance Impact

**Positive:** Removed unnecessary database query
- Old code: Checked for `enrollments` record (extra query)
- New code: Uses only class mapping validation (same queries as before)

**No negative impact:** The course is displayed but shows empty student list if no enrollments exist (already handled gracefully in the UI).
