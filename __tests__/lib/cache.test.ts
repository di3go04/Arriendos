import { cacheClear,cacheGet,cacheSet } from '@/lib/cache';

describe('cache', () => {
  beforeEach(() => cacheClear());

  it('stores and retrieves values', () => {
    cacheSet('key1', { hello: 'world' }, 60_000);
    expect(cacheGet('key1')).toEqual({ hello: 'world' });
  });

  it('returns null for missing keys', () => {
    expect(cacheGet('nonexistent')).toBeNull();
  });

  it('expires after TTL', async () => {
    cacheSet('exp', 'value', 50);
    expect(cacheGet('exp')).toBe('value');
    await new Promise(r => setTimeout(r, 60));
    expect(cacheGet('exp')).toBeNull();
  });
});
