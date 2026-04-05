import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TECH NURTURE - Edge Middleware
 * 
 * NOTE: Middleware is critical to avoid IDOR and CSRF at the edge. 
 * If it fails, it MUST fail-secure in production but fail-open in development
 * to support the user's preference for optional services like Redis.
 */

// ─── CORS ALLOWLIST ──────────────────────────────────────────────────────────
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  origins.add(appUrl.replace(/\/$/, ''));
  try {
    const { protocol, hostname } = new URL(appUrl);
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const baseDomain = parts.slice(-2).join('.');
      origins.add(`${protocol}//school.${baseDomain}`);
      origins.add(`${protocol}//admin.${baseDomain}`);
    }
  } catch { /* skip */ }

  origins.add('http://localhost:3000');
  origins.add('http://localhost:3001');
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

// Configuration
const CSRF_STRICT_MODE = process.env.CSRF_STRICT_MODE !== 'false';
const IS_DEV = process.env.NODE_ENV === 'development';

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Range',
  'Access-Control-Max-Age': '86400',
};

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin.replace(/\/$/, ''));
}

function isValidRedirect(urlStr: string, requestUrl: string): boolean {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const safeBase = new URL(appUrl).origin;
    const targetUrl = new URL(urlStr, requestUrl);
    if (urlStr.startsWith('/') && !urlStr.startsWith('//')) return true;
    return targetUrl.origin === safeBase;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const traceId = request.headers.get('x-request-id') || crypto.randomUUID();
  request.headers.set('x-request-id', traceId);

  const withTrace = (res: NextResponse) => {
    res.headers.set('x-request-id', traceId);
    return res;
  };

  const url = request.nextUrl.clone();
  const origin = request.headers.get('origin');
  const isApi = url.pathname.startsWith('/api');
  const originAllowed = isAllowedOrigin(origin);

  // ─── IP RESOLUTION ───────────────────────────────────────────────────
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');

  // Load utilities lazily to keep edge performance high
  const { rateLimit, rateLimitIp } = await import('@/lib/ratelimit');

  // ─── RATE LIMITING (Bypasses automatically in Dev if Redis is down) ──────
  const isLoginRoute = url.pathname.includes('/login') && isApi && request.method === 'POST';
  if (isLoginRoute) {
    const { success: loginSuccess } = await rateLimit(`login:${ip}`, 5, 60);
    if (!loginSuccess) {
      return withTrace(new NextResponse('Too Many Failed Login Attempts.', { status: 429 }));
    }
  }

  const { success: globalLimitSuccess } = await rateLimitIp(ip, 300, 60);
  if (!globalLimitSuccess) {
    return withTrace(new NextResponse('Too Many Requests', { status: 429 }));
  }

  // ─── SESSION VALIDATION ──────────────────────────────────────────────
  const sessionToken = request.cookies.get('session')?.value;
  if (sessionToken) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === '') {
      console.warn('[Proxy] JWT_SECRET is missing or empty — session checks will be skipped');
      return withTrace(NextResponse.next());
    }

    try {
      const { jwtVerify } = await import('jose');
      
      // CRITICAL: Redis driver 'ioredis' is NOT compatible with Edge Runtime.
      // We must avoid importing @/lib/redis at the top level or during edge execution.
      let redis: any = null;
      if (process.env.NEXT_RUNTIME !== 'edge') {
        const mod = await import('@/lib/redis');
        redis = mod.redis;
      }
      
      const { db } = await import('@/lib/db');
      const { userSessions } = await import('@/db/schema');
      const secret = new TextEncoder().encode(jwtSecret);

      const { payload } = await jwtVerify(sessionToken, secret);
      const sessionId = (payload as any).sessionId;

      let sessionExists: any = null;

      // Try Redis first (if available)
      if (redis && redis.status === 'ready') {
        try {
          sessionExists = await redis.get(`session:${sessionId}`);
        } catch (redisErr) {
          console.warn('[Middleware] Redis check failed, falling back to DB');
        }
      }

      // Fallback to Database if Redis didn't yield a result
      if (sessionExists === null) {
        try {
          const { and, eq, gt } = await import('drizzle-orm');
          const dbSession = await db.query.userSessions.findFirst({
            where: and(
              eq(userSessions.id, sessionId),
              gt(userSessions.expires_at, new Date())
            )
          });
          sessionExists = dbSession ? 'ok' : null;
        } catch (dbErr) {
          // If BOTH fail, in Strict Mode we must revoke access. In Dev, we fail-open.
          if (CSRF_STRICT_MODE && !IS_DEV) {
            const loginPath = url.pathname.startsWith('/super-admin') ? '/super-admin/login' : '/school-portal/login';
            const res = NextResponse.redirect(new URL(`${loginPath}?error=service_unavailable`, request.url));
            res.cookies.delete('session');
            res.cookies.delete('refresh_token');
            return withTrace(res);
          }
          sessionExists = 'ok'; // Fail-open in dev/relaxed mode
        }
      }

      if (!sessionExists) {
        throw new Error('Revoked');
      }
    } catch (e: any) {
      // Clear token and redirect if it's an expired or revoked session
      const isSuperAdminPath = url.pathname.startsWith('/admin-portal') || url.pathname.startsWith('/admin');
      const isSchoolAdminPath = url.pathname.startsWith('/school-portal') || url.pathname.startsWith('/school-admin');
      
      const loginPath = isSuperAdminPath ? '/admin-portal/login' 
                      : isSchoolAdminPath ? '/school-portal/login' 
                      : '/login';

      // Don't redirect on landing page or public pages if session is just invalid
      const isPublicPath = url.pathname === '/' ||
        url.pathname.includes('/login') ||
        url.pathname.startsWith('/pricing') ||
        url.pathname.startsWith('/register') ||
        url.pathname.startsWith('/contact-us') ||
        url.pathname.startsWith('/forgot-password');

      if (!isPublicPath) {
        const redirectPath = url.pathname;
        const safeFrom = isValidRedirect(redirectPath, request.url) ? encodeURIComponent(redirectPath) : '';
        const errorType = (e.message === 'Revoked') ? 'revoked' : 'expired';

        const res = NextResponse.redirect(new URL(`${loginPath}?${errorType}=true${safeFrom ? `&from=${safeFrom}` : ''}`, request.url));
        res.cookies.delete('session');
        res.cookies.delete('refresh_token');
        return withTrace(res);
      }
    }
  }

  // ─── CSRF VALIDATION (Point 2) ──────────────────
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const isCsrfExempt = url.pathname.startsWith('/api/auth/') ||
    url.pathname === '/api/admin/login' ||
    url.pathname === '/api/admin/register' ||
    url.pathname === '/api/media/stream-upload' ||
    url.pathname === '/api/payment/verify' ||
    url.pathname === '/api/payment/create-order';

  if (isApi && isMutatingMethod && !isCsrfExempt) {
    const submittedCsrf = request.headers.get('x-csrf-token');
    const csrfCookie = request.cookies.get('csrf_token')?.value;

    if (!submittedCsrf || !csrfCookie || submittedCsrf !== csrfCookie) {
      return withTrace(new NextResponse('CSRF token validation failed', { status: 403 }));
    }
  }

  // ─── PREFLIGHT / HEADERS ─────────────────────────────────────────────────
  if (isApi && request.method === 'OPTIONS') {
    const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
    if (originAllowed && origin) {
      responseHeaders['Access-Control-Allow-Origin'] = origin;
      responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    return withTrace(new NextResponse(null, { status: 204, headers: responseHeaders }));
  }

  const response = NextResponse.next();
  if (isApi && originAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods']);
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers']);
  }

  return withTrace(response);
}

export const config = {
  matcher: [
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).)*',
  ],
};
