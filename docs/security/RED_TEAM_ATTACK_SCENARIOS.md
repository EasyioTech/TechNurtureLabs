# RED TEAM ATTACK SCENARIOS - PHASE 4
**Target**: Validate all 9 fixes against real attack vectors  
**Duration**: 1-2 days  
**Outcome**: Confirm fixes are bulletproof

---

## ATTACK #1: PROMO CODE RACE CONDITION

**Objective**: Force 2+ successful uses of promo code with max_uses=1

**Attack Vector**:
```bash
# Create promo with max_uses=1
curl -X POST http://localhost:3000/api/admin/promo-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "code": "RACE_TEST_001",
    "max_uses": 1,
    "discount_value": 100,
    "discount_type": "fixed"
  }'

# Send 10 concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/payment/create-order \
    -d '{"plan_id":"test","promo_code_id":"RACE_TEST_001"}' &
done
wait

# Count successes
# Expected: Exactly 1 succeeds (200), rest fail (400/exhausted)
```

**Success Criteria**:
- [ ] Only 1 request succeeds
- [ ] Rest fail with "exhausted" error
- [ ] Database shows current_uses=1
- [ ] **Fix is bulletproof**: No race condition possible

---

## ATTACK #2: MULTI-DEVICE SESSION HIJACKING

**Objective**: Exploit race condition to maintain 2 active sessions

**Attack Vector**:
```bash
# Simulate opening lesson in Tab 1 and Tab 2 simultaneously
curl -X POST http://localhost:3000/api/learning/init \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"lessonId":"lesson_123"}' &

curl -X POST http://localhost:3000/api/learning/init \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"lessonId":"lesson_123"}' &
wait

# Try to use both tokens
TOKEN1="..." # from first response
TOKEN2="..." # from second response

# Both heartbeats should work if vulnerable
curl -X POST http://localhost:3000/api/learning/heartbeat \
  -d '{"token":"'$TOKEN1'", "playbackTime":10}'

curl -X POST http://localhost:3000/api/learning/heartbeat \
  -d '{"token":"'$TOKEN2'", "playbackTime":10}'

# Expected: TOKEN1 fails (403), TOKEN2 succeeds
# If both succeed: vulnerability exists
```

**Success Criteria**:
- [ ] First token fails (403 Session expired)
- [ ] Second token succeeds (200)
- [ ] **Fix is bulletproof**: Only 1 session active per lesson

---

## ATTACK #3: USER ENUMERATION VIA /auth/me POLLING

**Objective**: Enumerate valid users by polling /auth/me to infer activity

**Attack Vector**:
```bash
# Rapid polling to detect rate limit
for i in {1..50}; do
  RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X GET http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer $USER_TOKEN")
  
  echo "Request $i: $RESPONSE"
  
  if [ "$RESPONSE" = "429" ]; then
    echo "Rate limit hit at request $i"
    break
  fi
done

# Expected: 429 after ~30 requests
# If rate limit not hit by 50: vulnerability
```

**Success Criteria**:
- [ ] Rate limit triggers after 30 requests/min
- [ ] Returns 429 with Retry-After header
- [ ] Affects all users equally (not per IP)
- [ ] **Fix is bulletproof**: User enumeration prevented

---

## ATTACK #4: CROSS-SCHOOL DATA LEAKAGE

**Objective**: Access lessons from different school as student

**Attack Vectors**:
```bash
# Direct lesson access (School B lesson, School A student)
curl -X GET http://localhost:3000/api/student/lesson/lesson_from_school_b \
  -H "Authorization: Bearer $SCHOOL_A_STUDENT_TOKEN"

# Expected: 403 Forbidden or 404 Not Found
# If 200: vulnerability

# Try to access course from different school
curl -X POST http://localhost:3000/api/student/quiz/fetch \
  -H "Authorization: Bearer $SCHOOL_A_STUDENT_TOKEN" \
  -d '{"quizId":"quiz_in_school_b_course"}'

# Expected: 403/404
# If quiz data returned: vulnerability
```

**Success Criteria**:
- [ ] All cross-school access blocked (403/404)
- [ ] No data leakage
- [ ] School-ID check enforced at 4 layers
- [ ] **Fix is bulletproof**: Tenant isolation enforced

---

## ATTACK #5: QUIZ ANSWER KEY EXTRACTION

**Objective**: Extract answer keys from quiz response

**Attack Vector**:
```bash
# Fetch quiz as enrolled student
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:3000/api/student/quiz/fetch \
  -H "Authorization: Bearer $ENROLLED_STUDENT_TOKEN" \
  -d '{"quizId":"quiz_123"}')

# Search for answer indicators
echo "$QUIZ_RESPONSE" | grep -i "is_correct\|correct_answer\|feedback"

# Expected: No matches (empty output)
# If matches found: vulnerability
```

