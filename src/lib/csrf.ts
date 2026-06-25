import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function getCsrfToken(): string {
  return generateToken()
}

export function setCsrfCookie(response: NextResponse): NextResponse {
  const token = generateToken()
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  return response
}

export async function applyCsrfProtection(request: NextRequest): Promise<NextResponse | void> {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return
  }

  // Skip CSRF for webhooks (they use their own signature verification)
  if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return
  }

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }
}

export function addCsrfTokenToResponse(response: NextResponse): NextResponse {
  if (!response.cookies.has(CSRF_COOKIE_NAME)) {
    return setCsrfCookie(response)
  }
  return response
}
