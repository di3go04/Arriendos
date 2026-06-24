// Rate limiting with in-memory fallback (works without Redis)
// For production with Vercel, configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// to use Redis-based rate limiting that persists across serverless invocations.

const rateMap = new Map<string, { count: number; resetAt: number }>()

let redisAvailable = false
let redisGet: ((key: string) => Promise<string | null>) | null = null
let redisSet: ((key: string, value: string, ttl: number) => Promise<void>) | null = null

// Attempt to use Upstash Redis if configured
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  redisGet = async (key: string) => {
    try {
      const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      return data.result
    } catch { return null }
  }

  redisSet = async (key: string, value: string, ttl: number) => {
    try {
      await fetch(`${url}/set/${key}/${value}/ex/${ttl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* fallback to memory */ }
  }

  redisAvailable = true
}

async function redisRateLimit(key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  if (!redisGet || !redisSet) {
    return memoryRateLimit(key, maxRequests, windowMs)
  }

  try {
    const current = await redisGet(`ratelimit:${key}`)
    const count = current ? parseInt(current, 10) : 0

    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    const newCount = count + 1
    await redisSet(`ratelimit:${key}`, String(newCount), Math.ceil(windowMs / 1000))

    return { allowed: true, remaining: maxRequests - newCount }
  } catch {
    return memoryRateLimit(key, maxRequests, windowMs)
  }
}

function memoryRateLimit(key: string, maxRequests = 30, windowMs = 60_000) {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key)
  }
}, 300_000)

export async function rateLimit(key: string, maxRequests = 30, windowMs = 60_000) {
  if (redisAvailable) {
    return redisRateLimit(key, maxRequests, windowMs)
  }
  return memoryRateLimit(key, maxRequests, windowMs)
}

type RouteHandler = (req: any, ...args: any[]) => Promise<Response> | Response

export function withRateLimit(handler: RouteHandler, maxRequests = 30, windowMs = 60_000) {
  return async (req: Request, ...args: unknown[]) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
    const result = await rateLimit(ip, maxRequests, windowMs)
    if (!result.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
      })
    }
    return handler(req, ...args)
  }
}
