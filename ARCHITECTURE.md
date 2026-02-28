# Architecture: EduQuest

EduQuest is a multi-tenant gamified educational platform built with Next.js 15.

## System Overview
The application follows a modular monolith approach with specialized portals for different user roles, managed through subdomain-based routing.

## Multi-Tenancy & Routing
- **Main Domain**: Landing page (student marketing, general info).
- **`school.*`**: School Portal for students and school administrators.
- **`admin.*`**: Admin Portal for system-level super administrators.
- **Middleware**: `src/middleware.ts` handles the rewriting of subdomain requests to specific internal routes (`/school-portal`, `/admin-portal`).

## Core Technology Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT-based session management with Redis for session persistence and revocation.
- **Styling**: Tailwind CSS 4, Framer Motion for animations, Lucide React for icons.
- **UI Components**: Radix UI primitives.
- **Payments**: Stripe (integrated for payment plans).

## Database Schema
- `profiles`: Unified user table (students, school_admins, super_admins).
- `schools`: Tenant information, branding configuration, approval status.
- `courses` & `lessons`: Educational content hierarchy.
- `progress_tracking`: Tracks student engagement (status, position in video, XP).
- `daily_challenges` & `achievements`: Gamification engine components.
- `payment_plans`: Subscription tiers for schools.

## Project Structure
- `src/app`: Next.js pages, API routes, and Server Actions.
- `src/components`: UI components categorized by role (`admin`, `student`) and shared `ui` (Radix).
- `src/db`: Drizzle schema and database configuration.
- `src/lib`: Core utilities (auth, redis, db client).
- `src/modules`: (Inferred from KIs) Ongoing efforts to further isolate modules like `super-admin`.
