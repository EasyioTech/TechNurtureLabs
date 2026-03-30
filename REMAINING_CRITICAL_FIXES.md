# 🔧 REMAINING CRITICAL FIXES (4 out of 10)

**Priority:** HIGH
**Total Effort:** ~19 hours
**Estimated Timeline:** 3-4 more days

---

## CRITICAL #4: Cache Invalidation on Mutations
**Severity:** CRITICAL
**Impact:** Data consistency, user experience
**Time Estimate:** 8-10 hours

### The Problem
After a user's data changes (quiz score, progress, achievements), the cached version doesn't get invalidated. Users see stale data for 5-10 minutes until cache TTL expires.

**Example:**
1. Student takes quiz, scores 95/100
2. Quiz submission updates DB ✓
3. But leaderboard cache still shows old score ✗
4. Student rank updates after 10 minutes ✗
5. Gamification badges awarded on stale data ✗

### Where to Apply

**Files to Update:**
- `src/app/api/learning/complete/route.ts` — Quiz completion
- `src/app/api/learning/heartbeat/route.ts` — Activity tracking
- `src/app/api/learning/init/route.ts` — Session start
- `src/modules/student/actions/lesson-actions.ts` — Lesson updates
- `src/modules/school-admin/actions/index.ts` — Admin course/student updates
- Any other mutation endpoint

### Implementation Pattern

```typescript
// Step 1: Make the change
await db.update(quizAttempts).set({ score: newScore });

// Step 2: Invalidate affected caches (ADD THIS)
const userId = session.userId;
const courseId = quiz.course_id;

await cacheService.invalidateTag(`user:${userId}:progress`);
await cacheService.invalidateTag(`user:${userId}:leaderboard`);
await cacheService.invalidateTag(`user:${userId}:achievements`);
await cacheService.invalidateTag(`course:${courseId}:leaderboard`);
await cacheService.invalidateTag(`user:${userId}:xp`);
await cacheService.invalidateTag(`user:${userId}:stats`);
```

### Cache Tags to Use
```
user:{userId}:progress          → User's lesson progress
user:{userId}:leaderboard       → User's rank/position
user:{userId}:achievements      → User's badges
user:{userId}:xp                → User's experience points
user:{userId}:stats             → User's statistics
user:{userId}:dashboard         → User's dashboard data
course:{courseId}:leaderboard   → Course-wide leaderboard
school:{schoolId}:stats         → School statistics
```

### Code Template to Copy

```typescript
// At end of every mutation route/action:
if (operationSuccess) {
    // Invalidate user-specific caches
    await cacheService.invalidateTag(`user:${affectedUserId}:progress`);
    await cacheService.invalidateTag(`user:${affectedUserId}:leaderboard`);
    await cacheService.invalidateTag(`user:${affectedUserId}:achievements`);

    // Invalidate course/school caches if needed
    if (courseId) {
        await cacheService.invalidateTag(`course:${courseId}:leaderboard`);
    }
    if (schoolId) {
        await cacheService.invalidateTag(`school:${schoolId}:stats`);
    }
}
```

---

## CRITICAL #9: Promo Code Concurrency (FOR UPDATE)
**Severity:** CRITICAL
**Impact:** Revenue (promo codes can be overused)
**Time Estimate:** 2-3 hours

### The Problem
Two concurrent checkout requests for same promo code can both pass validation and increment usage. Code gets used 101 times when max is 100.

**Attack Scenario:**
1. Promo code: max_uses = 100, current_uses = 99
2. User 1 checks code ✓ → current_uses still 99, < 100
3. User 2 checks code ✓ → current_uses still 99, < 100
4. User 1 increments → current_uses = 100
5. User 2 increments → current_uses = 101 ✗✗✗
6. Promo used 101 times, revenue lost!

### File to Fix
`src/app/api/payment/create-order/route.ts` (Lines 56-102)

### Current Code (Vulnerable)
```typescript
const [updatedPromo] = await db
    .update(promoCodes)
    .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
    .where(and(
        eq(promoCodes.id, promo_code_id),
        sql`${promoCodes.current_uses} < ${promoCodes.max_uses}`  // ← RACE WINDOW HERE
    ))
    .returning();
```

