import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

const PLAN_PRICE_IDS: Record<string, string> = {
  basico: '', // free
  profesional: process.env.STRIPE_PROFESIONAL_PRICE_ID || '',
  empresa: process.env.STRIPE_EMPRESA_PRICE_ID || '',
};

export async function POST(req: Request) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { planId, returnUrl } = await req.json();

    if (!planId || !PLAN_PRICE_IDS[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // Plan gratuito - crear suscripción directamente
    if (planId === 'basico') {
      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          new Date().setFullYear(new Date().getFullYear() + 10)
        ).toISOString(),
      }, { onConflict: 'user_id' });

      if (subError) throw subError;

      return NextResponse.json({ success: true, planId: 'basico' });
    }

    // Planes pagos - crear Stripe Checkout Session
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLAN_PRICE_IDS[planId], quantity: 1 }],
      customer_email: profile?.email || user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, planId },
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/precios?subscription=cancelled`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al crear suscripción' },
      { status: 500 }
    );
  }
}