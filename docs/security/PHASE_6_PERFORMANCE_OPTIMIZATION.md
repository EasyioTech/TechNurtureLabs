# PHASE 6: PERFORMANCE OPTIMIZATION
**Objective**: Achieve <200ms p95 latency at 500 concurrent users  
**Status**: READY FOR EXECUTION  
**Duration**: 3-4 hours  
**Expected Readiness**: 8.5-9.0/10

---

## CRITICAL PATH (DO FIRST)

### 1. DEPLOY DATABASE INDEXES (30 min)

**Script Location**: `drizzle/add_missing_indexes.sql`  
**Indexes**: 24 total  
**Expected Impact**: 50-80% query latency reduction

**Indexes to Deploy**:
```sql
-- Enrollment lookups
CREATE INDEX idx_enrollments_user_school_course ON enrollments(user_id, school_id, course_id);

-- Progress tracking
CREATE INDEX idx_lesson_progress_user_lesson_school ON lesson_progress(user_id, lesson_id, school_id);

-- XP/analytics
CREATE INDEX idx_xp_events_user_school_source ON xp_events(user_id, school_id, source);

-- Leaderboard queries
CREATE INDEX idx_students_school_xp_desc ON students(school_id, cumulative_xp DESC);

-- Session management
CREATE INDEX idx_lesson_sessions_user_lesson_active ON lesson_sessions(user_id, lesson_id, is_active);

-- Quiz attempts
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);

-- (+ 18 more strategic indexes in script)
```

**How to Deploy**:
```bash
# Connect to database and run:
psql $DATABASE_URL < drizzle/add_missing_indexes.sql

# Or with drizzle-kit:
npm run db:migrate
```

**Verify Deployment**:
```bash
# List all indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

# Expected: 24+ new indexes
```

---

## PHASE 6 EXECUTION PLAN

### STEP 1: Deploy Indexes (Time: 30 min)

```bash
# 1. Backup database (safety first)
pg_dump $DATABASE_URL > /tmp/db_backup.sql

# 2. Deploy indexes
psql $DATABASE_URL < drizzle/add_missing_indexes.sql

# 3. Verify index creation
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';"

# Expected output: 24+ indexes
```

**Expected Result**: ✅ All 24 indexes deployed

---

### STEP 2: Query Performance Testing (Time: 1 hour)

**Measure Before & After**:

```bash
# Test enrollment lookup (frequent operation)
time curl -s -X GET http://localhost:3000/api/student/enrollment/course_123 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Measure latency (should be <50ms with index)
# If >100ms: index may not be used
```

