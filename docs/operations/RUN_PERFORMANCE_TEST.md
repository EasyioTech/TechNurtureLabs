# How to Run Performance Test with 500 Schools

## ⚡ Quick Start (Copy-Paste Commands)

### Step 1: Start Infrastructure (Terminal 1)
```bash
npm run infra:up
```
Wait for PostgreSQL and Redis to start (~5 seconds).

### Step 2: Seed 500 Schools (Terminal 1)
```bash
npm run db:seed:courses
npm run db:seed:500
```

**What happens:**
- Creates 500 schools (school-0001 to school-0500)
- Creates 1 admin per school (500 admins)
- Creates 5-10 students per school (~3,750-5,000 students)
- Maps 3 classes per school
- Enroll students in all courses

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║              SEEDING COMPLETE - SUMMARY                   ║
╚════════════════════════════════════════════════════════════╝

📊 CREATED:
   • Schools: 500
   • School Admins: 500
   • Students: 3,750-5,000
   • Enrollments: 50,000+
```

**Estimated time:** 5-10 minutes

---

### Step 3: Start Dev Server (Terminal 2)
```bash
npm run dev
```

Wait for the app to be ready at `http://localhost:3000`

---

### Step 4: Run Performance Test (Terminal 3)
```bash
npm run test:perf:simple
```

**What happens:**
- Tests login with school admin
- Tests login with students from different schools
- Runs 50 concurrent users making requests
- Measures response times

**Expected output:**
```
ℹ️  Checking if app is running at http://localhost:3000...
✅ App is running
ℹ️  Testing authentication...
✅ Login successful
ℹ️  Testing API endpoints...
✅ User Profile (/api/auth/me) - 200
✅ Courses (/api/student/courses) - 200
✅ Leaderboard (/api/student/leaderboard) - 200
✅ Achievements (/api/student/achievements) - 200
ℹ️  Running concurrent load test...
✅ Concurrent load test complete
```

**Estimated time:** 5 minutes

---

## 📊 What Gets Created

### Database Structure (500 Schools)

```
500 Schools
├─ 500 School Admins (1 per school)
├─ 1 Academic Session per school (2025-2026)
├─ 3 Classes mapped per school
└─ 5-10 Students per school
    ├─ Assigned to 1 class (per session)
    └─ Enrolled in all courses (for their class)

Total Users Created:
  • School Admins: 500
  • Students: 3,750-5,000
  • Total Logins: 4,250-5,500
```

---

## 🔐 Test Credentials

All users have password: `admin123`

### School Admin Login Examples:
```
admin@school1.local / admin123
admin@school2.local / admin123
admin@school500.local / admin123
```

### Student Login Examples:
```
student1-1@school1.local / admin123  (1st student in School 1)
student1-2@school1.local / admin123  (2nd student in School 1)
student1-5@school1.local / admin123  (5th student in School 1)

student500-1@school500.local / admin123  (1st student in School 500)
student500-10@school500.local / admin123 (10th student in School 500)
```

---

## ✅ Expected Performance Results

After seeding and running the test, you should see:

### Query Performance:
- **User Profile**: <100ms
- **Courses**: <150ms  
- **Leaderboard**: <200ms
- **Achievements**: <150ms

### Load Test Results:
- **Concurrent Users**: 50
- **Total Requests**: 500+
- **Success Rate**: >99%
- **Error Rate**: <0.1%

---

## 🏗️ Project Architecture (What You Should Know)

### 3 User Types (NO Teachers):
1. **Super Admin** - Platform level (creates courses)
2. **School Admin** - Manages one school & its students
3. **Student** - End user (completes lessons, earns XP)

### School Isolation:
- Each school is a tenant
- Students can ONLY see their own school's data
- Admins can ONLY see their school's students
- Courses are platform-wide but delivery is per-school

### Academic Model:
```
School
  → Academic Session (2025-2026)
    → Class (e.g., Class 10)
      → Students (assigned to class)
        → Enrollments in courses
          → Lessons
            → Quizzes
              → Questions
```

---

## 🔍 How to Test Manually

### Login Test:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school1.local","password":"admin123"}'
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "type": "school_admin",
    "school_id": "school_id"
  }
}
```

### Get Profile (with token from login):
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token_from_login>"
```

### Get Courses:
```bash
curl -X GET http://localhost:3000/api/student/courses \
  -H "Authorization: Bearer <token_from_login>"
```

---

## 🎯 Verification Checklist

After running tests, verify:

- ✅ 500 schools created
- ✅ 500 school admins created
- ✅ 3,750-5,000 students created
- ✅ All admins can login
- ✅ All students can login
- ✅ No cross-school data leakage
- ✅ Performance targets met
- ✅ Error rate <0.1%

---

## ❌ Common Issues & Solutions

### "No courses found"
```bash
npm run db:seed:courses
npm run db:seed:500
```

### "Database connection error"
```bash
npm run infra:up
# Wait 10 seconds for PostgreSQL to start
```

### "App not running"
```bash
npm run dev
# Wait for "Ready in X seconds"
```

### "Port 3000 already in use"
```bash
# Kill existing process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

## 📈 Next Steps (After Success)

1. Review performance metrics
2. Check database connection pool usage
3. Monitor Redis cache hit rate
4. Verify no memory leaks
5. Get QA/Product approvals
6. Deploy to production

---

## 📚 More Info

- Full project understanding: [UNDERSTANDING_PROJECT_STRUCTURE.md](UNDERSTANDING_PROJECT_STRUCTURE.md)
- Performance guide: [PERFORMANCE_TEST_GUIDE.md](PERFORMANCE_TEST_GUIDE.md)
- Phase 6 status: [PHASE_6_COMPLETE.txt](PHASE_6_COMPLETE.txt)

---

## 🚀 One-Command Full Test (Docker)

If you prefer full isolation with Docker:

```bash
npm run test:perf
```

This will:
1. Build Docker image
2. Start PostgreSQL, Redis, App
3. Seed 500 schools
4. Run k6 load test (500 concurrent users)
5. Generate metrics report

**Estimated time:** 20 minutes
