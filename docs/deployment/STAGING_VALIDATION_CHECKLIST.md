# STAGING VALIDATION CHECKLIST
**Status**: Ready for execution  
**Date**: 2026-04-03  
**Estimated Duration**: 2-3 hours

---

## PRE-DEPLOYMENT VERIFICATION ✅

- [x] All 9 security fixes implemented
- [x] Code review completed
- [x] Test suite created (20+ cases)
- [x] Documentation complete
- [x] Build system functional
- [x] Dev server running
- [x] No breaking changes
- [x] 100% backward compatible

---

## DEPLOYMENT PHASE

### Phase 1: Deploy to Staging

**Duration**: 15-20 minutes

- [ ] Read STAGING_DEPLOYMENT_GUIDE.md Step 3 completely
- [ ] Choose deployment method:
  - [ ] Option A: Docker deployment (recommended)
  - [ ] Option B: Manual VPS deployment
- [ ] Execute deployment steps
- [ ] Verify deployment logs
- [ ] Confirm no errors

**Success Criteria**:
- Application deployed to staging
- No deployment errors in logs
- Service is reachable

---

### Phase 2: Verify Deployment

**Duration**: 10-15 minutes

Run these commands:

```bash
# 1. Health check
curl -X GET https://staging.technurture.io/api/health
# Expected: { "status": "ok" }

# 2. Database connection
curl -X GET https://staging.technurture.io/api/db/health
# Expected: Connection successful message

# 3. Redis connection (if Redis endpoint exposed)
curl -X GET https://staging.technurture.io/api/redis/health
# Expected: Connection successful message
```

- [ ] Health check returns 200
- [ ] Database connection verified
- [ ] Redis connection verified (if applicable)
- [ ] No startup errors in logs

**Success Criteria**:
- All health checks pass
- Application is ready to accept requests

---

## SECURITY TEST EXECUTION

### Test Phase 1: Core Fix Validation (30 minutes)

#### Test 1.1: Promo Code Atomicity

- [ ] Create test promo code with max_uses = 1
- [ ] Send 5 concurrent requests with same code
- [ ] Verify results:
  - [ ] Exactly 1 request succeeds (200)
  - [ ] 4 requests fail with "exhausted" or "usage limit" error
  - [ ] Database shows current_uses = 1

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 1.1

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

#### Test 1.2: Session Atomicity

- [ ] Open lesson in Tab 1 (get SESSION_TOKEN_1)
- [ ] Open same lesson in Tab 2 concurrently (get SESSION_TOKEN_2)
- [ ] Verify:
  - [ ] Both requests succeed (201)
  - [ ] Tokens are different
  - [ ] Send heartbeat with TOKEN_1:
    - [ ] Expect 403/401 (session expired)
  - [ ] Send heartbeat with TOKEN_2:
    - [ ] Expect 200 (success)

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 1.2

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

#### Test 1.3: Rate Limiting

- [ ] Send 31 requests to /auth/me as same user within 60 seconds
- [ ] Verify:
  - [ ] Requests 1-30: Return 200 OK
  - [ ] Request 31: Returns 429 Too Many Requests
  - [ ] Response includes Retry-After header

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 1.3

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

#### Test 1.4: School-ID Validation

- [ ] Student A attempts to access lesson in School B
- [ ] Verify:
  - [ ] Request returns 403 Forbidden
  - [ ] Error message indicates cross-school access denied
  - [ ] No lesson data leaked

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 1.4

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

### Test Phase 2: Advanced Scenarios (30 minutes)

#### Test 2.1: Quiz Authorization & Answer Key Protection

- [ ] Fetch quiz data as enrolled student
- [ ] Verify response:
  - [ ] Quiz metadata present (id, title, max_attempts)
  - [ ] Questions array present
  - [ ] Options array present for each question
  - [ ] **CRITICAL**: No "is_correct" field in response
  - [ ] **CRITICAL**: No "correct_answer" field in response
  - [ ] **CRITICAL**: No "feedback" field in response
- [ ] Search response JSON for dangerous fields:
  ```bash
  grep -i "is_correct\|correct_answer\|feedback" response.json
  # Expected: No matches (empty output)
  ```

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 2.1

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

#### Test 2.2: Cross-School XP Injection

- [ ] Award XP to Student A with mismatched school_id
- [ ] Verify:
  - [ ] Request returns 200 or 400/403
  - [ ] Check student's XP in database:
    - [ ] XP should NOT have increased
    - [ ] Silent rejection (no error exposed)

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 2.2

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

#### Test 2.3: Cache Invalidation

- [ ] Get initial leaderboard ranking
- [ ] Complete lesson (awards XP to student)
- [ ] Get leaderboard again immediately
- [ ] Verify:
  - [ ] Student's position improved (or XP increased)
  - [ ] Cache was invalidated (not stale)

**Documentation**: See STAGING_DEPLOYMENT_GUIDE.md Test 2.3

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

### Test Phase 3: Automated Test Suite (30 minutes)

#### Execute Automated Tests

