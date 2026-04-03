# PERFORMANCE OPTIMIZATION PLAN

**Target**: Support 10,000 concurrent users with <200ms p95 latency  
**Current Baseline**: Unknown (needs profiling)  
**Status**: Planning Phase

---

## PERFORMANCE AUDIT FINDINGS

### Critical Bottlenecks Identified

#### 1. N+1 Queries in Course Actions
**File**: `src/modules/student/actions/course-actions.ts`  
**Current State**: Multiple sequential DB queries per page load  
**Impact**: +400ms per page load  
**Fix**: Consolidate into single query with relations  
**Status**: ⏳ Needs Implementation

#### 2. Missing Database Indexes

**Identified Missing Indexes**:

```sql
-- For enrollment operations (frequent)
CREATE INDEX idx_enrollments_user_school_course 
  ON enrollments(user_id, school_id, course_id);

-- For lesson progress tracking
CREATE INDEX idx_lesson_progress_user_lesson_school
  ON lesson_progress(user_id, lesson_id, school_id);

-- For XP/analytics queries
CREATE INDEX idx_xp_events_user_school_source
  ON xp_events(user_id, school_id, source);

-- For audit trail searches
CREATE INDEX idx_audit_logs_school_action_date
  ON audit_logs(school_id, action, created_at DESC);

-- For leaderboard queries
CREATE INDEX idx_students_school_xp_desc
  ON students(school_id, cumulative_xp DESC);

-- For media asset access control
CREATE INDEX idx_media_assets_lesson_id
  ON media_assets(lesson_id);

-- For session validation
CREATE INDEX idx_lesson_sessions_user_lesson_active
  ON lesson_sessions(user_id, lesson_id, is_active);

-- For subscription status
CREATE INDEX idx_subscriptions_school_status_date
  ON school_subscriptions(school_id, status, current_period_end DESC);
```

**Estimated Impact**: -200-300ms per request (p95)

#### 3. Leaderboard Calculation Inefficiency
**Location**: `src/lib/services/leaderboard-service.ts`  
**Issue**: Full recalculation on every access instead of incremental updates  
**At 10K Users**: 500K+ sorting operations per update  
**Solution**: Redis sorted sets with atomic updates

#### 4. Media URL Generation Overhead
**File**: `src/lib/media.ts`  
**Issue**: Possible repeated crypto operations per request  
**Solution**: Cache signed URLs in Redis (1-hour TTL)

#### 5. Large Response Payloads
**Affected Endpoints**:
- `/api/auth/me` - Returns full user object
- `/student/lesson/[id]` - Returns complete lesson data
**Solution**: Selective field projection, gzip compression

---

## OPTIMIZATION ROADMAP

### Phase 5A: Database Optimization (Days 1-2)

#### Step 1: Create Missing Indexes
```bash
# Apply SQL migrations
psql $DATABASE_URL < scripts/add_missing_indexes.sql

# Verify index creation
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

# Monitor index usage
SELECT idx.relname, s.idx_scan, s.idx_tup_read
FROM pg_stat_user_indexes s
JOIN pg_class idx ON s.indexrelid = idx.oid
ORDER BY s.idx_scan DESC;
```

**Success Criteria**:
- All 8+ indexes created
- No missing index warnings in query plans
- Reduction in sequential scans

#### Step 2: Profile Slow Queries
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries >100ms

-- Restart PostgreSQL
SELECT pg_reload_conf();

-- Capture slow query log (next 1 hour)
-- tail -f /var/log/postgresql/postgresql.log
```

**Queries to Optimize**:
1. Course enrollment checks
2. Lesson progress aggregation
3. Leaderboard calculations
4. Student profile fetch

#### Step 3: Run EXPLAIN ANALYZE
```sql
-- For each slow query
EXPLAIN ANALYZE
SELECT * FROM enrollments
WHERE user_id = $1 AND school_id = $2 AND is_active = true;

-- Check for:
-- - Sequential scans (should use indexes)
-- - High row counts in intermediate steps
-- - Missing or unused indexes
```

**Target**: All queries should use index scans, <50ms execution

---

### Phase 5B: Query Consolidation (Days 2-3)

#### Consolidate N+1 Queries
**Example: Course List Page**

Current (5 queries per course):
```typescript
// Query 1: Fetch courses
const courses = await db.query.courses.findMany(...);

