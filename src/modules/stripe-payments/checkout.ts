import Stripe from 'stripe';
import { resolveStripePriceId } from './config';
import { createStripeClient } from './client';
import type { CreateCheckoutInput, CreateCheckoutResult } from './contract';
import {
  getStripeRuntimeModeFromKey,
  loadSystemStripeConfig,
  type SystemStripeConfig,
} from './system-config';

function resolveUnitAmountCents(input: CreateCheckoutInput): number {
  if (input.priceInCents != null) {
    if (!Number.isInteger(input.priceInCents) || input.priceInCents <= 0) {
      throw new Error('priceInCents debe ser un entero positivo');
    }
    return input.priceInCents;
  }
  const amountUsd = input.amountUsd;
  if (amountUsd == null || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error('amountUsd o priceInCents es requerido y debe ser mayor a 0');
  }
  return Math.round(amountUsd * 100);
}

function buildLineItems(input: CreateCheckoutInput, unitAmountCents: number) {
  const quantity = input.quantity ?? 1;

  if (input.mode === 'subscription') {
    const priceId = resolveStripePriceId(input.planId, input.priceId);
    if (priceId) {
      return [{ price: priceId, quantity }];
    }

    return [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: input.productName },
          unit_amount: unitAmountCents,
          recurring: { interval: input.billingInterval ?? 'month' },
        },
        quantity,
      },
    ];
  }

  return [
    {
      price_data: {
        currency: 'usd',
        product_data: { name: input.productName },
        unit_amount: unitAmountCents,
      },
      quantity,
    },
  ];
}

/**
 * Crea una sesión de Stripe Checkout (payment o subscription) en USD.
 */
export async function createStripeCheckoutSession(
  input: CreateCheckoutInput,
  systemConfig?: SystemStripeConfig | null
): Promise<CreateCheckoutResult> {
  const config = systemConfig ?? (await loadSystemStripeConfig());
  if (!config?.stripeSecretKey) {
    throw new Error('Pasarela de pagos no configurada por el administrador');
  }

  const stripe = createStripeClient(config.stripeSecretKey);
  const siteUrl = config.siteUrl;
  const unitAmountCents = resolveUnitAmountCents(input);

  const successPath = input.successPath ?? '/dashboard?stripe=success';
  const cancelPath = input.cancelPath ?? '/precios?stripe=cancelled';

  const metadata: Record<string, string> = {
    ...input.metadata,
    planId: input.planId ?? '',
    productName: input.productName,
  };
  if (input.userId) metadata.userId = input.userId;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: input.mode,
    payment_method_types: ['card'],
    customer_email: input.customerEmail,
    line_items: buildLineItems(input, unitAmountCents),
    success_url: `${siteUrl}${successPath}${successPath.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${cancelPath}`,
    metadata,
    allow_promotion_codes: true,
  };

  if (input.userId) {
    params.client_reference_id = input.userId;
  }

  if (input.mode === 'subscription') {
    params.subscription_data = {
      metadata: {
        userId: input.userId ?? '',
        planId: input.planId ?? '',
      },
    };
  }

  const session = await stripe.checkout.sessions.create(params);

  return {
    ok: true,
    sessionId: session.id,
    url: session.url,
    mode: getStripeRuntimeModeFromKey(config.stripeSecretKey),
  };
}
