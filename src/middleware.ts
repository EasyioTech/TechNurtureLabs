import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TECH NURTURE - Edge Middleware
 * 
 * 1. Global Dynamic CORS: Detects Origin and injects Access-Control-* headers 
 *    dynamically. This allows both localhost:3000 and any school subdomains 
 *    to interact with the API with full credential support.
 * 
 * 2. OPTIONS Preflight: Handles CORS handshake for browsers automatically.
 * 
 * 3. Domain Rewriting: Maps school.domain.com and admin.domain.com to internal 
 *    portal routes.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const origin = request.headers.get('origin');
  const isApi = url.pathname.startsWith('/api');

  // 🛡️ 1. Handle Global OPTIONS preflight for API
  if (isApi && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Range',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 🏫 2. Multi-tenant Subdomain Routing
  const subdomain = hostname.split('.')[0];
  let response: NextResponse | undefined;

  if (url.pathname === '/school') {
    response = NextResponse.redirect(new URL('/school-portal/login', request.url));
  } else if (subdomain === 'school' || hostname.startsWith('school.')) {
    if (url.pathname === '/') {
      url.pathname = '/school-portal';
      response = NextResponse.rewrite(url);
    } else if (url.pathname === '/login') {
      url.pathname = '/school-portal/login';
      response = NextResponse.rewrite(url);
    } else if (url.pathname === '/register') {
      url.pathname = '/school-portal/register';
      response = NextResponse.rewrite(url);
    }
  } else if (subdomain === 'admin' || hostname.startsWith('admin.')) {
    if (url.pathname === '/') {
      url.pathname = '/admin-portal';
      response = NextResponse.rewrite(url);
    } else if (url.pathname === '/login') {
      url.pathname = '/admin-portal/login';
      response = NextResponse.rewrite(url);
    }
  }

  // 🚀 3. Finalize Response and inject Dynamic CORS
  if (!response) {
    response = NextResponse.next();
  }

  if (isApi && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Range');
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|school-portal|admin-portal).*)',
  ],
};
