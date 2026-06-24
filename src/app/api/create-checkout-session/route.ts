import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

const SANDBOX_PLANS: Record<string, { name: string; amount: number }> = {
  'price_profesional_sandbox': { name: 'Profesional', amount: 2900 },
  'price_empresa_sandbox': { name: 'Empresa', amount: 5900 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, userId, mode } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // Sandbox fallback: return mock success URL when no real Stripe key or dummy priceId
    const stripe = getStripe();
    if (!stripe) {
      const plan = SANDBOX_PLANS[priceId];
      if (!plan) {
        return NextResponse.json({ error: 'Stripe no configurado y priceId no reconocido' }, { status: 400 });
      }
      return NextResponse.json({
        sessionId: 'cs_sandbox',
        url: `/dashboard/success?session_id=cs_sandbox&plan=${plan.name}`,
      });
    }

    // Auto-create prices for sandbox dummy IDs
    let resolvedPriceId = priceId;
    if (SANDBOX_PLANS[priceId]) {
      const plan = SANDBOX_PLANS[priceId];
      try {
        const product = await stripe.products.create({
          name: `RentNow ${plan.name} (Sandbox)`,
          description: `Plan ${plan.name} - Modo de prueba`,
        });
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.amount,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        resolvedPriceId = price.id;
      } catch {
        return NextResponse.json({ error: 'Error al crear precio sandbox en Stripe' }, { status: 500 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: mode === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription`,
      metadata: { userId, plan: SANDBOX_PLANS[priceId]?.name || 'custom' },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    console.error('Checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}