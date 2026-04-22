# 🚀 TechNurture LMS - Professional Learning Platform

**TechNurture LMS** is a state-of-the-art, multi-tenant Learning Management System (LMS) designed for schools and educational institutions. It delivers a gamified learning experience for students, powerful management tools for school administrators, and a centralized oversight portal for platform operators (Super Admins).


## 🎯 Platform Features

### 🎓 For Students (The "Nurturing" Environment)
- **Gamified Journey**: XP-based progression, levels, and achievements to keep learners engaged.
- **Interactive Content**: Seamless playback of videos (YouTube, Cloudflare Stream), PDFs, and interactive quizzes.
- **Engagement Insights**: Personalized dashboards with learning curves, streaks, and achievement badges.
- **Secure Access**: PIN-based authentication designed for classroom ease and student security.

### 🏫 For School Administrators
- **Institutional Control**: Full management of student enrollments, sessions, and class structures.
- **Course Library**: Create and publish localized course content specifically for their institution.
- **Performance Monitoring**: Real-time analytics on student progress, quiz performance, and active engagement.
- **Subscription Insights**: Monitor payment plans, student caps, and billing cycles.

### 🌐 For Super Administrators (The Operator)
- **Centralized Oversight**: Manage multiple schools, cross-institutional contents, and global platform settings.
- **Global Asset Management**: Centralized media library and course cloning capabilities.
- **Revenue Dashboard**: Comprehensive tracking of school subscriptions, payments (Razorpay), and renewals.
- **Infrastructure Health**: Real-time monitoring of platform metrics across all connected tenants.

---

## 🏗️ Architecture & Technology

### Modern Tech Stack
- **Frontend**: Next.js 14+ (App Router) with React, TypeScript, and Framer Motion for premium UI.
- **Backend Services**: Next.js Server Actions and API Routes for efficient, type-safe communication.
- **Database Layer**: PostgreSQL with Drizzle ORM for performant, relational data management.
- **Real-time & Caching**: Redis for session management, dynamic caching, and rate limiting.
- **Scalable Storage**: Cloudflare R2 for asset storage with a performance-optimized local fallback.

### Multi-Tenant Model
- **Subdomain-Based Routing**: Powered by Next.js middleware for tenant isolation.
- **Data Isolation**: Robust data-access patterns ensure schools see only their authorized data.

---

## 🚀 Getting Started

### 💻 Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include your PostgreSQL, Redis, and Cloudflare credentials.*

3. **Initialize Database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Launch Dev Server**
   ```bash
   npm run dev
   ```

### 🌍 Deployment & Operations
The project includes an **Operations (ops)** suite of automated scripts for seamless VPS deployment and maintenance.

For more detailed instructions, refer to the **[Centralized Documentation](docs/README.md)**.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/           # Domain-aware routing (admin., school., app.)
│   ├── modules/       # Core business logic (Super Admin, School, Learning)
│   ├── components/    # Reusable UI components
│   ├── lib/           # Services, database clients, and utility functions
│   └── db/            # Database schema and migration tracking
├── ops/               # DevOps orchestration, and health-check scripts
├── scripts/           # Maintenance, seeding, and migration utilities
└── public/            # Static assets and global resources
```


