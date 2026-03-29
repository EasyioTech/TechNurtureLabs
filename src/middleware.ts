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
  // Check if session is revoked/invalidated via user_sessions table (cached in Redis).
  const sessionToken = request.cookies.get('session')?.value;
  if (sessionToken) {
    const { jwtVerify } = await import('jose');
    const { redis } = await import('@/lib/redis');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    
    try {
      const { payload } = await jwtVerify(sessionToken, secret);
      const sessionId = (payload as any).sessionId;
      
      const sessionExists = await redis.get(`session:${sessionId}`);
      if (!sessionExists) {
         // Session revoked or expired in Redis — trigger logout
         const response = NextResponse.redirect(new URL('/login?revoked=true', request.url));
         response.cookies.delete('session');
         response.cookies.delete('refresh_token');
         return response;
      }
    } catch (e) {
      // JWT expired or invalid — verifySession action will handle rotation if needed, 
      // but for mission-critical revocation we ignore and let regular flow handle it.
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

  // ─── 2. MULTI-TENANT SUBDOMAIN ROUTING ───────────────────────────────────
  const subdomain = hostname.split('.')[0];
  let response: NextResponse | undefined;

  if (url.pathname === '/school') {
    response = NextResponse.redirect(new URL('/school-portal/login', request.url));
  } else if (subdomain === 'school' || hostname.startsWith('school.')) {
    // Catch-all: prepend /school-portal so all deep links work
    if (!url.pathname.startsWith('/school-portal')) {
      url.pathname = `/school-portal${url.pathname === '/' ? '' : url.pathname}`;
      response = NextResponse.rewrite(url);
    }
  } else if (subdomain === 'admin' || hostname.startsWith('admin.')) {
    if (!url.pathname.startsWith('/admin-portal')) {
      url.pathname = `/admin-portal${url.pathname === '/' ? '' : url.pathname}`;
      response = NextResponse.rewrite(url);
    }
  }

  // ─── 3. INJECT CORS HEADERS ON API RESPONSES ─────────────────────────────
  if (!response) {
    response = NextResponse.next();
  }

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
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
