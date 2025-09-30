/**
 * Next.js Middleware
 *
 * Handles authentication checks and route protection.
 */

import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/lobby') ||
    req.nextUrl.pathname.startsWith('/game') ||
    req.nextUrl.pathname.startsWith('/profile');

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/lobby/:path*',
    '/game/:path*',
    '/profile/:path*',
  ],
};