import { auth } from '@/lib/auth'

export type AuthRole = 'admin' | 'arrendador' | 'arrendatario' | 'tenant'

export interface AuthenticatedSession {
  user: {
    id: string
    email: string
    name?: string | null
    role?: string
    image?: string | null
  }
}

export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await auth()

  if (!session?.user) {
    throw new AuthError('Unauthorized', 401)
  }

  return session as unknown as AuthenticatedSession
}

export async function optionalAuth(): Promise<AuthenticatedSession | null> {
  const session = await auth()
  return session?.user ? (session as unknown as AuthenticatedSession) : null
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function handleAuthError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export async function requireRole(allowedRoles: AuthRole[]): Promise<AuthenticatedSession> {
  const session = await requireAuth()

  if (session.user.role && !allowedRoles.includes(session.user.role as AuthRole)) {
    throw new AuthError('Forbidden', 403)
  }

  return session
}
