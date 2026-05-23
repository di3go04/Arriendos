import Stripe from 'stripe';
import type { SystemStripeConfig } from './system-config';
import { getStripeRuntimeModeFromKey } from './system-config';

/**
 * Cliente Stripe por credenciales dinámicas (BD o env). Sin singleton global.
 */
export function createStripeClient(secretKey: string): Stripe {
  if (!secretKey?.trim()) {
    throw new Error('stripe_secret_key no configurada por el administrador');
  }
  return new Stripe(secretKey.trim(), {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  });
}

export function getStripePublicConfigFromSystem(config: SystemStripeConfig | null) {
  if (!config) {
    return { configured: false, mode: 'unset' as const, publishableKey: null, source: null };
  }
  return {
    configured: true,
    mode: getStripeRuntimeModeFromKey(config.stripeSecretKey),
    publishableKey: config.stripePublishableKey,
    source: config.source,
  };
}
