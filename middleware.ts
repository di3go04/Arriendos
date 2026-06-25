import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit-redis'

const LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const
const DEFAULT_LOCALE = 'es'

const STATIC_EXTENSIONS = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|json|woff2?|ttf|eot|webmanifest)$/i

function isStaticOrSpecial(pathname: string): boolean {
  if (pathname === '/manifest.webmanifest') return true
  if (pathname === '/favicon.ico') return true
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/_vercel/')) return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/dashboard/')) return true
  if (pathname === '/dashboard') return true
  if (pathname === '/app') return true
  if (pathname.startsWith('/app/')) return true
  if (pathname === '/login' || pathname === '/login-direct') return true
  if (pathname === '/register') return true
  if (pathname === '/forgot-password') return true
  if (pathname === '/reset-password') return true
  if (pathname === '/test-page') return true
  if (STATIC_EXTENSIONS.test(pathname)) return true
  return false
}

function stripLocalePrefix(pathname: string): string | null {
  for (const locale of LOCALES) {
    const prefix = `/${locale}/`
    if (pathname.startsWith(prefix)) {
      return pathname.slice(prefix.length - 1)
    }
    if (pathname === `/${locale}`) {
      return '/'
    }
  }
  return null
}

function isAuthPath(pathname: string): boolean {
  const authPaths = ['/login', '/login-direct', '/register', '/forgot-password', '/reset-password']
  const stripped = stripLocalePrefix(pathname)
  const checkPath = stripped || pathname
  return authPaths.some(p => checkPath === p || checkPath.startsWith(p + '/'))
}

const i18nMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
})

const RATE_LIMITED_PATHS = [
  '/api/auth/callback/credentials',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/modules/auth-enterprise/login',
  '/api/modules/auth-enterprise/password-reset',
  '/api/ai/chat',
  '/api/ai/predict-morosity',
  '/api/modules/ai-marketing/generate',
  '/api/modules/ai-contracts/generate',
  '/api/pricing/optimize',
]

async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const isRateLimited = RATE_LIMITED_PATHS.some(p => pathname.startsWith(p))
  if (!isRateLimited) return null

  // Disable rate limiting entirely for demo deployment
  return null
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  const connectSrc = isDev
    ? "connect-src 'self' ws://localhost:3000 http://localhost:3000 https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://app.posthog.com https://us-assets.i.posthog.com https://api.mapbox.com https://events.mapbox.com https://nominatim.openstreetmap.org; "
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://app.posthog.com https://us-assets.i.posthog.com https://api.mapbox.com https://events.mapbox.com https://nominatim.openstreetmap.org; "

  const SCRIPT_HASHES = "'sha256-rbbnijHn7DZ6ps39myQ3cVQF1H+U/PJfHh5ei/Q2kb8='"

  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' ${SCRIPT_HASHES};`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${SCRIPT_HASHES};`

  return [
    "default-src 'self';",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://unpkg.com;",
    connectSrc,
    "img-src 'self' data: blob: https://*.supabase.co https://*.posthog.com https://cdn.jsdelivr.net https://www.mercadopago.com https://api.mapbox.com https://*.tiles.mapbox.com https://*.tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com https://unpkg.com;",
    "font-src 'self' https://api.mapbox.com https://fonts.openmaptiles.org;",
    "worker-src 'self' blob:;",
    "frame-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'none';",
  ].join(' ')
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl

  // --- Rate limiting ---
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse && rateLimitResponse.status === 429) {
    return rateLimitResponse
  }

  // --- CSP nonce ---
  const nonce = crypto.randomUUID()
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // Apply to API routes (non-page routes need CSP too)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  if (isStaticOrSpecial(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // Auth pages (including locale-prefixed like /es/login) bypass i18n redirect
  if (isAuthPath(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // Forward x-nonce to Next.js SSR via request headers so it auto-applies nonce to inline scripts
  const i18nRequest = new NextRequest(request.url, { headers: requestHeaders })
  const response = i18nMiddleware(i18nRequest)
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|manifest.webmanifest|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|json|woff2|woff|ttf|eot|webmanifest)).*)',
    '/api/auth/callback/credentials',
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/modules/auth-enterprise/login',
    '/api/modules/auth-enterprise/password-reset',
    '/api/ai/chat',
    '/api/ai/predict-morosity',
    '/api/modules/ai-marketing/generate',
    '/api/modules/ai-contracts/generate',
    '/api/pricing/optimize',
  ],
}
