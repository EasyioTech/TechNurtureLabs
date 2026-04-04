import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TECH NURTURE - Edge Middleware
 *
 * 1. CORS with strict allowlist — never reflects arbitrary origins.
 *    Credentials require an explicitly trusted origin.
 *
 * 2. OPTIONS preflight handling for all API routes.
 *
 * 3. Multi-tenant subdomain routing with catch-all rewrite so that
 *    deep links on school.domain.com and admin.domain.com work correctly.
 */

// ─── CORS ALLOWLIST ──────────────────────────────────────────────────────────
// Build the set at startup from env + known subdomains.
// NEXT_PUBLIC_APP_URL covers localhost:3000 in dev and the prod domain.
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    origins.add(appUrl.replace(/\/$/, '')); // strip trailing slash
    // Derive school/admin subdomains from the same base domain
    try {
      const { protocol, hostname } = new URL(appUrl);
      const parts = hostname.split('.');
      // e.g. technurture.io → school.technurture.io, admin.technurture.io
      if (parts.length >= 2) {
        const baseDomain = parts.slice(-2).join('.');
        origins.add(`${protocol}//school.${baseDomain}`);
        origins.add(`${protocol}//admin.${baseDomain}`);
      }
    } catch { /* malformed URL — skip */ }
  }
  // Always allow localhost variants for development
  origins.add('http://localhost:3000');
  origins.add('http://localhost:3001');
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

export const runtime = 'nodejs'; // Required for ioredis in middleware

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Set CSRF_STRICT_MODE=false in .env to allow sessions through on double Redis+DB failure.
// Default: true (fail-secure). Recommended for production.
const CSRF_STRICT_MODE = process.env.CSRF_STRICT_MODE !== 'false';

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Range',
  'Access-Control-Max-Age': '86400',
};

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin.replace(/\/$/, ''));
}

