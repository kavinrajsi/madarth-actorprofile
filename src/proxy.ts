import {NextResponse} from 'next/server';
import {auth} from '@/auth';

// Optimistic check only: real authorization happens in requireAdmin() on every page/action/route.
export default auth((req) => {
  if (!req.auth) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
