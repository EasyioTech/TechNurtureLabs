# TechNurture LMS - Project Structure Understanding

## User Types (3 Only - NO Teachers)

The system has exactly **3 user types**, not more:

### 1. **Super Admin** (`super_admins` table)
- Platform-level administrator
- Creates courses, manages payment plans
- Full system access
- Email-based authentication
- Session expiry: 2 hours (short for security)

### 2. **School Admin** (`school_admins` table)
- School-level administrator
- Belongs to ONE school (school_id)
- Manages students within their school
- Manages school subscriptions
- Email-based authentication
- Session expiry: 8 hours (workday)

### 3. **Student** (`students` table)
- End user / learner
- Belongs to ONE school (school_id)
- Enroled in courses through class mapping
- Earns XP, completes lessons, takes quizzes
- PIN-based authentication (password_hash is PIN)
- Session expiry: 7 days

**Important: No teacher/instructor role exists.**

---

## Academic Structure (School-Tenant Model)

### Hierarchy:

```
School
  ├── Academic Session (e.g., 2025-2026)
  │     └── Class (e.g., Class 10 A)
  │           ├── Students (enrolled)
  │           └── Courses (mapped to this class)
  │                 └── Lessons (with XP rewards)
  │                       └── Quizzes
  │                             └── Questions
  └── School Admin (manages the school)
```

### Key Tables:

1. **schools** - Tenant isolation point
   - Each school is completely isolated
   - school_id is the primary isolation key

2. **academic_sessions** - Per-school academic year
   - school_id references (school owns sessions)
   - Multiple sessions can exist (historical records)

3. **classes** - Class definitions
   - Example: "Class 10", "Class 12", "STD IV"
   - Not specific to schools (global definitions)

4. **schoolClassMapping** - School-to-Class association
   - Links schools to available classes
   - School A can have Class 10, School B can have Class 10 (different records)

5. **students** - Student accounts
   - school_id: which school they belong to
   - UNIQUE per school (email unique within school)
   - Can be in 1 class per academic session (via studentAcademicRecords)

6. **studentAcademicRecords** - Student placement in class/session
   - Links student to class for a specific session
   - Tracks roll_number, section, promotion status

7. **courses** - Content courses
   - NOT school-specific (created by super_admin)
   - is_published: controls visibility
   - all_classes: if true, available to all classes globally

8. **courseClassMapping** - Course to Class availability
   - Maps courses to specific classes
   - Controls which classes can access which courses

9. **enrollments** - Student course enrollment
   - student → course mapping
   - Tracks completion percentage, XP earned

---

## Authentication Flow

### School Admin Login:
```
POST /api/auth/login
{
  "email": "admin@school1.local",
  "password": "admin123"
}

Response:
{
  "token": "jwt_token",
  "user": {
    "id": "school-admin-id",
    "type": "school_admin",
    "school_id": "school-id"
  }
}
```

### Student Login:
```
POST /api/auth/login
{
  "email": "student1@school1.local",
  "password": "admin123" (actually a PIN)
}

Response:
{
  "token": "jwt_token",
  "user": {
    "id": "student-id",
    "type": "student",
    "school_id": "school-id"
  }
}
```

---

## Security Boundaries (School Isolation)

### 4-Layer School Validation:
1. Student must be active (is_active = true)
2. Student must have enrollment in the school
3. Enrollment's school_id must match session school_id
4. Course must be accessible to student's class

### What's Prevented:
- ❌ Student A (School 1) cannot see/access Student B (School 2) data
- ❌ Admin A (School 1) cannot see students from School 2
- ❌ School 1 courses cannot be accessed from School 2
- ✅ Only school_admin and students within same school can interact

---

## Data Seeding Strategy (500 Schools)

### For Each School:
1. Create school record (school-0001, school-0002, ..., school-0500)
2. Create academic session (2025-2026) for that school
3. Create school admin for that school
4. Map 3 classes to that school (e.g., Class 10, Class 11, Class 12)
5. Create 5-10 students and assign them to classes
6. Enroll students in courses that are mapped to their class

### Data Volumes:
- **Schools**: 500
- **School Admins**: 500 (1 per school)
- **Academic Sessions**: 500 (1 per school)
- **Class Mappings**: 1,500 (3 per school)
- **Students**: 3,750-5,000 (5-10 per school)
- **Student Academic Records**: 3,750-5,000 (1 per student per session)
- **Enrollments**: Variable based on course-class mappings

---

## Login Credentials Format

### School Admins:
```
Email:    admin@school[1-500].local
Password: admin123
```

### Students:
```
Email:    student[school_id]-[student_num]@school[school_id].local
Password: admin123
```

### Examples:
```
School 1 Admin:
  Email:    admin@school1.local
  Password: admin123

School 1 Student 1:
  Email:    student1-1@school1.local
  Password: admin123

School 1 Student 2:
  Email:    student1-2@school1.local
  Password: admin123

School 500 Admin:
  Email:    admin@school500.local
  Password: admin123

School 500 Student 8:
  Email:    student500-8@school500.local
  Password: admin123
```

---

## What NOT to Include

❌ Teachers
❌ Instructor accounts
❌ Teacher rosters
❌ Subject assignments (to teachers)
❌ Attendance (teacher-based)
❌ Assignment grading (teacher role)
❌ Parent accounts
❌ District-level accounts

---

## Correct Architectural Understanding

This is a **Multi-Tenant SaaS LMS** where:
- **Tenant** = School
- **User Types** = Super Admin (platform), School Admin (tenant manager), Student (end user)
- **Isolation** = By school_id throughout
- **Content** = Platform-wide (super_admin creates courses), but delivery is class/school based
- **No Hierarchy** = Students don't report to admins who report to super_admins; admins manage students within their school

---

## Next Steps

1. Create accurate seeding script (no teachers, no instructors)
2. Verify academic session belongs to school
3. Ensure school_id isolation in all queries
4. Test performance with 500 schools × 5-10 students = ~3,750-5,000 users
