# PHASE 5: 10,000 USER LOAD TEST
**Objective**: Validate system handles 10K concurrent users with <200ms p95 latency  
**Duration**: 1 day  
**Tools**: Apache Bench (ab), k6, or custom loader

---

## 10K USER PROFILE

```
Total Users: 10,000
├─ Super Admin: 1 (fixed)
├─ School Admins: 50 (1 per school)
├─ Teachers: 500 (10 per school)
└─ Students: 9,449 (189 per school on average)

Schools: 50
Courses per School: 10
Lessons per Course: 20
Total Lessons: 10,000

Concurrent Users in Load Test: 100-500 (ramping)
Duration: 60 minutes continuous
```

---

## LOAD TEST SCENARIO 1: BASELINE PERFORMANCE

**Objective**: Establish baseline metrics without fixes  

**Test Profile**:
```
Target: 100 concurrent users
Ramp-up: 10 seconds
Hold: 60 seconds
Endpoints:
  - GET /api/auth/me (20% of requests)
  - GET /student/lesson/[lessonId] (30%)
  - POST /api/learning/heartbeat (30%)
  - GET /student/courses (10%)
  - POST /api/student/quiz/fetch (10%)
```

**Metrics to Collect**:
- Response time: min, max, p50, p95, p99
- Error rate
- Throughput (requests/sec)
- CPU utilization
- Memory usage
- Database query count

**Expected Results** (with all fixes + indexes):
```
p50 latency: ~50ms
p95 latency: <150ms
p99 latency: <300ms
Error rate: <0.1%
Throughput: 500+ req/sec
```

---

## LOAD TEST SCENARIO 2: LESSON COMPLETION STORM

**Objective**: Test atomic operations and cache invalidation under load

**Test Profile**:
```
Target: 200 concurrent users
Each user:
  1. Open lesson
  2. Send 10 heartbeats (2-sec intervals)
  3. Complete lesson (triggers XP award + cache invalidation)
  4. Check leaderboard (should be updated)

Duration: 300 seconds
```

**Metrics**:
- Session creation success rate (must be atomic)
- Cache invalidation latency
- Leaderboard update time
- XP consistency

**Expected Results**:
```
Session creation: 100% success (no race conditions)
Cache invalidation: <100ms
Leaderboard update: <500ms
XP consistency: 100% accurate
```

---

## LOAD TEST SCENARIO 3: CROSS-SCHOOL ISOLATION VALIDATION

**Objective**: Ensure school-ID validation works under 10K load

**Test Profile**:
```
Target: 300 concurrent users
50% from School A
50% from School B

Attacks:
  - 10% of requests: Attempt cross-school lesson access
  - 10% of requests: Attempt cross-school quiz access
  - 10% of requests: Attempt cross-school XP award

Expected: 100% blocked (403/404)
```

**Metrics**:
- Cross-school request rejection rate
- Data leakage incidents
- Validation latency impact

**Expected Results**:
```
Cross-school blocks: 100%
Leakage incidents: 0
No performance degradation
```

---

## LOAD TEST SCENARIO 4: RATE LIMITING UNDER LOAD

**Objective**: Verify rate limiting doesn't cause denial-of-service

**Test Profile**:
```
Target: 400 concurrent users
Each making:
  - Normal requests (90%): Spread over time
  - Rate limit probe (10%): Rapid /auth/me calls

Expected: Rate limit triggers appropriately without cascading errors
```

**Metrics**:
- Rate limit accuracy (30 req/min per user)
- Impact on normal traffic
- 429 response latency

**Expected Results**:
```
Rate limit triggered: At 30th request/min
No cascading failures
No slowdown for compliant clients
```

---

## LOAD TEST SCENARIO 5: FULL REALISTIC WORKFLOW

**Objective**: Simulate realistic user behaviors at 10K scale

**Test Workflow**:
```
1. Authentication (2 sec)
   - Login: 1 req
   - /auth/me: 2 req (rate limited after ~2)

2. Browse Courses (5 sec)
   - GET /student/courses: 1 req
   - GET /student/course/[courseId]: 1 req

3. Take Lesson (30 sec)
   - POST /api/learning/init: 1 req (session creation)
   - POST /api/learning/heartbeat: 15 req (2 sec each)
   - POST /api/learning/complete: 1 req

4. Quiz (15 sec)
   - POST /api/student/quiz/fetch: 1 req
   - [User answers]: 5 req (answers)
   - POST /api/student/quiz/submit: 1 req

5. Check Progress (5 sec)
   - GET /api/auth/me: 1 req (XP updated)
   - GET /student/leaderboard: 1 req (ranking updated)

Total per user: ~30 requests over 60 seconds
At 10K users: ~5,000 req/sec
```

**Duration**: 60 minutes continuous  
**Ramp-up**: 100 → 500 concurrent users over 10 minutes

**Metrics**:
- Success rate by endpoint
- Error distribution
- Latency percentiles
- Database load
- Cache hit rate

**Expected Results**:
```
Overall success: >99.9%
p95 latency: <200ms
p99 latency: <500ms
Error rate: <0.1%
Cache hit rate: >80%
DB connections: <100
```

---

## PERFORMANCE UNDER ATTACK

### Test 6A: Promo Code Concurrent Abuse

