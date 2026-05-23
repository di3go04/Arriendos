import {
  getStripeRuntimeModeFromKey,
  maskSecret,
  resolveStripePriceId,
} from '@/modules/stripe-payments';
import { getSiteUrl, getStripeRuntimeMode } from '@/modules/stripe-payments/config';

describe('stripe-payments config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('detecta modo test desde key', () => {
    expect(getStripeRuntimeModeFromKey('sk_test_abc')).toBe('test');
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc';
    expect(getStripeRuntimeMode()).toBe('test');
  });

  it('detecta modo live desde key', () => {
    expect(getStripeRuntimeModeFromKey('sk_live_abc')).toBe('live');
  });

  it('enmascara secretos', () => {
    expect(maskSecret('sk_test_1234567890abcdef')).toMatch(/…/);
  });

  it('usa NEXT_PUBLIC_SITE_URL para redirects', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://app.rentnow.io';
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getSiteUrl()).toBe('https://app.rentnow.io');
  });

  it('resuelve price id por plan', () => {
    process.env.STRIPE_PRICE_PROFESIONAL = 'price_prof';
    expect(resolveStripePriceId('profesional')).toBe('price_prof');
  });
});
