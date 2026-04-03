# SECURITY TEST PLAN - HARDENING FIXES VERIFICATION

**Date**: 2026-04-03  
**Status**: Ready for QA/Testing  
**Scope**: Verify all 9 security fixes are working correctly  
**Expected Duration**: 2-3 hours (manual) + automated tests

---

## TEST SETUP REQUIREMENTS

### Prerequisites
- [ ] Staging environment deployed with Phase 2-3 fixes
- [ ] Test database with sample data (50 schools, 100+ students, multiple quizzes)
- [ ] Test admin accounts for each school
- [ ] Load testing tool (K6, Locust, or JMeter)
- [ ] API testing tool (Postman, REST Client)
- [ ] Database monitoring tools (pgAdmin, DataGrip)

### Test Data Setup Script
```bash
# Create test schools and users
npm run seed:test-env

# Verify data
npm run verify:test-data
```

---

## FIX #1: ATOMIC PROMO CODE INCREMENT

### Test Case 1.1: Single Request
**Description**: Verify promo code increments correctly on single request

**Steps**:
1. Create promo code: `{ code: "TEST100", max_uses: 5, discount_value: 100 }`
2. POST `/api/payment/create-order` with this code
3. Check DB: `SELECT current_uses FROM promo_codes WHERE code = 'TEST100'`

**Expected**:
- Response includes discount
- Database shows `current_uses = 1`
- No error

**Actual**: _______

---

### Test Case 1.2: Concurrent Requests (CRITICAL)
**Description**: Verify race condition is eliminated

**Steps**:
1. Create promo code: `{ code: "RACE50", max_uses: 1, discount_value: 50 }`
2. Send 5 concurrent requests with same code:
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/payment/create-order \
    -H "Content-Type: application/json" \
    -d '{"plan_id":"PLAN123","promo_code_id":"RACE50"}' &
