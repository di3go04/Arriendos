import { handlers } from '@/lib/auth'

export const runtime = 'nodejs'

// Rate limiting disabled for demo deployment
// Buyers need to test the demo freely without being blocked by 429 errors
export const GET = handlers.GET
export const POST = handlers.POST
