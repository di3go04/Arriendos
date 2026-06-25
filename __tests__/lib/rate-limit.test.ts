import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows first request', async () => {
    const result = await rateLimit('test-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks after exceeding limit', async () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) await rateLimit(key, 3, 60_000);
    const result = await rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    await rateLimit(key, 2, 100);
    await rateLimit(key, 2, 100);
    await new Promise(r => setTimeout(r, 150));
    const result = await rateLimit(key, 2, 100);
    expect(result.allowed).toBe(true);
  });
});