### Fixed Code Using FOR UPDATE

Replace the promo code update section with:

```typescript
// CRITICAL FIX #9: Use PostgreSQL FOR UPDATE for atomic increment
if (promo_code_id) {
    const now = new Date();

    try {
        // Step 1: Lock the row with FOR UPDATE (no other transaction can modify until we commit)
        const [lockedPromo] = await db.execute(sql`
            SELECT id, discount_type, discount_value, current_uses, max_uses
            FROM promo_codes
            WHERE id = ${promo_code_id}
            AND is_active = true
            AND (valid_from IS NULL OR valid_from <= ${now})
            AND (valid_until IS NULL OR valid_until >= ${now})
            AND (max_uses IS NULL OR current_uses < max_uses)
            FOR UPDATE  -- ← THIS LOCKS THE ROW
        `);

        if (!lockedPromo) {
            // Another transaction already took the last usage
            return NextResponse.json(
                { error: 'Promo code is no longer available.' },
                { status: 400 }
            );
        }

        // Step 2: Now increment (locked, no race possible)
        const [updated] = await db
            .update(promoCodes)
            .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
            .where(eq(promoCodes.id, promo_code_id))
            .returning();

        promoData = {
            code: updated.code,
            discount_type: updated.discount_type,
            discount_value: updated.discount_value,
            discount_amount: discountAmount,
        };
    } catch (promoErr) {
        console.error('[Promo Code] Error applying promo:', promoErr);
        return NextResponse.json(
            { error: 'Failed to apply promo code.' },
            { status: 400 }
        );
    }
}
```

### Why This Works
- `FOR UPDATE` locks the row until transaction commits
- No other request can read the row until lock released
- Atomic: increment happens only for first request
- Second request sees max_uses exceeded after lock released

---

## CRITICAL #8: Unhandled Promise Rejection Handling
**Severity:** MEDIUM
**Impact:** Silent failures, incomplete operations
**Time Estimate:** 3-4 hours

### The Problem
Fire-and-forget async operations (email, analytics, cache) can silently fail. No error is caught, logged, or retried. Users think operation succeeded but it didn't.

**Example:**
```typescript
// Current code (buggy):
analyticsService.trackLoginHour(...).catch(() => {});  // Silently ignores

// If trackLoginHour() throws and isn't caught, Node.js logs unhandled rejection warning
// But users might think analytics were tracked
```

### Files to Update
- `src/app/api/auth/student/login/route.ts`
- `src/lib/auth.ts`
- Any route with `.catch(err => {})` without proper logging

### Implementation Pattern

```typescript
// PATTERN 1: Multiple fire-and-forget operations
Promise.allSettled([
    sendVerificationEmail(user.email),
    trackAnalytics(user.id),
    updateCacheData(user.id),
    notifySlack(`User logged in: ${user.email}`)
]).catch(err => {
    // Handle unexpected errors (shouldn't happen with allSettled, but belt-and-suspenders)
    console.error('[Unexpected] Fire-and-forget batch error:', err);
});

// PATTERN 2: Explicit per-operation handling
try {
    await sendVerificationEmail(user.email);
} catch (err) {
    // Non-critical, user already logged in
    console.warn('[Email] Failed to send verification:', (err as any).message);
    // Could add to retry queue:
    // await emailRetryQueue.add({ userId, action: 'verification_email' });
}

try {
    await analyticsService.trackLoginHour(now.getDay(), now.getHours());
} catch (err) {
    // Analytics failure is non-critical
    console.warn('[Analytics] Failed to track login hour:', (err as any).message);
}
```

### Key Rules
1. **Always handle promises** — Never leave `.then()` or `.catch()` without handler
2. **Use `allSettled()` for batches** — One failure doesn't fail others
3. **Log errors** — console.warn() for non-critical, console.error() for critical
4. **Don't throw in catch blocks** — Let operation continue
5. **Consider retry queues** — For important ops like emails

---

## CRITICAL #7: Multi-Tenant Isolation in Queries
**Severity:** MEDIUM
**Impact:** Cross-school data access
**Time Estimate:** 4-6 hours

