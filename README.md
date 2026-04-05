# 🚀 TechNurture LMS - Professional Learning Platform

**TechNurture LMS** is a state-of-the-art, multi-tenant Learning Management System (LMS) designed for schools and educational institutions. It delivers a gamified learning experience for students, powerful management tools for school administrators, and a centralized oversight portal for platform operators (Super Admins).

---

## 🛡️ STRICT DEPLOYMENT PROTOCOL
> [!IMPORTANT]
> **RULE #1: NEVER deploy directly to Production.**
> All changes **MUST** be deployed and verified on the **Staging Server** (`187.124.98.192`) before being pushed to **Production** (`187.127.132.137`).

---

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

### 🌍 Deployment to Production

The project includes an **Operations (ops)** suite of automated scripts for seamless VPS deployment.

- **Initial Setup**: `bash ops/setup.sh` (installs Docker, configures firewall/Caddy)
- **Deployment**: `bash ops/deploy.sh` (automates builds, migrations, and service restarts)
- **Maintenance**: `bash ops/doctor.sh` (system-wide health check and diagnostics)

For more detailed deployment instructions, refer to **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** and the **[Operations Manual](ops/README.md)**.

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

---

## 🔐 Support & Handover

### Standard Credentials (Initial)
| Role | Email | Default Password |
|------|-------|------------------|
| Super Admin | `admin@technurture.com` | `AdminPassword123!` |

*(Note: Change these immediately after your first successful deployment.)*

### Key Points for Handover
- **Production URL Configuration**: Ensure `NEXT_PUBLIC_APP_URL` and `CADDY_DOMAIN` are set correctly in `.env.production`.
- **Media Storage**: The system is pre-configured for Cloudflare R2, but can be toggled to `local` storage via environmental settings.
- **Automated Seeding**: Use `bash ops/deploy.sh --clean` for a fresh installation with pre-configured classes and payment tiers.

---

**Version**: 1.0.1  
**Release Date**: April 2026  
**License**: Proprietary - TechNurture LMS