// Query 2-5: For each course, fetch enrollment, progress, stats
for (const course of courses) {
    const enrollment = await db.query.enrollments.findFirst(...)
    const progress = await db.query.courseProgress.findFirst(...)
    const stats = await db.query.courseStats.findFirst(...)
}
```

Optimized (1 query):
```typescript
const courses = await db.query.courses.findMany({
    where: ...,
    with: {
        enrollments: {
            where: eq(enrollments.user_id, userId),
            limit: 1
        },
        progress: {
            where: eq(courseProgress.user_id, userId),
            limit: 1
        },
        stats: true
    }
});
```

**Affected Files**:
- `src/modules/student/actions/course-actions.ts` - PRIMARY
- `src/modules/student/actions/achievement-actions.ts` - SECONDARY
- `src/modules/super-admin/actions/sub-actions/stats-actions.ts` - SECONDARY

---

### Phase 5C: Caching Strategy (Days 3-4)

#### Level 1: Database Query Caching
**Strategy**: Cache expensive aggregations in Redis

```typescript
// Leaderboard caching
export async function getCachedLeaderboard(schoolId: string) {
    const cacheKey = `leaderboard:school:${schoolId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Compute if missing
    const leaders = await db.query.students.findMany({
        where: eq(students.school_id, schoolId),
        orderBy: desc(students.cumulative_xp),
        limit: 100
    });
    
    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(leaders), 'EX', 3600);
    return leaders;
}
```

**Cache Keys Strategy**:
- `leaderboard:school:{schoolId}` - School-level ranking
- `leaderboard:global` - Global ranking
- `user:{userId}:xp_stats` - User XP breakdown
- `course:{courseId}:progress_stats` - Course progress snapshot

**Invalidation**: On XP award, lesson complete, achievement earned

#### Level 2: Application-Level Caching
**Use**: Next.js unstable_cache for dynamic routes

```typescript
// Cache lesson data for 5 minutes
const getCachedLessonData = unstable_cache(
    async (lessonId: string) => getLessonData(lessonId),
    ['lesson', lessonId],
    { revalidate: 300 }
);
```

#### Level 3: CDN Caching
**For Static Assets**:
- Course thumbnails: 1 week TTL
- Badge images: 1 month TTL
- Theme assets: 1 day TTL

---

### Phase 6: Load Testing & Stress Testing (Days 4-5)

#### Load Profile: 10,000 Concurrent Users

**Distribution**:
- 50 schools
- 200 students per school
- ~50 school admins total
- ~10 super admins

**Traffic Pattern**:
```
Morning Peak (9-10am):
  - 1,000 concurrent logins
  - 5,000 active on dashboard
  - 2,000 watching videos
  - 500 taking quizzes

Midday (12-1pm):
  - 3,000 concurrent
  - Mixed activities

Afternoon Peak (3-4pm):
  - Similar to morning

Evening (6-8pm):
  - 500-1,000 concurrent (reduced)
```

#### Load Test Execution

**Tool**: K6 or Locust

**Script 1: Ramp-Up Test**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '5m', target: 1000 },   // Ramp-up
        { duration: '15m', target: 10000 }, // Sustained peak
        { duration: '5m', target: 0 },      // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% <200ms
        http_req_failed: ['rate<0.01'],                 // <1% error rate
    },
};

export default function () {
    // Student accessing lesson
    const res = http.get(`https://app.technurture.io/api/student/lesson/${lessonId}`);
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });
}
```

**Script 2: Video Streaming Load**
```javascript
// 2,000 users streaming simultaneously
// Simulate: start video, heartbeats every 5s, seek, continue
// Measure: bandwidth, latency, buffering events
```

**Script 3: Quiz Submission Spike**
```javascript
// 500 students submitting quiz answers at same time
// Measure: race condition handling, score consistency
```

**Success Metrics**:
- p95 latency < 200ms (sustained)
- p99 latency < 500ms
- Error rate < 0.5%
- No database deadlocks
- No memory leaks
- CPU usage < 80%

#### Monitoring During Load Test

**Metrics to Track**:
```bash
# Database
- Query latency (p95, p99)
- Connection pool usage
- Slow query count
- Lock contention
- Cache hit rate

