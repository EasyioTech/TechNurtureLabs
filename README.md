# TechNurture: Deep Audit & Security Intelligence Report

> **Learning that feels like play. Built like a fortress.**

This report is a granular, file-by-file analysis of the TechNurture platform, covering every critical flow, the underlying algorithms, and the multi-layered security architecture.

---

## 🛠 Project Structure & Module Analysis

### 🌐 System Orchestration
- **The Intelligence Layer (`src/middleware.ts`)**:
  - **Logic**: Subdomain-based multi-tenancy. Orchestrates traffic dynamically without hard redirects, preserving SEO and deep-link integrity.
  - **Rewrites**: `admin.*` -> `/admin-portal`, `school.*` -> `/school-portal`.

- **Modular Backend (`src/modules`)**:
  - **Separation of Concerns**: Each dashboard (Super Admin, School Admin, Student) has its own `actions.ts` for strictly isolated server-side logic.
  - **Shared Logic (`src/lib`)**: Centralized auth, db, and storage drivers used by all modules.

---

### 🖥 Dashboard Deep-Dive

#### 1. Super Admin (Operations Engine)
- **Primary Logic**: `src/modules/super-admin/actions.ts`
- **Core Algorithms**:
  - **Deep-Cloning Logic**: Implements recursive cloning of Quizzes and Lessons. When a lesson is cloned, the system automatically traverses to its child `quiz_questions` to ensure data integrity.
  - **Course Metrics Aggregator**: Automatically re-calculates `total_xp` and `total_lessons` upon any content change to ensure dashboard accuracy without heavy SQL joins.
  - **Global Library**: Uses `media-library-picker.tsx` to manage a centralized repository of assets reachable by all schools.

#### 2. School Admin (Institutional Hub)
- **Primary Logic**: `src/modules/school-admin/actions.ts`
- **Core Algorithms**:
  - **Academic Session Management**: Auto-generates the next academic session if none is marked as current during student registration.
  - **Tier-Based Licensing**: Restricts student onboarding based on the `max_students` field in the school's `payment_plan`.

#### 3. Student Dashboard (Gamified Learning)
- **Primary Logic**: `src/modules/student/actions.ts`
- **Core Algorithms**:
  - **XP & Leveling System**: Converts `cumulative_xp` to `level` using a flat base algorithm (e.g., `xp / 500`).
  - **Streak Calculation**: Tracks `last_active_at` vs. `server_now` to maintain daily engagement streaks.
  - **Visual Journey Map**: `/src/modules/learning/components/journey-map.tsx` renders a non-linear path based on lesson sequence orders.

---

### 🛡 Security & Risk Management

#### 1. Authentication Architecture (`src/lib/auth.ts`)
- **Dual-Layer Verification**:
  - **Layer 1: JWT**: Secure, HTTP-only, SameSite=Lax cookie containing the `sessionId`.
  - **Layer 2: Redis State**: Every request verifies the `sessionId` against a live Redis store. Revoking a session in Redis instantly kills the JWT's validity globally.
- **Student Safe-Entry**: Implements a **Secure 6-Digit PIN** instead of complex passwords for younger users, hashed via `bcryptjs` (Cost Factor: 10).

#### 2. Data Security & Integrity
- **Transaction-Safe Operations**: All critical flows (like School + Admin + Session creation) are wrapped in `db.transaction()` to prevent partial data state (zombie schools).
- **SQL Injection Prevention**: Strictly uses **Drizzle ORM** which provides automatic prepared statements for all queries.
- **Path Traversal Shield**: The media server (`/api/media/[...path]/route.ts`) uses `path.resolve` and a boundary check against `LOCAL_STORAGE_DIR` to prevent `../` attacks on the host filesystem.

#### 3. Storage Security (`src/lib/storage.ts`)
- **R2 Integrity**: Uses Server-Side Proxying (`/api/media/r2/[...path]`) to fetch from Cloudflare R2. This keeps your R2 bucket private and prevents leaking the `.r2.dev` public endpoint which often bypasses SSL.
- **Deterministic Paths**: Filenames are converted to version 4 UUIDs upon upload to prevent filename-based exploits or collisions.

---

### 📂 File Audit & Connectivity Table

| Sub-System | Key Files | Security/Algo Focus |
| :--- | :--- | :--- |
| **Identity** | `auth.ts`, `register-actions.ts` | Bcrypt hashing, Redis session invalidation. |
| **Content** | `super-admin/actions.ts` | Recursive entity cloning, XP auto-aggregation. |
| **Analytics** | `metrics-daily.ts` (DB) | Automated daily snapshotting of platform health. |
| **Gamification** | `student/actions.ts` | Streak & Rank calculation algorithms. |
| **Storage** | `storage.ts`, `media/route.ts` | Path traversal protection, R2 proxying. |

---

### ⚠️ Identified Risk Mitigations
- **DDoS Mitigation**: API Routes in `/api/auth` are candidates for rate-limiting via the unified middleware.
- **Database Safety**: `onConflictDoNothing()` is used in academic mappings to prevent primary key errors during heavy concurrent registrations.

---
*Comprehensive Audit & Report finalized by Antigravity on March 7, 2026. This document replaces all previous documentation as the absolute technical source of truth.*
