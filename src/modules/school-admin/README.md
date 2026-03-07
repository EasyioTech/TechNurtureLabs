# 🏫 School Admin Module

This module handles **Institutional Management**. It represents the logic for principals and teachers to manage their specific subset of users (students) and content (courses).

## 📁 Structure
* `/actions/`: Server mutations ('use server'). Handles onboarding students, linking cohorts to courses, and updating the school's own profile.
* `/components/`: The UI components specific to the school's dashboard (Student Tables, Activity Rows, etc.).

## 🔌 Database Connectivity
* **Tenant Isolation**: Actions here mutate `users` (students), `enrollments`, and `studentAcademicRecords`.
* **Security Guarding**: Every action MUST call `verifySchoolAdminContext(schoolId)` to prevent **Horizontal Privilege Escalation**. A school admin should never be able to manipulate another school's data by guessing an ID.