done
wait
```
3. Check DB: `SELECT current_uses FROM promo_codes WHERE code = 'RACE50'`

**Expected**:
- Exactly 1 request succeeds with discount
- Exactly 4 requests fail with "code exhausted"
- Database shows `current_uses = 1` (not 5)

**Actual**: _______

---

### Test Case 1.3: Maximum Uses Enforcement
**Description**: Verify code rejects after reaching max_uses

**Steps**:
1. Create promo: `{ code: "LIMITED2", max_uses: 2 }`
2. Make 3 requests with this code
3. Check responses

**Expected**:
- Request 1: Success (current_uses → 1)
- Request 2: Success (current_uses → 2)
- Request 3: Fail with "exhausted" error
- Final DB value: `current_uses = 2`

**Actual**: _______

---

## FIX #2: ATOMIC SESSION CREATION

### Test Case 2.1: Single Session Initialization
**Description**: Verify session token is created correctly

**Steps**:
1. Student opens lesson: `/student/lesson/[lessonId]`
2. System creates learning session
3. Check DB: `SELECT COUNT(*) FROM lesson_sessions WHERE user_id = ? AND is_active = true`

**Expected**:
- Exactly 1 active session per lesson
- Session token is valid UUID
- No errors

**Actual**: _______

---

### Test Case 2.2: Session Invalidation on New Request (CRITICAL)
**Description**: Verify only 1 session active at a time

**Steps**:
1. Open Lesson A in Tab 1 → Creates session_1
2. Open Lesson A in Tab 2 → Should create session_2 (invalidates session_1)
3. Check DB: Count active sessions for user+lesson
4. Verify both tabs can't have valid tokens

**Expected**:
- Only 1 active session exists
- Old token rejected with 403
- New token in Tab 2 works
- Session_1 marked `is_active = false`

**Actual**: _______

---

### Test Case 2.3: Multi-Device Cheating Prevention
**Description**: Verify can't watch lesson 2x speed via parallel tabs

**Steps**:
1. Open lesson in Tab A (session_A created)
2. Open lesson in Tab B (session_B created, session_A invalidated)
3. Send heartbeat from Tab A with session_A token
4. Send heartbeat from Tab B with session_B token
5. Check video progress

**Expected**:
- Tab A heartbeat: Rejected (session expired)
- Tab B heartbeat: Accepted
- Progress only increments from Tab B
- Can't accumulate 2x verified seconds

**Actual**: _______

---

## FIX #3: RATE LIMITING ON /auth/me

### Test Case 3.1: Per-IP Rate Limiting
**Description**: Verify IP-level rate limit (100 requests/min)

**Steps**:
1. Send 101 rapid requests to `/api/auth/me` from same IP
2. Count successful responses
3. Check response for request #101

**Expected**:
- Requests 1-100: 200 OK
- Request 101: 429 Too Many Requests

**Actual**: _______

---

### Test Case 3.2: Per-User Rate Limiting (CRITICAL)
**Description**: Verify user-level rate limit (30 requests/min)

**Steps**:
1. Authenticate as Student A
2. Send 31 requests to `/api/auth/me` in rapid succession
3. Check responses

**Expected**:
- Requests 1-30: 200 OK
- Request 31: 429 Too Many Requests
- User is blocked even from different IPs (if testing from multiple IPs)

**Actual**: _______

---

### Test Case 3.3: Activity Enumeration Prevention
**Description**: Verify can't enumerate user activity via polling

**Steps**:
1. Attempt pattern: Poll `/api/auth/me` every 100ms for 1 minute
2. Monitor for patterns in responses (e.g., last_active_at changes)
3. Check rate limit enforcement

**Expected**:
- After 30 requests, rate limit kicks in
- Blocks reconnaissance attempts
- Activity data not leakable via polling

**Actual**: _______

---

## FIX #4: SCHOOL-ID SCOPING IN LESSON ACCESS

### Test Case 4.1: Valid Lesson Access
**Description**: Verify student can access lesson in their school

**Steps**:
1. Student A belongs to School 1
2. Lesson X belongs to Course Y in School 1
3. Student A enrolled in Course Y
4. GET `/api/student/lesson/[X]`

**Expected**:
- 200 OK
- Lesson data returned
- No errors

**Actual**: _______

---

### Test Case 4.2: Cross-School Access Prevention (CRITICAL)
**Description**: Verify student can't access lesson from different school

**Steps**:
1. Student A belongs to School 1
2. Lesson X belongs to School 2
3. Somehow student A gets enrolled in a course in School 2 (via admin override)
4. GET `/api/student/lesson/[X]`

**Expected**:
- 403 Forbidden
- Error: "Cross-school access denied"
- Lesson data NOT returned

**Actual**: _______

---

### Test Case 4.3: Enrollment Validation
**Description**: Verify enrollment is checked before lesson access

**Steps**:
1. Student A not enrolled in Course Y
2. GET `/api/student/lesson/[lessonId in Course Y]`

**Expected**:
- 403 Forbidden
- Error: "Enrollment required"

**Actual**: _______

---

### Test Case 4.4: School Mismatch Detection
**Description**: Verify student's school must match enrollment's school

**Steps**:
1. Student A school_id = 'school_1'
2. Enrollment school_id = 'school_2' (edge case: admin created cross-school enrollment)
3. GET `/api/student/lesson/[lesson in school_2]`

**Expected**:
- 403 Forbidden
- Error: "Cross-school access denied"
- Multiple validation layers catch this

**Actual**: _______

---

## FIX #5: XP PRECISION LOSS HANDLING

### Test Case 5.1: Large XP Preservation
**Description**: Verify XP above 2^53 is preserved exactly

**Steps**:
1. Set student cumulative_xp = 9007199254740993 (above 2^53)
2. GET `/api/auth/me`
3. Verify response XP value

**Expected**:
- Response shows: `"cumulative_xp": "9007199254740993"` (as string)
- No precision loss
- Can be safely handled by frontend

**Actual**: _______

---

### Test Case 5.2: Normal XP Handling
**Description**: Verify small XP values still work

**Steps**:
1. Award 100 XP to student
2. GET `/api/auth/me`
3. Verify cumulative_xp

**Expected**:
- XP correctly updated
- Returned as string
- Level calculated correctly

**Actual**: _______

---

## FIX #6: QUIZ ANSWER AUTHORIZATION

### Test Case 6.1: Valid Quiz Access
**Description**: Verify student can access quiz they're enrolled in

**Steps**:
1. Student enrolled in course containing quiz
2. Quiz not yet attempted
3. Call `getQuizData(quizId)`

**Expected**:
- Quiz metadata returned
- Questions returned (without answers)
- Options returned (without `is_correct` field)

**Actual**: _______

---

### Test Case 6.2: Quiz Answer Leakage Prevention (CRITICAL)
**Description**: Verify answer keys not leaked in response

**Steps**:
1. Get quiz data via `getQuizData()`
2. Inspect response JSON
3. Search for `is_correct`, `feedback`, `correct_answer`

**Expected**:
- Response contains only: `id`, `text`, `question_type`, `options` (with id + text), `points`
- NO `is_correct` field in options
- NO `feedback` field
- NO `correct_answer` field

**Actual**: _______

---

### Test Case 6.3: Attempt Limit Enforcement
**Description**: Verify student can't retake quiz beyond limit

**Steps**:
1. Quiz with `max_attempts = 2`
2. Student completes 2 attempts
3. Try to access quiz 3rd time via `getQuizData()`

**Expected**:
- Error: "Maximum attempts (2) exceeded"
- No quiz data returned

**Actual**: _______

---

### Test Case 6.4: Enrollment Validation
**Description**: Verify non-enrolled students can't access quiz

**Steps**:
1. Student NOT enrolled in course
2. Try `getQuizData(quizId)` from that course

**Expected**:
- Error: "Enrollment required to access assessment content"
- No quiz data returned

**Actual**: _______

---

### Test Case 6.5: School-ID Validation
**Description**: Verify cross-school quiz access blocked

**Steps**:
1. Student from School A
2. Quiz from School B course
3. Try `getQuizData(quizId)`

**Expected**:
- Error: "Cross-school access denied"

**Actual**: _______

---

## FIX #7: DATABASE INDEXES

### Test Case 7.1: Index Creation
**Description**: Verify all indexes created successfully

**Steps**:
1. Run: `drizzle migrate add_missing_indexes`
2. Query pg_indexes to list all new indexes

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

**Expected**:
- 18+ indexes listed
- No errors during creation
- All indexes with expected column combinations

**Actual**: _______

---

### Test Case 7.2: Index Usage Verification
**Description**: Verify indexes are being used by queries

**Steps**:
1. Run load test (100 concurrent users for 5 min)
2. Query index usage stats:

```sql
SELECT indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Expected**:
- All new indexes show `idx_scan > 0` (being used)
- High `idx_scan` values on frequently used indexes
- No sequential scans on indexed columns (check pg_stat_user_tables)

