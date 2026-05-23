import type Stripe from 'stripe';
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { createStripeClient } from './client';
import { loadSystemStripeConfig } from './system-config';

/**
 * Sincroniza checkout.session.completed con Supabase.
 * Requiere SUPABASE_SERVICE_ROLE_KEY en producción.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn(
      '[stripe-payments] SUPABASE_SERVICE_ROLE_KEY no configurada — omitiendo sync DB. ' +
        'Configúrala para activar planes automáticamente.'
    );
    return;
  }

  const userId = session.metadata?.userId || session.client_reference_id || null;
  const planId = session.metadata?.planId || 'profesional';
  const customerEmail =
    session.customer_email ||
    session.customer_details?.email ||
    session.metadata?.customerEmail ||
    null;

  let resolvedUserId = userId;

  if (!resolvedUserId && customerEmail) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();
    resolvedUserId = profile?.id ?? null;
  }

  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
  const currency = (session.currency || 'usd').toUpperCase();

  if (session.mode === 'payment') {
    if (resolvedUserId) {
      await admin.from('payment_transactions').insert({
        user_id: resolvedUserId,
        plan_id: planId,
        amount: amountTotal,
        currency,
        status: 'approved',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripe_customer_id:
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
        paid_at: new Date().toISOString(),
        external_reference: session.id,
      });
    }
    return;
  }

  if (session.mode === 'subscription' && resolvedUserId) {
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) return;

    const sysConfig = await loadSystemStripeConfig();
    if (!sysConfig?.stripeSecretKey) return;

    const stripe = createStripeClient(sysConfig.stripeSecretKey);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
    const periodStart = sub.current_period_start ?? subscription.items.data[0]?.current_period_start;
    const periodEnd = sub.current_period_end ?? subscription.items.data[0]?.current_period_end;

    await admin.from('subscriptions').upsert(
      {
        user_id: resolvedUserId,
        plan_id: planId,
        status: subscription.status === 'active' ? 'active' : 'pending',
        stripe_subscription_id: subscriptionId,
        stripe_customer_id:
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
        stripe_checkout_session_id: session.id,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      },
      { onConflict: 'user_id' }
    );
  }
}

/**
 * Placeholder para lógica adicional post-pago (emails, CRM, etc.)
 */
export async function onCheckoutCompletedPlaceholder(session: Stripe.Checkout.Session) {
  // Ejemplo: enviar email de bienvenida, activar features premium, registrar en analytics
  console.info('[stripe-payments] checkout.session.completed', {
    sessionId: session.id,
    email: session.customer_email,
    mode: session.mode,
    planId: session.metadata?.planId,
  });
}