# Application
- Request latency (p95, p99)
- Error rate & types
- Memory usage
- GC pauses
- Active connections

# Infrastructure
- CPU usage
- Memory usage
- Network bandwidth
- Disk I/O
- Container restart events
```

**Tools**:
- Prometheus for metrics
- Grafana for visualization
- PgBadger for PostgreSQL analysis
- Node.js profiler (clinic.js)

---

## BOTTLENECK MITIGATION STRATEGIES

### If Database Connection Pool Exhausted
**Symptom**: "Too many connections" errors  
**Fix**: Increase connection pool size (current: 50)
```typescript
// src/lib/db.ts
connectionLimit: 150, // Increase from 50
```
**Downside**: Higher memory usage (~2MB per connection)

### If Database CPU Maxed
**Symptom**: p95 latency >500ms consistently  
**Fixes**:
1. Add missing indexes (highest priority)
2. Implement query result caching
3. Vertical scaling (more CPU cores)
4. Horizontal scaling (read replicas)

### If Memory Usage Grows Unbounded
**Symptom**: OOM kill after hours  
**Investigation**:
```bash
node --inspect server.js
# Open Chrome DevTools, take heap snapshots
# Look for: unbounded array/object growth
```
**Likely Causes**:
- Unbounded Redis cache growth
- Memory leak in session storage
- Circular references in objects

### If Error Rate > 1%
**Debug**:
```bash
# Filter error logs
grep "ERROR" logs/* | grep -v "ECONNREFUSED" | tail -100

# Check for:
- Validation errors (client-side issue)
- Timeout errors (database slowness)
- Serialization errors (data type mismatch)
- Connection errors (infrastructure issue)
```

---

## POST-OPTIMIZATION VALIDATION

### Benchmark Comparison

Before vs. After:

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| p95 Latency | TBD | <200ms | ⏳ |
| p99 Latency | TBD | <500ms | ⏳ |
| Error Rate | TBD | <0.5% | ⏳ |
| DB CPU @ 10K users | TBD | <70% | ⏳ |
| Memory @ 10K users | TBD | <2GB | ⏳ |
| Cache Hit Rate | N/A | >80% | ⏳ |

### Security Validation
- All optimizations maintain tenant isolation
- No sensitive data exposed in cache
- Cache invalidation doesn't break auth
- Performance fixes don't regress security

### Rollback Plan
If performance optimization causes regressions:
1. Revert database index changes (no data loss)
2. Disable Redis caching (uses DB as source of truth)
3. Revert query consolidation (use original N+1 queries)
4. Investigate root cause before re-attempting

---

## SUCCESS CRITERIA FOR 8/10 PRODUCTION READINESS

✅ = Ready | ⏳ = In Progress | 🔲 = Not Started

- [ ] p95 latency < 200ms under 10K user load
- [ ] p99 latency < 500ms under 10K user load
- [ ] Error rate < 0.5% under sustained load
- [ ] No database connection pool exhaustion
- [ ] Cache hit rate > 80% for leaderboard queries
- [ ] Memory stable (no growth >50MB/hour)
- [ ] All security tests passing
- [ ] Monitoring & alerting configured

---

## ESTIMATED RESOURCE REQUIREMENTS

**Hardware**:
- PostgreSQL server: 16 CPU, 64GB RAM
- Redis server: 4 CPU, 16GB RAM
- Application servers: 2x 8 CPU, 16GB RAM each

**Network**:
- 1Gbps+ connection to database
- CDN for static assets

**Load Testing Tools**:
- K6 Cloud ($99/month) or self-hosted
- Prometheus/Grafana monitoring stack
- PgBadger for query analysis

---

## TIMELINE

| Phase | Weeks | Owner | Status |
|-------|-------|-------|--------|
| 5A: DB Optimization | 1 | DevOps | 🔲 Ready |
| 5B: Query Consolidation | 1 | Backend | ⏳ Planned |
| 5C: Caching Layer | 1 | Backend/DevOps | ⏳ Planned |
| 6: Load Testing | 1 | QA/DevOps | 🔲 Ready |
| Optimization Loop | 1-2 | Engineering | 🔲 Ready |

**Total**: 4-5 weeks to full optimization

---

**Last Updated**: 2026-04-03  
**Next Review**: Start of Phase 5  
**Owner**: Engineering Team
