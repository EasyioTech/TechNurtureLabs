# VPS Critical Fixes - Deleted Courses Still Visible to Students

## Root Cause Analysis

### Problem 1: Deleted Courses Still Appear in Student Dashboard
**Location**: `src/modules/student/actions/course-actions.ts`

**Lines with Issues**:
- **Line 324**: Enrolled courses query missing `deleted_at IS NULL` filter
- **Line 327**: Global courses query missing `deleted_at IS NULL` filter
- **Line 331**: Class-mapped courses query missing `deleted_at IS NULL` filter
- **Line 201-202**: Lessons query missing `deleted_at IS NULL` filter
- **Line 135-139**: Course details query missing `deleted_at` filter

**Why It Happens**:
When admin deletes a course, it's soft-deleted (sets `deleted_at` timestamp).
But student dashboard doesn't filter out soft-deleted courses, so they remain visible.

### Problem 2: Backup Data Shows in Dashboard but NOT Admin Panel
**Root Cause**: 
- **Student side**: Queries don't filter `deleted_at`, so restored courses appear
- **Admin side**: Queries DO filter `deleted_at`, so restored courses don't appear (unless they were soft-deleted before backup)
- **Cache issue**: Student dashboard caches stale course list with soft-deleted courses

### Problem 3: Cache Not Invalidated After Restore
**Location**: `src/modules/student/actions/course-actions.ts`

When restore happens, the student cache is NOT invalidated, so old deleted courses still appear in cache.

---

## Fixes Required on VPS

### Fix 1: Update Student Course Queries

**File**: `src/modules/student/actions/course-actions.ts`

**Change 1** (Line ~324 - enrolled courses):
```typescript
// BEFORE:
db.query.enrollments.findMany({ 
    where: and(
        eq(enrollments.user_id, userId), 
        eq(enrollments.is_active, true),
        sessionId ? eq(enrollments.session_id, sessionId) : isNotNull(enrollments.id)
    ), 
    with: { course: true } 
})

// AFTER:
db.query.enrollments.findMany({ 
    where: and(
        eq(enrollments.user_id, userId), 
        eq(enrollments.is_active, true),
        isNull(enrollments.deleted_at),  // ADD THIS LINE
        sessionId ? eq(enrollments.session_id, sessionId) : isNotNull(enrollments.id)
    ), 
    with: { course: true } 
})
```

**Change 2** (Line ~327 - global courses):
```typescript
// BEFORE:
db.query.courses.findMany({ 
    where: and(eq(courses.all_classes, true), eq(courses.is_published, true)) 
})

// AFTER:
db.query.courses.findMany({ 
    where: and(
        eq(courses.all_classes, true), 
        eq(courses.is_published, true),
        isNull(courses.deleted_at)  // ADD THIS LINE
    ) 
})
```

**Change 3** (Line ~331 - class-mapped courses):
```typescript
// BEFORE:
classId ? db.query.courseClassMapping.findMany({ 
    where: eq(courseClassMapping.class_id, classId), 
    with: { course: true } 
}) : Promise.resolve([])

// AFTER:
classId ? db.query.courseClassMapping.findMany({ 
    where: and(
        eq(courseClassMapping.class_id, classId),
        isNull(courseClassMapping.deleted_at)  // ADD THIS LINE
    ),
    with: { course: true } 
}) : Promise.resolve([])
```

Also filter courses in the results (Line ~336-338):
```typescript
// BEFORE:
enrolled.forEach(e => e.course?.is_published && courseMap.set(e.course.id, { ...e.course, isEnrolled: true }));
global.forEach(c => !courseMap.has(c.id) && courseMap.set(c.id, { ...c, isEnrolled: false }));
(classMapped as any[]).forEach(m => m.course?.is_published && !courseMap.has(m.course.id) && courseMap.set(m.course.id, { ...m.course, isEnrolled: false }));

// AFTER:
enrolled.forEach(e => e.course?.is_published && !e.course.deleted_at && courseMap.set(e.course.id, { ...e.course, isEnrolled: true }));
global.forEach(c => !c.deleted_at && !courseMap.has(c.id) && courseMap.set(c.id, { ...c, isEnrolled: false }));
(classMapped as any[]).forEach(m => m.course?.is_published && !m.course?.deleted_at && !courseMap.has(m.course.id) && courseMap.set(m.course.id, { ...m.course, isEnrolled: false }));
```

**Change 4** (Line ~135-139 - Course details):
```typescript
// BEFORE:
const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
});

// AFTER:
const course = await db.query.courses.findFirst({
    where: and(
        eq(courses.id, courseId),
        isNull(courses.deleted_at)  // ADD THIS LINE
    )
});
```