### Current Status
- School admin actions (`src/modules/school-admin/actions/index.ts`) — **GOOD** ✓
  - Uses `verifySchoolAdminContext()` consistently
  - Verifies admin belongs to school before querying

- Super admin actions (`src/modules/super-admin/actions/`) — **NEEDS REVIEW**
  - Should have school isolation for multi-tenant operations
  - Some queries might be fetching data without school filter

### What to Audit

1. **Super admin school queries** — Ensure filtering by school
2. **Super admin student queries** — Verify school is included in WHERE clause
3. **Super admin course queries** — Check school/tenant isolation
4. **API routes** — Review any tenant-specific endpoints

### Example Fix Pattern

```typescript
// Before: Vulnerable (fetches from ALL schools)
export async function getAllCourses() {
    return await db.query.courses.findMany();  // ← ALL courses!
}

// After: Proper isolation
export async function getAllCourses(schoolId: string) {
    const { admin } = await requireSchoolAdmin(schoolId);
    return await db.query.courses.findMany({
        where: eq(courses.school_id, admin.school_id)
    });
}
```

### Audit Checklist
- [ ] Super admin school queries include school filter
- [ ] Super admin student queries filtered by school
- [ ] Super admin course queries filtered by school
- [ ] Super admin lesson queries filtered through course
- [ ] API endpoints verify tenant context
- [ ] All joins include school_id in WHERE clause

---

## 🚀 RECOMMENDED IMPLEMENTATION ORDER

1. **First: CRITICAL #4 (Cache Invalidation)**
   - Effort: 8-10h
   - Impact: Data consistency
   - Dependencies: None
   - **Start:** Today if possible

2. **Second: CRITICAL #9 (Promo Concurrency)**
   - Effort: 2-3h
   - Impact: Revenue protection
   - Dependencies: None
   - **Start:** After #4

3. **Third: CRITICAL #8 (Promise Handling)**
   - Effort: 3-4h
   - Impact: Resilience
   - Dependencies: None
   - **Start:** While #4/#9 code review happens

4. **Fourth: CRITICAL #7 (Multi-Tenant Audit)**
   - Effort: 4-6h
   - Impact: Security
   - Dependencies: Code review of #4-#8
   - **Start:** Final phase

---

## ✅ TESTING EACH FIX

### CRITICAL #4 Tests
```typescript
// Test: Quiz completion invalidates leaderboard
1. Get initial leaderboard (cached)
2. Student completes quiz with score 95
3. Immediately fetch leaderboard
4. Verify student's score updated (cache was invalidated)
5. Wait 5+ minutes without action
6. Check leaderboard is still current (not stale)
```

### CRITICAL #9 Tests
```typescript
// Test: Concurrent promo code requests are atomic
1. Create promo code with max_uses = 10
2. Spawn 20 concurrent checkout requests with same promo
3. Verify exactly 10 succeeded, 10 rejected
4. Verify promo current_uses = 10 (not 11, 12, etc.)
```

### CRITICAL #8 Tests
```typescript
// Test: Failed email doesn't crash login
1. Mock email service to throw error
2. Student logs in
3. Verify login succeeds despite email failure
4. Verify error was logged but didn't crash flow
```

### CRITICAL #7 Tests
```typescript
// Test: Cross-school queries rejected
1. Admin from School A tries to query School B data
2. Verify 403 Unauthorized response
3. Verify error is logged for audit trail
```

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying fixes:

**Code Quality:**
- [ ] All fixes code reviewed
- [ ] No console errors/warnings
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

**Testing:**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Load test (100+ concurrent users) passes
- [ ] No performance regression

**Monitoring:**
- [ ] New logs/metrics configured
- [ ] Alerts configured for new error cases
- [ ] Dashboard updated

**Deployment:**
- [ ] Git branch created and PR opened
- [ ] All checks passing
- [ ] Ready for staging deployment
- [ ] Soft launch plan prepared (small group first)

---

**Target Completion:** 3-4 business days
**Next Milestone:** Load test with 1000 concurrent users
**Final Milestone:** Staging environment deployment and validation
