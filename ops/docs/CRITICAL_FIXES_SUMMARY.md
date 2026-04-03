# 🚨 CRITICAL SECURITY FIXES — DEPLOY BLOCKER CHECKLIST

**Status:** ❌ **BLOCKING PRODUCTION DEPLOYMENT**  
**Last Updated:** April 2, 2026  
**Priority:** P0 (Fix before ANY public launch)

---

## IMMEDIATE (MUST FIX BEFORE DEPLOYMENT)

### 1️⃣ IDOR: Students Can Access Any Course (HIGH)
**File:** `/src/modules/student/actions/course-actions.ts` (line 121-150)  
**Problem:** `getCourseDetailsData()` returns course details without checking student enrollment  
**Exploit:** Student A calls function with Course B ID → gets all lessons, quiz questions, answers  
**Status:** ❌ UNFIXED  
**Fix Time:** 30 min

```typescript
// ADD AFTER LINE 130:
const student = await db.query.students.findFirst({
    where: eq(students.id, userId)
});

const enrollment = await db.query.enrollments.findFirst({
    where: and(
        eq(enrollments.user_id, userId),
        eq(enrollments.course_id, courseId),
        isNull(enrollments.deleted_at)
    )
});

if (!enrollment && role !== 'super_admin') {
    throw new Error('UNAUTHORIZED: Not enrolled in this course');
}
```

---

### 2️⃣ IDOR: Media Files Served Without Enrollment Check (CRITICAL)
**File:** `/src/app/api/media/[...path]/route.ts`  
**Problem:** Media endpoint serves files without verifying enrollment  
**Exploit:** Student guesses path → accesses videos from any course  
**Status:** ❌ UNFIXED  
**Fix Time:** 45 min

```typescript
// ADD VALIDATION BEFORE SERVING:
const session = await verifySession();
if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

// Verify student enrolled in course of requested media
const mediaAsset = await db.query.mediaAssets.findFirst({
    where: eq(mediaAssets.file_path, decodedPath)
});

// If media is lesson-specific, verify enrollment
if (mediaAsset?.folder.includes('lesson')) {
    const enrollment = await db.query.enrollments.findFirst({
        where: and(
            eq(enrollments.user_id, session.userId),
            eq(enrollments.school_id, session.schoolId)
        )
    });
    if (!enrollment) return NextResponse.json({error: 'Forbidden'}, {status: 403});
}
```

---

### 3️⃣ XSS: Unescaped Course Topics (HIGH)
**File:** `/src/db/schema.ts` (line ~400)  
**Problem:** `topics` array stored as JSON, rendered without sanitization  
**Exploit:** Admin creates topic with `<img src=x onerror='steal()'>` → XSS in all student UIs  
**Status:** ❌ UNFIXED  
**Fix Time:** 1 hour

```typescript
// IN TOPIC CREATION HANDLER:
import DOMPurify from 'isomorphic-dompurify';

const sanitizedTopics = topics.map(topic => {
    const cleaned = DOMPurify.sanitize(topic, {
        ALLOWED_TAGS: [],  // No HTML tags allowed
        ALLOWED_ATTR: []
    });
    return cleaned;
});

await db.update(courses).set({topics: sanitizedTopics}).where(eq(courses.id, courseId));
```

**Verify in UI:** Check `/src/components/student/CourseFilters.tsx` — ensure no `dangerouslySetInnerHTML`

---

### 4️⃣ CSRF: Missing CSRF Protection (CRITICAL)
**File:** All server actions in `/src/modules/*/actions/*.ts`  
**Problem:** State-changing actions not validated for CSRF  
**Exploit:** Attacker site posts: `fetch('https://lms.com/api/learning/complete?lessonId=X')` → lesson marked complete  
**Status:** ❌ UNFIXED  
**Fix Time:** 2 hours

**Option A: Origin Validation (Quick)**
```typescript
// ADD TO EVERY SERVER ACTION:
import { headers } from 'next/headers';

export async function completeLessonAndReward(lessonId: string) {
    'use server';
    
    const headerList = await headers();
    const origin = headerList.get('origin');
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
    
    if (origin && !allowedOrigin?.includes(origin)) {
        throw new Error('CSRF_VALIDATION_FAILED');
    }
    
    // ... rest of action
}
```