**Success Criteria**:
- [ ] No "is_correct" field in response
- [ ] No "correct_answer" field
- [ ] No "feedback" field
- [ ] Only id + option_text in options array
- [ ] **Fix is bulletproof**: Answer keys protected

---

## ATTACK #6: XP PRECISION MANIPULATION

**Objective**: Exploit number precision loss for leaderboard rank boost

**Attack Vector**:
```bash
# Request large XP value (>2^53)
XP_VALUE=$((2**53 + 1000))  # Beyond JavaScript Number precision

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | grep "cumulative_xp"

# Expected: "cumulative_xp": "9007199254742000"  (string)
# If number: "cumulative_xp": 9007199254742000 (loses precision)
```

**Success Criteria**:
- [ ] XP returned as string (JSON)
- [ ] Preserves full precision for values > 2^53
- [ ] Client-side parsing works correctly
- [ ] **Fix is bulletproof**: XP integrity maintained

---

## ATTACK #7: XP INJECTION ATTACK

**Objective**: Award XP to student in different school

**Attack Vector**:
```bash
# Admin attempts cross-school XP award
curl -X POST http://localhost:3000/api/gamification/award-xp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "student_in_school_a",
    "schoolId": "school_b",
    "xp": 5000
  }'

# Check student XP (should be unchanged)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $SCHOOL_A_STUDENT_TOKEN" \
  | grep "cumulative_xp"

# Expected: XP unchanged from before attack
```

**Success Criteria**:
- [ ] XP award silently rejected (no error exposed)
- [ ] Student's XP not increased
- [ ] School validation enforced
- [ ] **Fix is bulletproof**: XP injection prevented

---

## ATTACK #8: LEADERBOARD CACHE POISONING

**Objective**: Exploit stale cache to manipulate leaderboard rankings

**Attack Vector**:
```bash
# Get initial leaderboard
BEFORE=$(curl -s -X GET http://localhost:3000/api/student/leaderboard \
  -H "Authorization: Bearer $STUDENT_TOKEN")

# Award significant XP to student
curl -X POST http://localhost:3000/api/learning/complete \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"lessonId":"high_xp_lesson"}'

# Get leaderboard immediately (should be updated)
AFTER=$(curl -s -X GET http://localhost:3000/api/student/leaderboard \
  -H "Authorization: Bearer $STUDENT_TOKEN")

# Compare rankings
# Expected: Student rank improved
# If rank unchanged: cache not invalidated
```

**Success Criteria**:
- [ ] Leaderboard updates immediately after XP award
- [ ] No cache stale data
- [ ] Rankings reflect current state
- [ ] **Fix is bulletproof**: Cache invalidation working

---

## ATTACK #9: UNREASONABLE XP AMOUNT INJECTION

**Objective**: Award impossibly large XP amounts

**Attack Vector**:
```bash
# Attempt to award 1 million XP (limit is 10,000)
curl -X POST http://localhost:3000/api/gamification/award-xp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "student_123",
    "schoolId": "school_123",
    "xp": 1000000
  }'

# Check if XP was actually awarded
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | grep "cumulative_xp"

# Expected: XP unchanged, award rejected
```

**Success Criteria**:
- [ ] Awards > 10,000 rejected
- [ ] Negative XP rejected
- [ ] Only valid amounts accepted
- [ ] **Fix is bulletproof**: XP validation enforced

---

## ATTACK #10: CONCURRENT OPERATION STRESS TEST

**Objective**: Trigger race conditions under high concurrency

**Attack Vector**:
```bash
# 100 concurrent requests on multiple endpoints
ab -n 100 -c 50 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me

ab -n 100 -c 50 -H "Authorization: Bearer $TOKEN" \
  -p order.json \
  http://localhost:3000/api/payment/create-order

# Monitor for errors
# Expected: <0.1% error rate
```

**Success Criteria**:
- [ ] <0.1% error rate under 50 concurrent requests
- [ ] No race conditions triggered
- [ ] All responses valid
- [ ] **Fix is bulletproof**: Handles concurrency safely

---

## EXECUTION PLAN

### Day 1: Manual Attack Execution
```bash
# Run attacks 1-9 manually
# Document each result
# Flag any unexpected behavior
```

### Day 2: Automated Stress Testing
```bash
# Run concurrent load tests
# Monitor error rates
# Profile performance under attack
```

---

## SUCCESS CRITERIA

✅ All 9 attacks fail (fixes hold)  
✅ No data leakage  
✅ No race conditions under concurrency  
✅ Performance acceptable under stress  
✅ All security validations enforced  

**If all pass**: System is production-ready ✅

