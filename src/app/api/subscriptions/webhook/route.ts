import { createServerClient } from '@supabase/ssr';
import { cookies,headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 });
  }

  try {
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');
    if (!sig) return NextResponse.json({ error: 'Firma faltante' }, { status: 400 });

    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 500 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error en webhook de suscripciones:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  if (!userId || !planId) return;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options));
        },
      },
    }
  );

  const stripe = getStripe();
  if (!stripe) return;

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subData = subscription as LooseRecord;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: session.customer as string,
    status: subData.status === 'active' ? 'active' : 'incomplete',
    current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subData.cancel_at_period_end || false,
  }, { onConflict: 'user_id' });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const stripe = getStripe();
  if (!stripe) return;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options));
        },
      },
    }
  );

  const subData = subscription as LooseRecord;
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };

  await supabase.from('subscriptions').update({
    status: statusMap[subData.status] || subData.status,
    current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subData.cancel_at_period_end || false,
  }).eq('stripe_subscription_id', subscription.id);
}