```
100 concurrent users attempting same promo code with max_uses=1
Expected: Only 1 succeeds
Metric: Success rate accuracy
Result: Must be <1% error
```

### Test 6B: Session Race Condition Attack

```
50 concurrent users opening same lesson simultaneously
Expected: All get unique tokens, only last is active
Metric: Session creation atomic success
Result: 100% atomic guarantees
```

### Test 6C: XP Injection Storm

```
100 cross-school XP award attempts
Expected: 100% rejected
Metric: Validation enforcement
Result: Zero successful cross-school awards
```

---

## INFRASTRUCTURE REQUIREMENTS

### Database
```
PostgreSQL 14+
Connections: 100-200 max (verify pool size)
Indexes: 24 indexes applied (Fix #7)
Disk: >50GB free space
```

### Redis
```
Redis 6+
Memory: >4GB
Key-value pairs: <1M active keys
Latency: <5ms p95
```

### Application Server
```
CPU: 8+ cores
Memory: 16GB+ RAM
Disk: 50GB SSD
Network: 1Gbps+ NIC
```

### Load Generator
```
Machine 1: Apache Bench (ab) or k6
Can generate: >5K req/sec
Network isolated from production
```

---

## EXECUTION STEPS

### Day 1, Morning: Baseline (2 hours)

```bash
# Start fresh build
npm run build

# Start production server
npm run start

# Run Scenario 1 (100 users, 60 sec)
ab -n 6000 -c 100 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me

# Collect metrics
# Document baseline p95 latency
```

### Day 1, Afternoon: Stress Tests (4 hours)

```bash
# Scenario 2: Lesson completion storm (200 users)
# Scenario 3: Cross-school isolation (300 users)
# Scenario 4: Rate limiting (400 users)

# Monitor:
# - Response times
# - Error rates
# - Database queries
# - Cache hit rates
```

### Day 1, Evening: Full Realistic Load (2 hours)

```bash
# Scenario 5: Full workflow (ramp 100→500 users)
# Run for 60 minutes continuous
# Collect detailed metrics
```

### Day 2, Morning: Attack Scenarios (2 hours)

```bash
# Test 6A: Promo code abuse
# Test 6B: Session race conditions
# Test 6C: XP injection

# Verify all attacks fail (fixes hold)
```

---

## SUCCESS CRITERIA

### Performance
- [ ] p95 latency < 200ms
- [ ] p99 latency < 500ms
- [ ] Error rate < 0.1%
- [ ] Throughput > 500 req/sec
- [ ] No memory leaks (24h sustained)

### Security Under Load
- [ ] Race conditions: 0
- [ ] Data leakage: 0 incidents
- [ ] Cross-school access: 0% successful
- [ ] Rate limits: 100% enforced
- [ ] XP consistency: 100% accurate

### Database Health
- [ ] Query latency: <50ms p95
- [ ] Connection pool: <80 used
- [ ] Cache hit rate: >80%
- [ ] Transaction conflicts: 0

### System Stability
- [ ] No panics or crashes
- [ ] No connection timeouts
- [ ] No cascading failures
- [ ] Graceful error handling

---

## LOAD TEST TOOLS

### Option A: Apache Bench (Simple)
```bash
ab -n 10000 -c 100 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me
```

### Option B: k6 (JavaScript-based, realistic)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 500,
  duration: '60m',
  stages: [
    { duration: '10m', target: 500 },
    { duration: '40m', target: 500 },
    { duration: '10m', target: 100 },
  ],
};

export default function() {
  let response = http.get('http://localhost:3000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` },
  });
  check(response, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Option C: Artillery (YAML-based)
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 600
      arrivalRate: 100

scenarios:
  - name: 'Realistic user flow'
    flow:
      - get: { url: '/api/auth/me', headers: { 'Authorization': 'Bearer {{ token }}' } }
      - think: 2
      - get: { url: '/student/courses' }
      - think: 1
      - post: { url: '/api/learning/init', json: { lessonId: 'lesson_123' } }
```

---

## MONITORING DURING TEST

### Real-time Dashboard
```
CPU: _________%
Memory: _______MB
DB Connections: ___/200
Avg Latency: ___ms
Error Rate: ___%
Throughput: ___ req/sec
```

### Logs to Monitor
```bash
# Database slow queries
tail -f /var/log/postgresql/slow.log

# Application errors
tail -f /var/log/app/error.log

# System metrics
watch 'ps aux | grep node; free -h; df -h'
```

---

## REPORTING

### Load Test Report Template
```
DATE: [Date]
DURATION: [Duration]
PEAK USERS: [N]
PEAK THROUGHPUT: [req/sec]

PERFORMANCE:
  p50: ___ms
  p95: ___ms
  p99: ___ms
  Errors: ___%

SECURITY:
  Race Conditions: 0 ✓
  Data Leaks: 0 ✓
  Auth Failures: 0 ✓
  
STATUS: [PASS/FAIL]
```

---

## NEXT STEPS

1. ✅ Prepare infrastructure
2. ✅ Deploy application
3. ✅ Run baseline test
4. ✅ Run stress tests
5. ✅ Document results
6. ✅ Identify bottlenecks
7. → Phase 6: Performance Optimization (if needed)
8. → Production Deployment (if pass)

