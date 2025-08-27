
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const authRoutes = ['/login', '/register'];
  const authRequiredRoutes = ['/my-classes', '/tutor-profile', '/profile', '/tutor/availability'];
  const adminOnlyRoutes = ['/admin'];

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAuthRequired = authRequiredRoutes.some(route => pathname.startsWith(route));
  const isAdminOnly = adminOnlyRoutes.some(route => pathname.startsWith(route));


  // If a user is logged in, redirect them away from login/register pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/my-classes', req.url));
  }

  // If a route requires authentication and the user is not logged in, redirect to login
  if ((isAuthRequired || isAdminOnly) && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in, check for role-based access
  if (token) {
    // If a non-admin tries to access an admin-only page
    if (isAdminOnly && !token.isAdmin) {
       return NextResponse.redirect(new URL('/my-classes', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
