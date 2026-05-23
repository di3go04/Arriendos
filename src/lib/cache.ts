const cache = new Map<string, { data: LooseValue; expiresAt: number }>();

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet(key: string, data: LooseValue, ttlMs = 60_000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string) {
  cache.delete(key);
}

export function cacheClear() {
  cache.clear();
}

// Cleanup old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}, 60_000);

export async function withCache<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  cacheSet(key, data, ttlMs);
  return data;
}
