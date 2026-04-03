# Phase 6 Execution Plan - Careful Step-by-Step

## ⚠️ Important Notes Before Starting

1. **Current State**: Database is seeded with 500 schools. Dev server is running on port 3002.
2. **Goal**: Deploy indexes and verify performance meets targets (p95 <150ms)
3. **Risk Level**: VERY LOW - indexes are additive only, can be dropped if issues occur
4. **Rollback Time**: <5 minutes (drop indexes if needed)

---

## PHASE 6A: Deploy Database Indexes

### Step 1: Verify Current Performance Baseline

**Before** deploying indexes, let's establish baseline:

```bash
# Test current latency (without indexes)
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school1.local","password":"admin123"}' \
  -w "\nLatency: %{time_total}s\n"
```

Expected: ~0.5-1.5 seconds (without indexes)

### Step 2: Deploy the 24 Indexes

```bash
npm run db:push
```

**What this does:**
- Reads `drizzle/add_missing_indexes.sql`
- Creates 24 strategic indexes
- Runs concurrently (no locks)
- Takes ~2-5 minutes

**Expected output:**
```
[✓] Pulling schema from database...
[✓] Changes applied
```

### Step 3: Verify Index Deployment

```bash
# Check indexes were created
psql postgresql://postgres:admin@localhost:5433/technurturelabs << EOF
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public';
EOF
```

**Expected**: Count should be 24+ (we had baseline, now +24)

---

## PHASE 6B: Re-test Performance with Indexes

### Step 1: Same Login Test (After Indexes)

```bash
# Test latency after indexes
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school1.local","password":"admin123"}' \
  -w "\nLatency: %{time_total}s\n"
```

**Expected**: ~0.2-0.5 seconds (50-80% improvement)

### Step 2: Run Simple Performance Test

```bash
npm run test:perf:simple
```

**Expected to see:**
- ✅ Login successful (multiple schools)
- ✅ API endpoints responding <200ms
- ✅ 50 concurrent users handled
- ✅ Error rate <0.1%

### Step 3: Compare Latencies

Record results:
- Before indexes: _____ ms
- After indexes: _____ ms
- Improvement: _____ %

**Target**: 50-80% improvement

---

## PHASE 6C: Verify Stability

### Step 1: Monitor for Memory Leaks (2 hours)

```bash
# In a new terminal, run every 30 seconds
watch -n 30 'ps aux | grep node | grep -v grep | awk "{print \$2, \$6, \$7, \$11}"'
```

**What to watch for:**
- Memory (column 3) should stay flat
- CPU (column 4) should be <70%

**Red flag**: Memory growing consistently → memory leak

### Step 2: Check Database Connections

```bash
# Check connection pool usage
psql postgresql://postgres:admin@localhost:5433/technurturelabs << EOF
SELECT datname, count(*) as connection_count
FROM pg_stat_activity
GROUP BY datname;
EOF
```

**Expected**: <50 connections (we have 200 max)

### Step 3: Check Error Rate in Logs

```bash
# Check last 20 lines of dev server logs
tail -20 .next/dev/logs/next-development.log | grep -i "error" | wc -l
```

**Expected**: 0 errors

---

## PHASE 6D: Verify Security Fixes Still Work

### Step 1: Test Rate Limiting

```bash
# Send 35 requests in quick succession
for i in {1..35}; do
  curl -s -w "%{http_code}\n" -o /dev/null \
    -X GET http://localhost:3002/api/auth/me \
    -H "Authorization: Bearer invalid_token"
done
```

**Expected**: First 30 return 401, request 31+ should return 429 (rate limited)

### Step 2: Test Cross-School Isolation

```bash
# Login as student from school 1
SCHOOL1_TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1-1@school1.local","password":"admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Try to access school 2's data (should be blocked)
curl -s -X GET http://localhost:3002/api/student/courses \
  -H "Authorization: Bearer $SCHOOL1_TOKEN" \
  -H "X-School-ID: school2_id" | grep -i "error\|forbidden"
```

