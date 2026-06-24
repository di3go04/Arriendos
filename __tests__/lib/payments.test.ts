import { CURRENCIES,PRICING } from '@/config/payments';

describe('payments config', () => {
  it('has all required plans', () => {
    expect(PRICING.basico).toBeDefined();
    expect(PRICING.profesional).toBeDefined();
    expect(PRICING.empresa).toBeDefined();
  });

  it('profesional plan has correct base price', () => {
    expect(PRICING.profesional.price).toBe(12);
    expect(PRICING.profesional.popular).toBe(true);
  });

  it('basico plan is free', () => {
    expect(PRICING.basico.price).toBe(0);
  });

  it('has multi-currency support', () => {
    expect(CURRENCIES.USD).toBeDefined();
    expect(CURRENCIES.COP).toBeDefined();
    expect(CURRENCIES.MXN).toBeDefined();
    expect(CURRENCIES.BRL).toBeDefined();
  });

  it('profesional has COP price', () => {
    expect(PRICING.profesional.prices.COP).toBeGreaterThan(0);
  });

  it('plan has features array', () => {
    expect(Array.isArray(PRICING.profesional.features)).toBe(true);
    expect(PRICING.profesional.features.length).toBeGreaterThan(0);
  });
});
