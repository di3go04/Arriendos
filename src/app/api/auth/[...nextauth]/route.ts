import { handlers } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit-redis'

export const runtime = 'nodejs'

// Standard NextAuth route handler, wrapped in rate limiting HOF to prevent endpoint abuse
export const GET = withRateLimit(handlers.GET, 10, 60_000)
export const POST = withRateLimit(handlers.POST, 10, 60_000)