**Option B: CSRF Tokens (Better)**
```typescript
// middleware.ts: Add CSRF token middleware
import { crypto } from 'node:crypto';

export async function middleware(request: NextRequest) {
    if (request.method === 'POST') {
        const sessionToken = request.cookies.get('session')?.value;
        const csrfToken = request.headers.get('x-csrf-token');
        
        if (!csrfToken || csrfToken !== hash(sessionToken)) {
            return NextResponse.json({error: 'CSRF token invalid'}, {status: 403});
        }
    }
    return NextResponse.next();
}
```

---

### 5️⃣ Secrets in Git (CRITICAL)
**File:** `.env` (committed in git history)  
**Problem:** JWT_SECRET and encryption keys visible in git commits  
**Exploit:** Attacker clones repo → forges JWT tokens → impersonates any user  
**Status:** ❌ UNFIXED  
**Fix Time:** 1 hour (+ new key generation)

**IMMEDIATE ACTIONS:**
```bash
# 1. Generate new secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: Copy this as new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: Copy this as new APP_ENCRYPTION_KEY

# 2. Update .env with new values (locally only, never commit)
# 3. Set ENV variables in production (GitHub Secrets or VPS /etc/environment)

# 4. Remove .env from git history:
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty -- --all

# 5. Force push to clean history:
git push origin --force --all

# 6. Invalidate all active sessions:
# (Flush all user_sessions from DB, reset refresh tokens in Redis)
```

**Then in production environment:**
```bash
export JWT_SECRET="<new_secret>"
export APP_ENCRYPTION_KEY="<new_key>"
# Restart application
```

---

### 6️⃣ Data Leakage: Cross-Tenant Leaderboard (HIGH)
**File:** `/src/lib/gamification.ts` (line ~100)  
**Problem:** Global leaderboard mixes students from different schools  
**Exploit:** School A admin views `leaderboard:global` → sees School B students  
**Status:** ❌ UNFIXED  
**Fix Time:** 45 min

```typescript
// CHANGE FROM:
await redis.zadd(`leaderboard:global`, finalXP, userId);

// CHANGE TO:
const schoolId = enrollment.school_id;  // Get from DB
await redis.zadd(`leaderboard:school:${schoolId}`, finalXP, userId);

// For super admin only (with data masking):
if (role === 'super_admin') {
    await redis.zadd(`leaderboard:admin:all:${schoolId}`, finalXP, userId);
}
```

**Verify:** Check `/src/modules/student/actions/leaderboard-actions.ts` — ensure queries filter by school

---

### 7️⃣ Quiz Answers Exposed (HIGH)
**File:** `/src/modules/student/actions/lesson-actions.ts`  
**Problem:** `submitQuizAttempt()` or quiz fetch returns correct answers  
**Exploit:** Student opens DevTools → sees all answers in API response → cheats  
**Status:** ❌ UNFIXED  
**Fix Time:** 1 hour

```typescript
// ON QUIZ FETCH:
const questions = quizQuestions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options
        .filter(o => !o.is_correct)  // ✅ Remove correct options
        .map(o => ({ id: o.id, text: o.text }))
}));

// Send ONLY after submission:
export async function submitQuizAttempt(quizId: string, answers: Answer[]) {
    // ... validate and score ...
    
    // Return feedback WITH correct answers now:
    return {
        score: 85,
        passed: true,
        feedback: [
            {
                questionId: 'q1',
                userAnswer: 'Option A',
                correctAnswer: 'Option B',  // ✅ Only after submission
                explanation: 'Correct because...'
            }
        ]
    };
}
```

---

### 8️⃣ Password Change Without Verification (MEDIUM)
**File:** `/src/app/api/auth/password/route.ts`  
**Problem:** No old password check, no rate limit  
**Exploit:** Attacker with session cookie changes password → account hijack  
**Status:** ❌ UNFIXED  
**Fix Time:** 30 min