**Change 5** (Line ~201-202 - Lessons):
```typescript
// BEFORE:
const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.course_id, courseId),
    orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
});

// AFTER:
const courseLessons = await db.query.lessons.findMany({
    where: and(
        eq(lessons.course_id, courseId),
        isNull(lessons.deleted_at)  // ADD THIS LINE
    ),
    orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
});
```

### Fix 2: Invalidate Student Cache After Restore

**File**: `src/lib/services/backup-service.ts`

**In `restoreBackup()` function** (around line 410, after the transaction completes):
```typescript
export async function restoreBackup(backupData: CourseBackupData, superAdminId: string) {
    // ... existing code ...
    
    return await db.transaction(async (tx) => {
        // ... restore logic ...
        
        console.log(`[Backup Service] Restore completed...`);
        
        // INVALIDATE STUDENT CACHES for affected courses
        try {
            const allStudents = await tx.query.students.findMany();
            for (const student of allStudents) {
                const cacheKey = `cache:student:${student.id}:dashboard`;
                await redis.del(cacheKey);
            }
            console.log(`[Backup Service] Invalidated ${allStudents.length} student dashboard caches`);
        } catch (err) {
            console.warn('[Backup Service] Cache invalidation warning:', err);
        }
        
        return { success: true, coursesCount, lessonsCount, assetsCount, quizzesCount };
    });
}
```

### Fix 3: Add Delete Cache Endpoint

**File**: `src/modules/student/actions/course-actions.ts`

Add this function:
```typescript
export async function invalidateAllStudentCaches() {
    const session = await requireSuperAdmin();  // Only super admin can do this
    
    try {
        const allStudents = await db.query.students.findMany();
        let invalidated = 0;
        
        for (const student of allStudents) {
            const cacheKey = `cache:student:${student.id}:dashboard`;
            await redis.del(cacheKey);
            invalidated++;
        }
        
        console.log(`[Cache Invalidation] Invalidated ${invalidated} student caches`);
        return { success: true, invalidated };
    } catch (error: any) {
        console.error('[Cache Invalidation] Error:', error);
        return { success: false, error: error.message };
    }
}
```

---

## Commands to Run on VPS

```bash
# SSH to VPS
ssh root@187.127.132.137

# Navigate to project
cd /path/to/technurture-labs

# 1. Stop the running app
docker-compose down app

# 2. Make code changes (copy files from local or edit directly):
# Edit: src/modules/student/actions/course-actions.ts
# Edit: src/lib/services/backup-service.ts

# 3. Clear Next.js cache
docker exec LMS_app rm -rf .next || true

# 4. Rebuild app with fresh build
docker-compose up -d app --build

# Wait for build to complete (2-3 minutes)
sleep 180

# 5. Invalidate student caches directly in Redis
docker exec LMS_redis redis-cli KEYS "cache:student:*:dashboard" | xargs docker exec LMS_redis redis-cli DEL

# 6. Verify logs
docker-compose logs -f app | grep -E "Ready|Build|Cache"
```

---

## Testing Checklist

After deploying fixes:

1. ✅ **Delete Course Test**
   - Create a course with lessons
   - Verify it appears in student dashboard
   - Delete course from admin
   - Refresh student dashboard - course should DISAPPEAR

2. ✅ **Restore Course Test**
   - Backup a course
   - Delete the course
   - Restore from backup
   - Admin dashboard: course should appear
   - Student dashboard: course should appear

3. ✅ **Cache Invalidation Test**
   - Create and delete course
   - Check Redis for cache: `docker exec LMS_redis redis-cli KEYS "*dashboard*" | wc -l`
   - After delete, cache should be cleared

4. ✅ **Soft Delete Behavior**
   - Delete course
   - Check DB: `SELECT id, title, deleted_at FROM courses;`
   - Deleted courses should have `deleted_at` NOT NULL

---

## Summary of Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| Student Dashboard | Deleted courses visible | Add `isNull(deleted_at)` filters |
| Course Details | Deleted courses accessible | Add `isNull(deleted_at)` filter |
| Lessons Fetch | Deleted lessons visible | Add `isNull(deleted_at)` filter |
| Restore Logic | Cache not invalidated | Invalidate student caches after restore |
| Enrollment Filter | Deleted enrollments shown | Add `isNull(deleted_at)` filter |

---

## Deployment Order

1. Fix code in local VSCode
2. Test locally (if possible)
3. Push to VPS
4. Rebuild app container
5. Clear Redis caches
6. Test in student dashboard
7. Verify deleted courses disappear immediately
8. Test backup/restore flow

