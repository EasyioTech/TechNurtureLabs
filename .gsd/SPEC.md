# Database Migration & Auth Refactor Specification

## 1. Overview
The project is migrating its core backend infrastructure away from Supabase towards a custom PostgreSQL database (managed via Drizzle ORM) and Redis. Additionally, all visual-editor "Orchids" code is to be completely purged.

## 2. Technical Stack
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Custom JWT (JSON Web Tokens) with Redis for session invalidation/management.
- **Frontend**: Next.js App Router (React)
- **Styling**: Tailwind CSS

## 3. Core Requirements
1. **Remove Orchids**: All `.orchids` resources, services within `docker-compose.yml`, and `src/visual-edits` must be deleted completely.
2. **Setup Redis**: Must initialize an `ioredis` client to support custom sessions.
3. **Implement Custom Auth**:
   - `adminUsers` and `profiles` auth should use `bcryptjs` and generate signed JWTs.
   - Maintain sessions in Redis to track active logins.
4. **Database Schema definition**:
   - Accurately redefine the existing Supabase tables (`profiles`, `admin_users`, `courses`, `lessons`, `progress_tracking`, `daily_challenges`, `achievements`, etc.) into `drizzle-orm` schemas.
   - Add necessary indexes.
5. **Component Refactoring**:
   - Rewrite components relying on `@supabase/supabase-js`.
   - Use Next.js Server Actions to securely query data directly via Drizzle.
6. **No Regressions**:
   - Compilation and types must pass.
