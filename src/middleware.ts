import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  const subdomain = hostname.split('.')[0];

  if (url.pathname === '/school') {
    return NextResponse.redirect(new URL('/school-portal/login', request.url));
  }

  if (subdomain === 'school' || hostname.startsWith('school.')) {
    if (url.pathname === '/') {
      url.pathname = '/school-portal';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/login') {
      url.pathname = '/school-portal/login';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/register') {
      url.pathname = '/school-portal/register';
      return NextResponse.rewrite(url);
    }
  }

  if (subdomain === 'admin' || hostname.startsWith('admin.')) {
    if (url.pathname === '/') {
      url.pathname = '/admin-portal';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/login') {
      url.pathname = '/admin-portal/login';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|school-portal|admin-portal).*)',
  ],
};