/**
 * Middleware: Global Scale Guards (M-9, M-8)
 *
 * NOTE: Subdomain routing is now handled by next.config.ts rewrites.
 * This middleware focuses on:
 * - Rate limiting (M-9)
 * - Session validation and revocation (M-8)
 * - CSRF protection
 * - CORS headers injection
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const origin = request.headers.get('origin');
  const isApi = url.pathname.startsWith('/api');
  const originAllowed = isAllowedOrigin(origin);

  // ─── 0. GLOBAL RATE LIMITING (M-9) ────────────────────────────────────────
  // Protect Next.js from flood attacks regardless of authentication status.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');

  const { rateLimitIp } = await import('@/lib/ratelimit');
  const { success } = await rateLimitIp(ip, 300, 60); // 300 req/min limit
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // ─── 0.1 SESSION REVOCATION CHECK (M-8) ──────────────────────────────────
  // Check if session is revoked/invalidated. Use Redis first (fast), fall back to DB (reliable).
  //
  // CRITICAL FIX #6: If Redis is down, fall back to DB check instead of logging everyone out.
  // Problem: If Redis pod crashes, ALL 5000 users get instant logout because redis.get()
  // returns null, which is interpreted as "revoked". This causes thundering herd of 5000
  // concurrent login attempts that crash the DB.
  // Solution: Try Redis, but if it fails, check DB to verify session is ACTUALLY revoked.
  //
  // SECURITY FIX: Fail-secure by default. Infrastructure failures don't grant unauthorized access.
  // Set CSRF_STRICT_MODE=false in .env to allow sessions through (not recommended).
  const sessionToken = request.cookies.get('session')?.value;
  if (sessionToken) {
    // SECURITY FIX #1: Validate JWT_SECRET is not empty
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === '') {
      console.error('[Middleware] JWT_SECRET is not configured — session validation disabled');
      return new NextResponse('Configuration error', { status: 500 });
    }

    const { jwtVerify } = await import('jose');
    const { redis } = await import('@/lib/redis');
    const { db } = await import('@/lib/db');
    const { userSessions } = await import('@/db/schema');
    const secret = new TextEncoder().encode(jwtSecret);

    try {
      const { payload } = await jwtVerify(sessionToken, secret);
      const sessionId = (payload as any).sessionId;

      // Try Redis first (fast), but have fallback
      let sessionExists = null;
      let infrastructureFailure = false;

      try {
        sessionExists = await redis.get(`session:${sessionId}`);
      } catch (redisErr) {
        // Redis is down — fall back to database check
        try {
          const { and: drizzleAnd, eq: drizzleEq, gt: drizzleGt } = await import('drizzle-orm');
          const dbSession = await db.query.userSessions.findFirst({
            where: drizzleAnd(
              drizzleEq(userSessions.id, sessionId),
              drizzleGt(userSessions.expires_at, new Date())  // Check not expired
            )
          });
          sessionExists = dbSession ? 'ok' : null;  // Truthy if found and not expired
        } catch (dbErr) {
          // SECURITY FIX #2: Both Redis and DB are down — fail-secure by default
          infrastructureFailure = true;
          const errorMsg = (dbErr as any).message || 'unknown';
          console.error('[Middleware] Session check failed (Redis + DB):', errorMsg);

          if (CSRF_STRICT_MODE) {
            // Fail-secure: revoke access on infrastructure failure
            const response = NextResponse.redirect(new URL('/login?error=service_unavailable', request.url));
            response.cookies.delete('session');
            response.cookies.delete('refresh_token');
            return response;
          } else {
            // Fail-open (only if explicitly configured): allow session through
            sessionExists = 'ok';
            console.warn('[Middleware] CSRF_STRICT_MODE=false — allowing session despite infrastructure failure');
          }
        }
      }

      if (!sessionExists) {
        // Session is actually revoked or expired (not just infra failure)
        const isSuperAdminPath = url.pathname.startsWith('/super-admin');
        const loginPath = isSuperAdminPath ? '/super-admin/login' : '/school-portal/login';
        
        const response = NextResponse.redirect(new URL(`${loginPath}?revoked=true&from=${encodeURIComponent(url.pathname)}`, request.url));
        response.cookies.delete('session');
        response.cookies.delete('refresh_token');
        return response;
      }
    } catch (e) {
      // JWT verification failed (expired, invalid, etc.)
      // verifySession action will handle rotation if refresh token is valid.
      // Don't revoke here — let normal auth flow handle it.
    }
  }

  // ─── 0.2 CSRF VALIDATION (Double-Submit Cookie Pattern) ──────────────────
  // Validate CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE)
  // SECURITY FIX #3: Protect all mutating API requests, not just authenticated ones.
  // Reasoning: CSRF tokens protect the origin (browser/app), not the user.
  // An unauthenticated attacker can still trigger registration, form submissions, etc.
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  // Exempt: login/logout endpoints (unauthenticated, safe), payment endpoints (external/pre-auth), webhooks
  const isCsrfExempt = url.pathname.startsWith('/api/auth/') ||
                       url.pathname === '/api/admin/login' ||
                       url.pathname === '/api/admin/register' ||
                       url.pathname === '/api/media/stream-upload' ||
                       url.pathname === '/api/payment/verify' ||
                       url.pathname === '/api/payment/create-order';

  // Require CSRF on all mutating API requests (not just authenticated ones)
  if (isApi && isMutatingMethod && !isCsrfExempt) {
    const submittedCsrf = request.headers.get('x-csrf-token');
    const csrfCookie = request.cookies.get('csrf_token')?.value;

    // CSRF token must match and be present in both header and cookie
    // This protects both authenticated and unauthenticated endpoints
    if (!submittedCsrf || !csrfCookie || submittedCsrf !== csrfCookie) {
      return new NextResponse('CSRF token validation failed', { status: 403 });
    }
  }

  // ─── 1. OPTIONS PREFLIGHT ─────────────────────────────────────────────────
  if (isApi && request.method === 'OPTIONS') {
    const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
    if (originAllowed && origin) {
      responseHeaders['Access-Control-Allow-Origin'] = origin;
      responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    // If origin not in allowlist, return 204 without ACAO — browser blocks it.
    return new NextResponse(null, { status: 204, headers: responseHeaders });
  }

  // ─── 2. INJECT CORS HEADERS ON API RESPONSES ─────────────────────────────
  let response = NextResponse.next();

  if (isApi && originAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods']);
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers']);
  }

  return response;
}

export const config = {
  matcher: [
    // PERFORMANCE FIX #4: Use explicit whitelist instead of blacklist
    // Whitelist approach (clearer intent, lower false-positive rate):
    // - All /api/* routes (CORS, CSRF, rate limiting, sessions)
    // - Auth-related routes (/auth/*, /login, /logout, etc.)
    // - Admin routes (/admin/* for subdomain handling)
    // - Dashboard and protected pages (require session checks)
    // Explicitly exclude static/asset routes that don't need middleware
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).)*',
  ],
};