```bash
cd /path/to/TechNurtureLabs

# Install test dependencies
npm install --save-dev jest @jest/globals ts-jest @types/jest

# Run security fixes test suite
npm test -- tests/security-fixes.integration.test.ts --coverage

# Expected output:
# PASS  tests/security-fixes.integration.test.ts
#   Security Fixes Verification
#     Fix #1: Promo Code Atomicity
#       ✓ should reject duplicate promo code usage (race condition prevention) (45ms)
#     Fix #2: Session Atomicity
#       ✓ should enforce single active session per lesson (32ms)
#     ... [all tests should pass]
#   Tests: 20+ passed, 0 failed
```

- [ ] All tests pass
- [ ] No errors or warnings
- [ ] Coverage meets minimum (>80%)

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

## PERFORMANCE VALIDATION (15 minutes)

### Test Phase 4: Performance Baseline

#### Test 4.1: Query Performance

```bash
# Measure enrollment lookup time (should be < 50ms with indexes)
time curl -X GET https://staging.technurture.io/api/student/enrollment/COURSE_ID \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected: < 50ms (with indexes)
# If > 100ms: Indexes may not be applied
```

- [ ] Enrollment lookup: < 50ms
- [ ] Dashboard load: < 200ms
- [ ] No performance regression from baseline

**Result**: ☐ PASS / ☐ FAIL / ☐ BLOCKED

---

## REGRESSION TESTING (15 minutes)

### Critical User Flows

- [ ] **Login Flow**
  - [ ] User can log in successfully
  - [ ] Authentication token generated
  - [ ] User profile loaded

- [ ] **Lesson Completion**
  - [ ] Student can open lesson
  - [ ] Heartbeats work normally
  - [ ] Lesson completion recorded
  - [ ] XP awarded correctly

- [ ] **Quiz Submission**
  - [ ] Student can access quiz
  - [ ] Answers submittable
  - [ ] Results recorded
  - [ ] Score calculated

- [ ] **Leaderboard Display**
  - [ ] Leaderboard loads
  - [ ] Rankings correct
  - [ ] XP values display correctly

---

## CRITICAL FAILURE SCENARIOS

### If Test Fails: Promo Code Atomicity

- [ ] Check code was deployed: `git log --oneline | head -1`
- [ ] Verify DB change: `SELECT current_uses FROM promo_codes WHERE code = 'TEST_ATOMIC_1'`
- [ ] Clear cache: `docker restart technurture-lms-staging`
- [ ] Re-run test
- [ ] If still fails: Rollback deployment

**Escalation**: Contact engineering team

---

### If Test Fails: Session Atomicity

- [ ] Check transaction is in code: `grep -n "db.transaction" src/lib/services/learning-session.ts`
- [ ] Verify DB schema: `\dt lesson_sessions` (in psql)
- [ ] Check Redis: `redis-cli ping` (should return PONG)
- [ ] Review code change in `learning-session.ts`
- [ ] Rollback if necessary

**Escalation**: Contact engineering team

---

### If Test Fails: Rate Limiting

- [ ] Check rate limit service initialized
- [ ] Verify Redis is running: `redis-cli ping`
- [ ] Check /auth/me endpoint for rate limit code
- [ ] Restart application
- [ ] Re-run test
- [ ] If still fails: Rollback deployment

**Escalation**: Contact engineering team

---

## SIGN-OFF CHECKLIST

### QA Approval

- [ ] All Phase 1 tests passed
- [ ] All Phase 2 tests passed
- [ ] All Phase 3 (automated) tests passed
- [ ] No regressions detected
- [ ] Performance acceptable
- [ ] Documentation clear and complete

**QA Sign-Off**: ☐ APPROVED / ☐ REJECTED

**QA Tester**: ______________________  
**Date**: ______________________

---

### Engineering Approval

- [ ] Code review complete
- [ ] Tests validate all fixes
- [ ] Deployment successful
- [ ] Monitoring configured
- [ ] Ready for next phase

**Engineering Lead**: ______________________  
**Date**: ______________________

---

### Product Approval

- [ ] Security improvements confirmed
- [ ] No user-facing changes
- [ ] Performance meets expectations
- [ ] Ready for production deployment

**Product Lead**: ______________________  
**Date**: ______________________

---

## NEXT STEPS (After Sign-Off)

If all tests pass:

1. ✅ **Staging Validation Complete**
2. ⏳ **Phase 4: Red Team Testing** (1-2 days)
3. ⏳ **Phase 5: Load Testing** (1 day)
4. ⏳ **Phase 6: Optimization** (1-2 days)
5. ⏳ **Production Deployment** (1 day)

---

## CONTACT & ESCALATION

**Questions**: Check SECURITY_TEST_PLAN.md  
**Test Failures**: Review STAGING_DEPLOYMENT_GUIDE.md critical failure section  
**Deployment Issues**: Contact DevOps team  
**Security Concerns**: Contact Security team  
**Emergency**: Page on-call engineer

---

## SUMMARY

**Total Estimated Time**: 2-3 hours

**Success Criteria**:
- ✅ All automated tests pass
- ✅ All manual tests pass
- ✅ No regressions detected
- ✅ Performance acceptable
- ✅ Approvals obtained

**Status**: Ready for execution

---

**Document**: STAGING_VALIDATION_CHECKLIST.md  
**Generated**: 2026-04-03  
**Status**: Ready for staging deployment
