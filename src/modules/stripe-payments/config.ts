/**
 * Configuración white-label Stripe — solo variables de entorno.
 * sk_test_* y sk_live_* funcionan sin cambiar código.
 */

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripeWebhookSecret(): string | undefined {
  return (
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET?.trim() ||
    undefined
  );
}

/** URL base para success/cancel (white-label) */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000';
  return url.replace(/\/$/, '');
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

export type StripeRuntimeMode = 'test' | 'live' | 'unset';

export function getStripeRuntimeMode(): StripeRuntimeMode {
  const key = getStripeSecretKey() || '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unset';
}

export function resolveStripePriceId(planId?: string, explicitPriceId?: string): string | undefined {
  if (explicitPriceId?.trim()) return explicitPriceId.trim();
  if (!planId) return undefined;
  const map: Record<string, string | undefined> = {
    profesional:
      process.env.STRIPE_PRICE_PROFESIONAL?.trim() ||
      process.env.STRIPE_PROFESIONAL_PRICE_ID?.trim(),
    empresa:
      process.env.STRIPE_PRICE_EMPRESA?.trim() ||
      process.env.STRIPE_EMPRESA_PRICE_ID?.trim(),
  };
  return map[planId];
}