**Actual**: _______

---

### Test Case 7.3: Query Performance Improvement
**Description**: Verify queries are faster with indexes

**Steps**:
1. Measure query time WITHOUT indexes (before migration):
   - EXPLAIN ANALYZE on slow queries
2. Apply migration
3. Measure query time WITH indexes
4. Calculate improvement percentage

**Expected**:
- Enrollment lookups: 50-70% faster
- Leaderboard queries: 60-80% faster
- Progress aggregation: 40-60% faster

**Actual**: _______

---

## FIX #8: LEADERBOARD CACHE INVALIDATION

### Test Case 8.1: User-Level Cache Invalidation
**Description**: Verify student's progress updates immediately

**Steps**:
1. Student completes lesson
2. Check student dashboard (cached)
3. Verify updated XP shows immediately

**Expected**:
- Cache invalidated for user
- Dashboard shows latest XP
- No stale data visible

**Actual**: _______

---

### Test Case 8.2: School-Level Leaderboard Update
**Description**: Verify school leaderboard updates after lesson completion

**Steps**:
1. Student A completes lesson (gains 100 XP)
2. Check school leaderboard (likely cached)
3. Verify Student A moves up in ranking

**Expected**:
- School leaderboard cache invalidated
- Updated rankings shown
- Student A in higher position

**Actual**: _______

---

### Test Case 8.3: Global Leaderboard Update
**Description**: Verify global leaderboard cache invalidated

**Steps**:
1. Student completes lesson
2. Check global leaderboard
3. Verify student's position updated

**Expected**:
- Global leaderboard cache invalidated
- Updated rankings visible
- No stale cache affecting rankings

**Actual**: _______

---

### Test Case 8.4: Multi-Level Invalidation
**Description**: Verify all cache levels invalidated together

**Steps**:
1. 5 students complete lessons simultaneously
2. Check user, school, course, and global dashboards
3. All should show consistent, up-to-date data

