import type Stripe from 'stripe';
import { createStripeClient } from './client';
import { loadSystemStripeConfig } from './system-config';
import { fulfillCheckoutSession, onCheckoutCompletedPlaceholder } from './fulfillment';
import type { WebhookHandleResult } from './contract';

/**
 * Procesa webhook Stripe con body crudo y validación de firma.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null
): Promise<WebhookHandleResult> {
  const config = await loadSystemStripeConfig();
  if (!config?.stripeSecretKey) {
    return { ok: false, error: 'Pasarela de pagos no configurada por el administrador' };
  }

  const webhookSecret = config.stripeWebhookSecret;
  if (!webhookSecret) {
    return { ok: false, error: 'stripe_webhook_secret no configurado en configuracion_sistema' };
  }
  if (!signature) {
    return { ok: false, error: 'Cabecera stripe-signature faltante' };
  }

  const stripe = createStripeClient(config.stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Firma inválida';
    return { ok: false, error: message };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutCompletedPlaceholder(session);
      await fulfillCheckoutSession(session);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await handleSubscriptionLifecycle(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      console.log(`[stripe-payments] Evento no manejado: ${event.type}`);
  }

  return { ok: true, eventType: event.type };
}

async function handleSubscriptionLifecycle(subscription: Stripe.Subscription) {
  const admin = (await import('@/modules/_kernel/supabase-admin')).getSupabaseAdmin();
  if (!admin) return;

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    incomplete: 'pending',
    incomplete_expired: 'cancelled',
    trialing: 'trialing',
    unpaid: 'past_due',
    paused: 'paused',
  };

  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const item = subscription.items.data[0];
  const periodStart = sub.current_period_start ?? item?.current_period_start;
  const periodEnd = sub.current_period_end ?? item?.current_period_end;

  await admin
    .from('subscriptions')
    .update({
      status: statusMap[subscription.status] || subscription.status,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : undefined,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      cancelled_at:
        subscription.status === 'canceled' ? new Date().toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}