**Expected**: Error or forbidden response (not school 2's courses)

### Step 3: Test Atomic Promo Code

```bash
# Create a promo code with max_uses=1, then try 5 concurrent requests
# (This is complex, so we'll skip detailed test here)
```

**Expected**: Only 1 request succeeds, rest fail

---

## PHASE 6E: Final Checklist Before Production

- [ ] Indexes deployed successfully (24+ created)
- [ ] Latency improved by 50-80%
- [ ] Memory stayed flat during 2-hour monitoring
- [ ] Connections stayed <100/200
- [ ] Error rate stayed <0.1%
- [ ] Rate limiting works (429 at req 31)
- [ ] Cross-school isolation works
- [ ] All 9 security fixes still active
- [ ] No critical errors in logs

---

## PHASE 6F: If Something Goes Wrong

### Issue: Performance Didn't Improve

**Diagnosis:**
```bash
# Check if indexes are actually being used
psql postgresql://postgres:admin@localhost:5433/technurturelabs << EOF
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
EOF
```

**Fix**: Rerun `npm run db:push` or manually execute `drizzle/add_missing_indexes.sql`

### Issue: Memory Growing Unbounded

**Diagnosis:**
```bash
# Find memory leak with node profiler
kill $(lsof -i :3002 -t)  # Kill dev server
npm run dev  # Restart with fresh memory
```

**Fix**: Identify which query/cache is leaking and fix

### Issue: Connection Pool Exhausted

**Diagnosis:**
```bash
# Check max connections
psql postgresql://postgres:admin@localhost:5433/technurturelabs << EOF
SHOW max_connections;
SHOW max_prepared_transactions;
EOF
```

**Fix**: Increase pool size or optimize connection usage

---

## 🎯 Success Criteria for Phase 6

You'll know Phase 6 is successful when:

1. ✅ Indexes deployed without errors
2. ✅ Latency improved 50-80%
3. ✅ p95 latency now <150ms (was <200ms)
4. ✅ Error rate stays <0.1%
5. ✅ No memory leaks observed
6. ✅ Security fixes verified
7. ✅ All 500 schools + 3,667 students still accessible

---

## 📈 Expected Final Metrics (After Phase 6)

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| p50 latency | ~100ms | ~50ms | <75ms |
| p95 latency | ~200ms | ~100ms | <150ms |
| p99 latency | ~500ms | ~250ms | <300ms |
| Error rate | <0.1% | <0.1% | <0.1% |
| Throughput | ~500 req/s | ~1000 req/s | >1000 |
| Query time | ~50ms | ~10ms | <20ms |

---

## ⏱️ Estimated Timeline

| Step | Time | Total |
|------|------|-------|
| Deploy indexes | 5 min | 5 min |
| Verify deployment | 2 min | 7 min |
| Performance test | 5 min | 12 min |
| Stability check | 2 hours | 2 hours 12 min |
| Security verification | 10 min | 2 hours 22 min |
| Final review | 10 min | 2 hours 32 min |

**Total: ~2.5 hours**

---

## 🚀 Ready to Execute

When you're ready, run:

```bash
# Step 1: Deploy indexes
npm run db:push

# Step 2: Verify (wait 5 min, then check log)
sleep 300
npm run test:perf:simple
```

Then monitor stability and security for 2 hours.

---

## ❌ If You Need to Rollback

If something goes wrong, rolling back is simple:

```bash
# Drop all the new indexes
psql postgresql://postgres:admin@localhost:5433/technurturelabs << EOF
DROP INDEX IF EXISTS idx_enrollments_user_school_course;
DROP INDEX IF EXISTS idx_lesson_progress_user_lesson_school;
-- ... (28 more DROP INDEX commands)
EOF
```

**Time to rollback**: <5 minutes
**Data loss**: ZERO (indexes don't contain data)
**Impact**: Back to baseline performance, but all fixes still work

---

## Next: Execute Phase 6

When ready, start with index deployment. Monitor carefully. Report results.
