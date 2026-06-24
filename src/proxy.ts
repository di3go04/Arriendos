import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { getToken } from 'next-auth/jwt'
import { locales, defaultLocale } from './i18n/config'
import { rateLimit } from '@/lib/rate-limit'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Rate limiting configuration (migrated from middleware.ts)
const RATE_LIMIT_CONFIG: Record<string, { limit: number; windowMs: number }> = {
  '/api/auth/signin': { limit: 5, windowMs: 60_000 },
  '/api/auth/signup': { limit: 3, windowMs: 60_000 },
  '/api/auth/callback/credentials': { limit: 5, windowMs: 60_000 },
  '/api/auth/reset-password': { limit: 3, windowMs: 60_000 },
  '/api/modules/ai-contracts/generate': { limit: 10, windowMs: 60_000 },
  '/api/generate-template': { limit: 10, windowMs: 60_000 },
  '/api/generate-pdf': { limit: 10, windowMs: 60_000 },
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/').filter(Boolean)

  // Rate limiting check (runs before all other logic)
  const rlConfig = RATE_LIMIT_CONFIG[pathname]
  if (rlConfig) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'anonymous'
    const key = `${pathname}:${ip}`
    const result = rateLimit(key, rlConfig.limit, rlConfig.windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rlConfig.windowMs / 1000)),
            'X-RateLimit-Limit': String(rlConfig.limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }
  }

  // Rewrite locale-prefixed static files to root level
  // e.g. /es/manifest.webmanifest → /manifest.webmanifest
  if (
    segments.length > 1 &&
    locales.includes(segments[0] as typeof locales[number]) &&
    /\.\w+$/.test(segments[segments.length - 1])
  ) {
    request.nextUrl.pathname = '/' + segments.slice(1).join('/')
    return NextResponse.rewrite(request.nextUrl)
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|json|webmanifest|txt|xml)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const hasLocalePrefix = segments.length > 1 && locales.includes(segments[0] as typeof locales[number])
  const effectivePath = hasLocalePrefix ? '/' + segments.slice(1).join('/') : pathname

  // Public routes — no auth required
  const publicRoutes = [
    '/login', '/register', '/precios', '/propiedades',
    '/terminos', '/privacidad', '/blog', '/status',
    '/comprar-codigo', '/hello', '/demo', '/developers',
  ]

  const isPublicRoute =
    publicRoutes.some((r) => effectivePath === r || effectivePath.startsWith(r + '/')) ||
    effectivePath.startsWith('/api/auth') ||
    effectivePath.startsWith('/api/webhooks') ||
    effectivePath === '/' ||
    effectivePath.startsWith('/api/leads') ||
    effectivePath.startsWith('/api/public') ||
    effectivePath.startsWith('/api/health')

  // API public routes — pass through directly
  if (isPublicRoute && effectivePath.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Public pages — use intl middleware to add/validate locale prefix
  if (isPublicRoute) {
    return intlMiddleware(request)
  }

  // Protected routes (dashboard, admin, API)
  const protectedPaths = ['/dashboard', '/admin', '/superadmin']
  const isProtected = protectedPaths.some((p) => effectivePath.startsWith(p))

  if (isProtected || effectivePath.startsWith('/api/')) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      if (effectivePath.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', effectivePath)
      return NextResponse.redirect(loginUrl)
    }

    // Protected pages without locale prefix — serve directly
    if (!hasLocalePrefix) {
      return NextResponse.next()
    }
    // Protected pages with locale prefix — use intl middleware
    return intlMiddleware(request)
  }

  // Non-API, non-protected, non-public pages
  if (hasLocalePrefix) {
    return intlMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}

