# EXECUTE PHASE 4-5 NOW

**Status**: Code verified ✅ | Build verified ✅ | Ready to attack ✅

---

## PHASE 4: RED TEAM (Start Today)

### Manual Attack Execution

```bash
# Attack #1: Promo Code Race (Atomic Guarantee)
cd /c/Users/cristy\'s/TechNurtureLabs

# Create promo with max_uses=1
curl -X POST http://localhost:3000/api/admin/promo-codes \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "RACE_001",
    "max_uses": 1,
    "discount_value": 100,
    "discount_type": "fixed"
  }'

# Send 10 concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/payment/create-order \
    -H "Content-Type: application/json" \
    -d '{"plan_id":"test","promo_code_id":"RACE_001"}' &
done
wait

# Expected: 1 succeeds (200), 9 fail (400 exhausted)
# If all succeed or multiple succeed: VULNERABILITY
```

### Attack #2: Session Atomicity (Multi-Device Cheating)

```bash
# Concurrent init requests
TOKEN1=$(curl -s -X POST http://localhost:3000/api/learning/init \
  -H "Authorization: Bearer student_token" \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"lesson_123"}' | jq -r '.token')

TOKEN2=$(curl -s -X POST http://localhost:3000/api/learning/init \
  -H "Authorization: Bearer student_token" \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"lesson_123"}' | jq -r '.token')

# Try TOKEN1 (should fail)
curl -X POST http://localhost:3000/api/learning/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"token":"'$TOKEN1'","playbackTime":10,"nonce":1}'

# Try TOKEN2 (should succeed)
curl -X POST http://localhost:3000/api/learning/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"token":"'$TOKEN2'","playbackTime":10,"nonce":1}'

# Expected: TOKEN1=403 (expired), TOKEN2=200 (valid)
# If both=200: VULNERABILITY
```

### Attack #3: Rate Limit Bypass

```bash
# Send 31 requests rapidly
for i in {1..31}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer student_token")
  echo "Request $i: $STATUS"
done

# Expected: First 30 = 200, 31st = 429
# If all = 200: VULNERABILITY
```

### Attack #4: Cross-School Access

```bash
# Try to access lesson from different school
curl -X GET http://localhost:3000/api/student/lesson/lesson_from_school_b \
  -H "Authorization: Bearer school_a_student_token"

# Expected: 403 or 404
# If 200 + data: VULNERABILITY

# Try cross-school quiz
curl -X POST http://localhost:3000/api/student/quiz/fetch \
  -H "Authorization: Bearer school_a_student_token" \
  -H "Content-Type: application/json" \
  -d '{"quizId":"quiz_in_school_b"}'

# Expected: 403 or 404
# If quiz data: VULNERABILITY
```

### Attack #5: Answer Key Leakage

```bash
# Fetch quiz and check for answer keys
RESPONSE=$(curl -s -X POST http://localhost:3000/api/student/quiz/fetch \
  -H "Authorization: Bearer enrolled_student_token" \
  -H "Content-Type: application/json" \
  -d '{"quizId":"quiz_123"}')

echo "$RESPONSE" | grep -i "is_correct\|correct_answer\|feedback"

# Expected: No matches (empty output)
# If matches found: VULNERABILITY
```

### Attack #6: XP Precision Loss

```bash
# Check XP format
curl -s -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer student_token" | jq '.user.cumulative_xp'

# Expected output: "9007199254744000" (string)
# If output: 9007199254744000 (number): VULNERABILITY
```

### Attack #7: Cross-School XP Injection

```bash
# Award XP to student in wrong school
curl -X POST http://localhost:3000/api/gamification/award-xp \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "student_in_school_a",
    "schoolId": "school_b",
    "xp": 5000
  }'

# Check if XP increased
curl -s -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer school_a_student_token" | jq '.user.cumulative_xp'

# Expected: XP unchanged
# If increased: VULNERABILITY
```

### Attack #8: Cache Staleness

```bash
# Get initial leaderboard
curl -s -X GET http://localhost:3000/api/student/leaderboard \
  -H "Authorization: Bearer student_token" | jq '.leaderboard[0]'

# Complete lesson (awards XP)
curl -X POST http://localhost:3000/api/learning/complete \
  -H "Authorization: Bearer student_token" \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"high_xp_lesson"}'

# Get leaderboard immediately
curl -s -X GET http://localhost:3000/api/student/leaderboard \
  -H "Authorization: Bearer student_token" | jq '.leaderboard[0]'

# Expected: Rank improved, cache invalidated
# If rank unchanged: VULNERABILITY
```

