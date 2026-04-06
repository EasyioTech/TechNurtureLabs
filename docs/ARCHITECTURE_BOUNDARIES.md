# Architecture Boundary Enforcement

## Overview

This document defines the runtime boundaries between different execution environments in TechNurture LMS and explains how to prevent cross-boundary violations.

## Execution Environments

### 1. **Next.js Server** (`next.js_server`)
- Next.js Server Components (async components, page routes)
- API routes (`/app/api/`)
- Server Actions (`'use server'` functions called from client)
- **Can import**: auth, session management, database utilities
- **Cannot import**: Worker-specific modules
- **Characteristics**: Has access to `cookies()`, `headers()`, `requestAsyncStorage`

### 2. **Browser** (`next.js_browser`)
- Client Components
- Browser JavaScript
- **Cannot import**: Server-only modules
- **Cannot use**: Database, auth, session APIs
- **Detection**: `typeof window !== 'undefined'`

### 3. **Standalone Worker** (`standalone_worker`)
- Background job processors (`scripts/event-worker.ts`, `scripts/stats-flush-worker.ts`)
- Batch processing scripts
- Runs via `npx tsx scripts/worker.ts` (pure Node.js, no Next.js runtime)
- **Can import**: Database, Redis, gamification logic
- **Cannot use**: Next.js-specific APIs (`cookies()`, `headers()`, `revalidatePath()`)
- **Cannot import**: Full auth module (which uses Next.js APIs)
- **Workaround**: Use `checkAndAwardAchievementsInternal()` (no auth required)

## Violation History

### Issue: Event Worker Crash Loop (Fixed)

**Problem**:
```
Error: This module cannot be imported from a Client Component module. 
It should only be used from a Server Component.
```

**Root Cause**: `src/lib/auth.ts` had `import 'server-only'` which:
1. Checked if code was running in Next.js Server Component context
2. Threw error if not (e.g., in standalone worker via `tsx`)
3. Worker imports `achievement-actions.ts` → imports `auth.ts` → crash

**Solution** (in order of application):
1. ✅ Removed unused `verifySession` import from `challenge-actions.ts`
2. ✅ Lazy-loaded `verifySession` in `achievement-actions.ts` functions that use it
3. ✅ Removed `import 'server-only'` from `auth.ts` (it was too strict)

**Lesson**: Import-time guards (`server-only`) are too rigid for monorepo architectures with multiple runtimes. Lazy-loading + documentation is more flexible.

## Boundary Enforcement Rules

### Rule 1: Don't Import Auth in Workers
❌ **Bad**:
```typescript
// worker.ts
import { verifySession } from '@/lib/auth'; // Won't work - needs cookies()
```

✅ **Good**:
```typescript
// worker.ts
import { checkAndAwardAchievementsInternal } from '@/modules/student/actions/achievement-actions';
// This function doesn't need verifySession
await checkAndAwardAchievementsInternal(userId);
```

### Rule 2: Lazy-Load Next.js-Specific Code in Actions

❌ **Bad**:
```typescript
// achievement-actions.ts - imported by workers
import { verifySession } from '@/lib/auth'; // Blocks workers

export async function checkAndAwardAchievements() {
  const session = await verifySession();
  // ...
}
```

✅ **Good**:
```typescript
// achievement-actions.ts - safe for workers
export async function checkAndAwardAchievements() {
  // Lazy-load only in functions that need it
  const { verifySession } = await import('@/lib/auth');
  const session = await verifySession();
  // ...
}

export async function checkAndAwardAchievementsInternal(userId: string) {
  // No auth needed - workers can call this directly
  // ...
}
```

### Rule 3: Add Comments to Boundary-Sensitive Modules

```typescript
/**
 * BOUNDARY-SENSITIVE: This module uses Next.js APIs
 *
 * Can be imported from:
 * - ✅ Next.js Server Components
 * - ✅ API Routes
 * - ✅ Server Actions (via lazy import)
 *
 * Cannot be imported from:
 * - ❌ Client Components (will crash)
 * - ❌ Standalone workers (no Next.js context)
 *
 * Why: Uses cookies(), headers(), revalidatePath()
 */
```

## Runtime Detection for Hardening

Use the runtime checks in `src/lib/runtime-check.ts` to validate boundaries at runtime:

```typescript
import { assertServerContext } from '@/lib/runtime-check';

export async function verifySession() {
  // Fast-fail if called from browser or unknown context
  assertServerContext('verifySession');
  // ... rest of implementation
}
```

## Current Module Categorization

### Server-Only Modules (Cannot be used in workers)
- `src/lib/auth.ts` - uses cookies(), headers(), Next.js requests
- `src/lib/media-auth.ts` - session-based media authentication
- `src/lib/crypto.ts` - depends on auth

### Worker-Safe Modules (Can be used in workers)
- `src/lib/db.ts` - pure database access (no Next.js features)
- `src/lib/redis.ts` - pure Redis client
- `src/lib/gamification.ts` - game logic, no auth
- `src/modules/student/actions/achievement-actions.ts` - **if using checkAndAwardAchievementsInternal**

### Transitional Modules (Can be used both ways via lazy-loading)
- `src/modules/student/actions/challenge-actions.ts` - lazy-loads auth when needed
- `src/modules/student/actions/achievement-actions.ts` - lazy-loads auth when needed

## Testing & Validation

### How to Validate Boundaries

1. **Simulate Worker Import** (before deploying):
   ```bash
   npx tsx -e "import('./src/modules/student/actions/achievement-actions.ts')" 2>&1
   ```
   If this works, the module is worker-safe.

2. **Check Docker Logs** (after deploying):
   ```bash
   docker compose logs event-worker | grep -i "error\|started"
   ```
   Should see "--- Platform Event Worker (BullMQ) Started ---" without errors.

3. **Monitor in Production**:
   - Alert on: Container restarts (indicates startup failure)
   - Log for: Cross-boundary import warnings
   - Check: Worker health via Redis job queue

## Future Improvements

1. **Add Import-Time Validation**
   - Create a build-time check that scans imports
   - Flag modules imported from wrong environments
   - Run in CI/CD pipeline

2. **Enhanced Runtime Checks**
   - Add `assertServerContext()` to auth functions
   - Add `assertWorkerContext()` to worker-only code
   - Use dev-mode warnings for violations

3. **Dynamic Module Routing**
   - Create facade modules that expose different APIs per environment
   - Example: `src/lib/auth.ts` exports `getSessionSafe()` that lazy-loads

4. **Worker Module Isolation**
   - Keep worker code in separate `scripts/` directory
   - Auto-generated type checking to ensure no cross-imports
   - Separate builds for worker vs. app contexts

## References

- [Next.js 'server-only' package](https://github.com/vercel/next.js/tree/canary/packages/next/dist/lib)
- [Server Components Documentation](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- Issue: `e952792` - Initial server-only import chain fix
- Issue: `db8a736` - Removed server-only guard for flexibility
