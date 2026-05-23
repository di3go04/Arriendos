const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Limpiar entradas viejas cada 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}, 300_000);

type RouteHandler = (req: Request, ...args: LooseRecord[]) => Promise<Response> | Response;

export function withRateLimit(handler: RouteHandler, maxRequests = 30, windowMs = 60_000) {
  return async (req: Request, ...args: LooseRecord[]) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const result = rateLimit(ip, maxRequests, windowMs);
    if (!result.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
      });
    }
    return handler(req, ...args);
  };
}