```typescript
// ADD TO ROUTE:
import { compare } from 'bcryptjs';
import { rateLimitService } from '@/lib/services/rate-limit';

export async function POST(request: NextRequest) {
    const session = await verifySession();
    if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    
    // Rate limit: 1 password change per hour
    const { allowed } = await rateLimitService.checkUserLimit(
        session.userId, 'password_change', 1, 3600
    );
    if (!allowed) {
        return NextResponse.json(
            {error: 'Too many password change attempts'},
            {status: 429, headers: {'Retry-After': '3600'}}
        );
    }
    
    const { oldPassword, newPassword } = await request.json();
    
    // Verify old password
    const user = await db.query.students.findFirst({
        where: eq(students.id, session.userId)
    });
    
    const isValid = await compare(oldPassword, user.password_hash);
    if (!isValid) {
        throw new Error('UNAUTHORIZED: Old password incorrect');
    }
    
    // ... update password ...
}
```

---

## SUMMARY TABLE

| # | Issue | File | Severity | Time | Status |
|---|-------|------|----------|------|--------|
| 1 | IDOR: Course Access | course-actions.ts | 🔴 CRITICAL | 30m | ❌ |
| 2 | IDOR: Media Access | media/[...path].ts | 🔴 CRITICAL | 45m | ❌ |
| 3 | XSS: Course Topics | schema.ts | 🔴 CRITICAL | 1h | ❌ |
| 4 | CSRF: Missing Tokens | All actions | 🔴 CRITICAL | 2h | ❌ |
| 5 | Secrets in Git | .env | 🔴 CRITICAL | 1h | ❌ |
| 6 | Leaderboard Leakage | gamification.ts | 🟠 HIGH | 45m | ❌ |
| 7 | Quiz Answer Exposure | lesson-actions.ts | 🟠 HIGH | 1h | ❌ |
| 8 | Password Hijack | auth/password | 🟠 HIGH | 30m | ❌ |

**Total Fix Time:** ~7 hours (with testing)

---

## DEPLOYMENT GATE

**DO NOT DEPLOY UNLESS:**

- [ ] IDOR vulnerabilities fixed and tested (#1, #2)
- [ ] XSS input sanitization implemented (#3)
- [ ] CSRF protection on all state-changing actions (#4)
- [ ] Secrets rotated and removed from git (#5)
- [ ] Leaderboard restricted by school (#6)
- [ ] Quiz answers hidden until submission (#7)
- [ ] Password verification required for changes (#8)
- [ ] All fixes reviewed by 2nd engineer
- [ ] Integration tests passing 100%
- [ ] Load test with 1,000 concurrent users passed

**Once all boxes checked → PRODUCTION READY** ✅

---

## WHO SHOULD FIX WHAT

**Security Lead / Principal Engineer:**
- Fix #1-4 (Authorization + CSRF)
- Review and validate all fixes
- Run security test suite

**Backend Lead:**
- Fix #5-8 (Data validation + secrets)
- Assist with testing

**DevOps / Infrastructure:**
- Deploy new secrets to production
- Monitor session invalidation
- Verify backups working

---

## TESTING CHECKLIST

For each fix, verify:

```bash
# 1. Unit test — isolated function behavior
npm test -- course-actions.test.ts

# 2. Integration test — with database
npm test -- api.test.ts --integration

# 3. Security test — exploit prevention
npm test -- security.test.ts

# 4. Load test — concurrent requests
npm test -- load.test.ts

# 5. Manual test — browser walkthrough
npm run dev
# Open student portal
# Try to access other school's course (should 403)
# Open DevTools network tab
# Verify quiz answers NOT visible
# Try to change password without old password (should error)
```

---

## ESTIMATED TIMELINE

- **Today:** Assign owners, begin fixes #1-4
- **Tomorrow:** Complete fixes #5-8, start testing
- **Day 3:** Security review, fix remaining issues
- **Day 4:** Full integration test + load test
- **Day 5:** Deploy to production with rollback plan

**Total: 5 days to production-ready** ✅

---

**Questions or blockers? Escalate to security team immediately.**  
**This is a P0 blocker — all other work secondary.**