### Attack #9: Unreasonable XP Amounts

```bash
# Try 1 million XP (limit is 10,000)
curl -X POST http://localhost:3000/api/gamification/award-xp \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "student_123",
    "schoolId": "school_123",
    "xp": 1000000
  }'

# Check XP (should be unchanged)
curl -s -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer student_token" | jq '.user.cumulative_xp'

# Expected: XP unchanged
# If increased: VULNERABILITY
```

### Attack #10: Concurrent Stress

```bash
# 100 concurrent requests
ab -n 100 -c 50 -H "Authorization: Bearer $STUDENT_TOKEN" \
  http://localhost:3000/api/auth/me

# Expected: <0.1% error rate
# If errors: VULNERABILITY
```

---

## SUCCESS MATRIX

| Attack | Fix | Test | Expected | Status |
|--------|-----|------|----------|--------|
| #1 | Atomic Promo | Concurrent requests | 1 success | ☐ PASS |
| #2 | Atomic Session | Multi-device | Old token invalid | ☐ PASS |
| #3 | Rate Limiting | Rapid polling | 429 after 30 | ☐ PASS |
| #4 | School-ID | Cross-school access | 403 blocked | ☐ PASS |
| #5 | Quiz Auth | Answer key search | No matches | ☐ PASS |
| #6 | XP Precision | Large value check | String format | ☐ PASS |
| #7 | XP Validation | Cross-school award | No change | ☐ PASS |
| #8 | Cache Invalid | Leaderboard update | Immediate | ☐ PASS |
| #9 | XP Limits | Large amounts | Rejected | ☐ PASS |
| #10 | Concurrency | 100 concurrent | <0.1% error | ☐ PASS |

**If all PASS**: All fixes confirmed ✅  
**If any FAIL**: Vulnerability found ⚠️

---

## PHASE 5: 10K LOAD TEST (After Red Team Passes)

### Install k6
```bash
# Windows
choco install k6

# macOS
brew install k6

# Linux
sudo apt install k6
```

### Run Baseline Test (100 users)
```bash
k6 run \
  --vus 100 \
  --duration 60s \
  -e BASE_URL=http://localhost:3000 \
  -e STUDENT_TOKEN=$STUDENT_TOKEN \
  load-test.js
```

### Run Full Load Test (100→500 users)
```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e STUDENT_TOKEN=$STUDENT_TOKEN \
  -e ADMIN_TOKEN=$ADMIN_TOKEN \
  load-test.js

# Expected output:
# ✓ p95 latency < 200ms
# ✓ p99 latency < 500ms
# ✓ http_req_failed rate < 0.001
```

### Attack Scenarios Under Load
```bash
# Run promo code attack under load
k6 run \
  --vus 100 \
  -e BASE_URL=http://localhost:3000 \
  --duration 300s \
  -o json=results.json \
  load-test.js
```

---

## CRITICAL METRICS TO TRACK

```
REAL-TIME DASHBOARD:
├─ CPU: _________%
├─ Memory: _______MB
├─ DB Connections: ___/200
├─ Avg Latency: ___ms
├─ p95 Latency: ___ms
├─ Error Rate: ___%
└─ Throughput: ___ req/sec
```

---

## STOP CONDITIONS

**STOP immediately if**:
- Any attack succeeds (vulnerability found)
- Error rate >1%
- Memory grows unbounded
- Database connections exhaust
- System crashes

**Otherwise continue** to completion.

---

## NEXT AFTER COMPLETION

### If All Pass ✅
1. Document results
2. Phase 6: Performance Optimization (if needed)
3. Production deployment approval

### If Any Fail ⚠️
1. Investigate root cause
2. Fix vulnerability
3. Re-test specific scenario
4. Resume from failure point

---

## TIME ESTIMATE

- Red Team: 1 day (all manual + concurrent tests)
- Load Test: 1 day (4 scenarios + attacks)
- Analysis: 0.5 day
- **Total**: 2-3 days to "8.5/10 readiness"

---

## START NOW

1. ✅ Have all 9 fixes verified
2. ✅ Have build passing
3. ✅ Have load test script ready
4. → **Execute Attack #1 (Promo Code Race)**
5. → Document results
6. → Continue to Attacks #2-#10
7. → Move to Phase 5 load testing

**Ready?** Execute now.

