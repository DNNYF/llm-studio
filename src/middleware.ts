
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const {pathname} = request.nextUrl;

  // If the user is trying to access the login page but is already logged in,
  // redirect them to the admin page.
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If the user is trying to access the admin page but is not logged in,
  // redirect them to the login page.
  if (!session && pathname === '/admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/login'],
};
