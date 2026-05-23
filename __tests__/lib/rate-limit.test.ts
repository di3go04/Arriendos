import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows first request', () => {
    const result = rateLimit('test-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks after exceeding limit', () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    const result = rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    rateLimit(key, 2, 100);
    rateLimit(key, 2, 100);
    await new Promise(r => setTimeout(r, 150));
    const result = rateLimit(key, 2, 100);
    expect(result.allowed).toBe(true);
  });
});
