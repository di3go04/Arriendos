export const runtime = "edge";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = await caches.open('default');
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const response = await fetch(url.toString(), {
        headers: { "Cache-Control": "s-maxage=600" },
    });
    await cache.put(cacheKey, response.clone());
    return response;
}