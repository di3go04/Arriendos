import { applySecurityHeaders } from '@/modules/security-compliance/apply-headers';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

function secure(response: NextResponse) {
  return applySecurityHeaders(response);
}

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
});

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Rewrite locale-prefixed static files to root
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 1 && locales.includes(segments[0] as any)) {
        const restPath = '/' + segments.slice(1).join('/');
        if (
            restPath.startsWith('/_next/') ||
            restPath.startsWith('/api/') ||
            restPath === '/favicon.ico' ||
            restPath === '/manifest.json' ||
            restPath.endsWith('/manifest.webmanifest') ||
            restPath.endsWith('.map') ||
            /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)$/.test(restPath)
        ) {
            const url = new URL(request.url);
            // Rewrite manifest.webmanifest to manifest.json
            url.pathname = restPath.endsWith('.webmanifest') ? '/manifest.json' : restPath;
            return secure(NextResponse.rewrite(url));
        }

        const url = new URL(request.url);
        url.pathname = restPath;
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-locale', segments[0]);
        return secure(NextResponse.rewrite(url, { request: { headers: requestHeaders } }));
    }

    // Skip internal and static paths at root
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname === '/manifest.json' ||
        pathname === '/manifest.webmanifest' ||
        pathname === '/sw.js' ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)$/.test(pathname)
    ) {
        return secure(NextResponse.next());
    }

    if (pathname !== '/' && !locales.includes(segments[0] as any)) {
        return secure(NextResponse.next());
    }

    const intlResponse = intlMiddleware(request);
    return secure(intlResponse instanceof NextResponse ? intlResponse : NextResponse.next());
}

export const config = {
    matcher: ['/((?!_next|api|favicon\\.ico|sw\\.js).*)'],
};