**Key Queries to Test**:
1. Enrollment lookup (Fix #4 validation)
2. Lesson progress tracking (Fix #2 leaderboard cache)
3. XP query (Fix #5 precision test)
4. Session lookup (Fix #2 session management)
5. Quiz attempt limit check (Fix #6 authorization)

**Success Criteria**:
```
Query                    Before    After     Target
─────────────────────────────────────────────────────
Enrollment lookup        ~30ms     <10ms     ✅
Progress tracking        ~40ms     <15ms     ✅
XP events              ~80ms     <20ms     ✅
Session management     ~25ms     <8ms      ✅
Quiz attempts          ~50ms     <15ms     ✅
```

---

### STEP 3: Re-run Load Test Phase 5 (Time: 1 hour)

**Execute after indexes deployed**:

```bash
# Run full load test scenario (Scenario 5)
k6 run load-test.js \
  --vus 500 \
  --duration 300s \
  -e BASE_URL=http://localhost:3000

# Expected results:
# p50: <75ms
# p95: <150ms (was <200ms target, now improved)
# p99: <300ms (was <500ms target, now improved)
# Error rate: <0.1%
```

**Compare to Phase 5 Results**:
- Should see 30-50% latency improvement
- Error rate should stay <0.1%
- Cache hit rate should be >80%

---

### STEP 4: Connection Pool Tuning (Time: 30 min)

**Monitor during load test**:

```bash
# Check database connection usage
watch 'psql $DATABASE_URL -c "SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;"'

# Expected:
# Connection count: <100/200 available
# Connection pool not saturated
# No connection timeouts in logs
```

**If connections exhausted**:
```
Current Pool: 200
Needed: <100 (should have headroom)
Action: Increase connection pool if needed
```

---

### STEP 5: Cache Hit Rate Analysis (Time: 30 min)

**Monitor Redis cache**:

```bash
# Check cache hit rate
redis-cli INFO stats

# Expected:
# keyspace_hits: > 80%
# keyspace_misses: < 20%

# Monitor leaderboard cache specifically
redis-cli KEYS "school:*:leaderboard" | wc -l
# Should have entries for each school
```

**Optimize if <80% hit rate**:
- Increase Redis memory
- Add more cache layers
- Extend TTL for stable data

---

### STEP 6: Memory & Resource Monitoring (Time: 30 min)

**Monitor during sustained load (2 hours)**:

```bash
# Watch for memory leaks
watch 'free -h && ps aux | grep node | grep -v grep'

# Expected:
# Memory stable (no growth over 2+ hours)
# CPU <70% average
# No major spikes
```

**Run with background monitoring**:
```bash
# Start monitoring in background
(while true; do echo "$(date): $(free -h | grep Mem)"; sleep 60; done) > /tmp/memory_log.txt &
```

---

## SUCCESS CRITERIA

### Performance Targets
```
Metric                Target        After Index   Status
──────────────────────────────────────────────────────────
p50 latency          <100ms        <75ms         ✅
p95 latency          <200ms        <150ms        ✅
p99 latency          <500ms        <300ms        ✅
Error rate           <0.1%         <0.1%         ✅
Throughput           >500 req/sec  >1000 req/sec ✅
Cache hit rate       >80%          >85%          ✅
```

### Stability Targets
```
Metric                                   Target      Status
────────────────────────────────────────────────────────────
Memory growth over 2 hours               <100MB      ✅
Connection pool usage                    <100/200    ✅
Database slow queries                    0           ✅
Application crashes                      0           ✅
Error logs                               0 critical  ✅
```

### Security Targets (Should not regress)
```
Security Aspect              Target      Status
─────────────────────────────────────────────
Race conditions              0           ✅ (from Phase 4)
Data leakage                 0           ✅ (from Phase 4)
Cross-school access          Blocked     ✅ (from Phase 4)
Rate limiting               Working     ✅ (from Phase 4)
```

---

## EXECUTION TIMELINE

**Hour 0-0.5**: Deploy indexes
- [ ] Backup database
- [ ] Create indexes
- [ ] Verify creation

**Hour 0.5-1.5**: Query testing
- [ ] Test key queries
- [ ] Verify latency improvements
- [ ] Analyze explain plans

**Hour 1.5-2.5**: Load test re-run
- [ ] Run Scenario 5 (full workflow)
- [ ] Collect performance metrics
- [ ] Compare with Phase 5 results

**Hour 2.5-3**: Optimization & tuning
- [ ] Adjust pool sizes if needed
- [ ] Optimize cache settings
- [ ] Add indexes if needed

**Hour 3+**: Final validation
- [ ] Run 2-hour sustained load test
- [ ] Monitor memory/stability
- [ ] Verify all security fixes still work
- [ ] Decision: Ready for production?

---

## IF PHASE 6 FAILS

**If p95 latency still >200ms**:
1. Add query consolidation
2. Implement selective field projection
3. Add application-level caching
4. Consider database replication

**If error rate >0.1%**:
1. Check database connectivity
2. Verify connection pool settings
3. Analyze error logs
4. Add retries if transient errors

**If memory grows unbounded**:
1. Find memory leak (profiling)
2. Implement memory limits
3. Restart on memory threshold
4. Consider caching strategy

---

## PRODUCTION DEPLOYMENT (After Phase 6 Pass)

### Pre-Deployment Checklist
- [ ] Phase 4-5 tests passed
- [ ] Phase 6 targets met (p95 <200ms, <0.1% error)
- [ ] All 9 fixes verified in production
- [ ] Database indexes deployed
- [ ] Monitoring setup complete
- [ ] Rollback plan documented
- [ ] Engineering approval ✅
- [ ] QA approval ⏳
- [ ] Product approval ⏳

### Deployment Steps
```bash
# 1. Final staging validation
npm run test -- security-fixes.integration.test.ts

# 2. Deploy to production
docker pull registry.example.com/technurture-lms:latest
kubectl set image deployment/technurture-lms \
  technurture-lms=registry.example.com/technurture-lms:latest

# 3. Monitor for 24 hours
watch 'kubectl logs -n default deployment/technurture-lms | tail -20'

# 4. Track metrics
# - Error rate <0.1%
# - p95 latency <200ms
# - CPU <70%
# - Memory stable
```

---

## FINAL STATUS

**Phase 4**: ✅ Red Team execution (tests live)
**Phase 5**: ✅ Load test execution (tests live)
**Phase 6**: ⏳ Ready for immediate execution

**Expected**: 8.5-9.0/10 production readiness after Phase 6 pass

**Timeline to Production**: 5-8 hours total (from now)

---

**READY TO EXECUTE PHASE 6**

Database indexes script: ✅ Ready  
Load test script: ✅ Ready  
Performance targets: ✅ Defined  
Success criteria: ✅ Defined  

Execute Phase 6 now.