**Expected**:
- No data inconsistency between cache levels
- All views show same XP values
- Rankings consistent across views

**Actual**: _______

---

## FIX #9: GAMIFICATION SCHOOL VALIDATION

### Test Case 9.1: Valid XP Award
**Description**: Verify legitimate XP awards work correctly

**Steps**:
1. Student A from School 1
2. Award 50 XP with schoolId = "school_1"
3. Verify XP updated in DB

**Expected**:
- XP awarded successfully
- cumulative_xp incremented by 50
- No errors

**Actual**: _______

---

### Test Case 9.2: Cross-School XP Injection Prevention (CRITICAL)
**Description**: Verify XP can't be injected across schools

**Steps**:
1. Student A from School 1
2. Try to award XP with schoolId = "school_2"
3. Check if XP actually incremented

**Expected**:
- XP award silently fails (no error to frontend)
- DB shows no XP change
- Prevents cross-school XP manipulation

**Actual**: _______

---

### Test Case 9.3: Invalid XP Amount Rejection
**Description**: Verify unreasonable XP amounts rejected

**Steps**:
1. Try to award XP = 999999 (> 10000 limit)
2. Check DB
3. Try negative XP = -100
4. Check DB

**Expected**:
- Both requests rejected
- No XP change in DB
- Error logged

**Actual**: _______

---

### Test Case 9.4: Leaderboard Integrity
**Description**: Verify gamification service maintains leaderboard integrity

**Steps**:
1. Award XP to 10 students in sequence
2. Check Redis leaderboard: `ZRANGE lb:global 0 -1 WITHSCORES`
3. Compare to DB leaderboard: `SELECT id, cumulative_xp FROM students`
4. Verify consistency

**Expected**:
- Redis and DB leaderboards match
- All students in correct order
- XP values consistent

**Actual**: _______

---

## AUTOMATED TEST SUITE

Create automated tests for all fixes:

```typescript
// test/security-fixes.test.ts

describe('Security Fixes Verification', () => {
    describe('Fix #1: Promo Code Atomicity', () => {
        test('concurrent requests respect max_uses', async () => {
            // Test implementation
        });
    });

    describe('Fix #2: Session Atomicity', () => {
        test('only one session active per lesson', async () => {
            // Test implementation
        });
    });

    // ... more tests
});
```

**Run Tests**:
```bash
npm test -- security-fixes.test.ts
```

---

## REGRESSION TEST SUITE

Ensure fixes don't break existing functionality:

- [ ] Normal lesson completion flow works
- [ ] Quiz submission and scoring works
- [ ] Leaderboard rankings update correctly
- [ ] XP awards reflected in dashboard
- [ ] Payment checkout completes successfully
- [ ] Multi-course enrollment works
- [ ] Admin functions unaffected

---

## SIGN-OFF CHECKLIST

After completing all tests:

- [ ] All 9 fixes verified working
- [ ] No regression issues found
- [ ] Performance metrics acceptable
- [ ] Security improvements validated
- [ ] Code review passed
- [ ] Ready for staging deployment

---

## RISK ASSESSMENT

| Fix | Risk Level | Mitigation | Rollback Cost |
|-----|-----------|------------|---------------|
| #1 Promo | LOW | Non-critical for users | Instant |
| #2 Session | MEDIUM | May affect some users | ~1 hour |
| #3 Rate Limit | LOW | Users can wait 1 min | Instant |
| #4 School-ID | MEDIUM | Cross-school edge case | ~30 min |
| #5 XP Precision | LOW | Rare (high XP users) | Instant |
| #6 Quiz Auth | MEDIUM | Assessment integrity critical | ~1 hour |
| #7 Indexes | LOW | DB-side only | Instant |
| #8 Cache | LOW | Eventual consistency OK | Instant |
| #9 Gamification | LOW | Non-critical fix | Instant |

---

## APPROVED FOR TESTING

- [ ] Test Plan Reviewed
- [ ] Test Environment Prepared
- [ ] Resources Allocated
- [ ] Timeline: 2-3 hours

**Sign-Off**: _________________ Date: _________

---

**Generated**: 2026-04-03  
**Status**: Ready for QA  
**Owner**: Engineering + QA Team
