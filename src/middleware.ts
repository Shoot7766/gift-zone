import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /static (public files)
    // - /.*\\..* (files with extensions, e.g. favicon.ico)
    '/((?!api|_next|_vercel|static|.*\\..*).*)'
  ]
};
