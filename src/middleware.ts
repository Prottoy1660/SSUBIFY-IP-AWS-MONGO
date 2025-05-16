
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { User } from '@/types';
import { AUTH_COOKIE_NAME, LOGIN_PATH, ADMIN_DASHBOARD_PATH, RESELLER_DASHBOARD_PATH } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let currentUser: User | null = null;

  if (userCookie?.value) {
    try {
      currentUser = JSON.parse(userCookie.value);
    } catch {
      // Invalid cookie, treat as unauthenticated
    }
  }

  // Public paths accessible to everyone
  if (pathname.startsWith('/auth') || pathname === '/') {
     // If user is logged in and tries to access /auth/* or /, redirect them to their dashboard
    if (currentUser) {
      if (currentUser.role === 'admin') {
        return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
      } else if (currentUser.role === 'reseller') {
        return NextResponse.redirect(new URL(RESELLER_DASHBOARD_PATH, request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!currentUser) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith('/admin')) {
    if (currentUser.role !== 'admin') {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url)); // Or a generic "access denied" page
    }
  }

  if (pathname.startsWith('/reseller')) {
    if (currentUser.role !== 'reseller') {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url)); // Or a generic "access denied" page
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
