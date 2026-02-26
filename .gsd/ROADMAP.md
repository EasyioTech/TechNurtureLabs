# Validation & Refactor Roadmap

## Phase 1: Dependency Cleanup
- [x] Delete `.orchids` directory.
- [x] Delete `src/visual-edits`.
- [x] Remove `orchids` from `docker-compose.yml`.

## Phase 2: Core Infra Setup
- [x] Uninstall `@supabase/supabase-js`.
- [x] Install `ioredis`, `jose`, `postgres`, `drizzle-orm`.
- [x] Setup `redis.ts` client.
- [x] Setup `db.ts` postgres client.
- [x] Define `schema.ts`.

## Phase 3: Auth Refactor
- [x] Implement Redis+JWT Session Logic.
- [x] Rewrite `/api/auth/login` and `/api/admin/login` for session creation.
- [x] Rewrite `auth-provider.tsx` to utilize non-Supabase `/api/auth/me`.

## Phase 4: Component Decoupling
- [ ] Implement robust Server Actions retrieving required backend data (e.g. `getStudentDashboardData`).
- [ ] Migrate `student/page.tsx` payload fetches.
- [ ] Migrate `student/journey/[courseId]/page.tsx` and map component.
- [ ] Migrate `video-player.tsx` and lesson saving logic.
- [ ] Refactor admin pages using Drizzle queries instead of Supabase client.

## Phase 5: Verification & Type Checks
- [ ] Run `npm run build` to verify no lingering Supabase `import` errors.
- [ ] Address Drizzle Schema mismatched typing.

## Phase 6: Storage Integration
- [ ] Execute `PLAN-6.1-r2-upload.md` to setup Cloudflare R2 / Local fallback uploads.
