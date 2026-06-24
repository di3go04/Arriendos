import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';

const PLAN_MAP: Record<string, { planId: string; name: string }> = {
  basico: { planId: '', name: 'Básico' },
  profesional: { planId: process.env.PAYPAL_PROFESIONAL_PLAN_ID || '', name: 'Profesional' },
  empresa: { planId: process.env.PAYPAL_EMPRESA_PLAN_ID || '', name: 'Empresa' },
};

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

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

    if (!planId || !PLAN_MAP[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PLAN_MAP[planId];

    // Plan gratuito
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

    // Planes pagos - crear suscripción PayPal
    if (!plan.planId) {
      // Si no hay plan ID configurado, crear suscripción manual
      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ).toISOString(),
      }, { onConflict: 'user_id' });

      if (subError) throw subError;
      return NextResponse.json({ success: true, planId, manual: true });
    }

    // Obtener token de acceso PayPal
    const accessToken = await getPayPalAccessToken();

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Crear suscripción en PayPal
    const subscriptionRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `sub-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: plan.planId,
        subscriber: {
          name: { given_name: profile?.full_name || 'Usuario' },
          email_address: profile?.email || user.email,
        },
        application_context: {
          brand_name: 'RentNow',
          locale: 'es-CO',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
          cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/precios?subscription=cancelled`,
        },
      }),
    });

    const subscriptionData = await subscriptionRes.json();

    if (!subscriptionRes.ok) {
      console.error('PayPal error:', subscriptionData);
      throw new Error(subscriptionData.message || 'Error al crear suscripción PayPal');
    }

    // Guardar suscripción en BD
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_id: planId,
      paypal_subscription_id: subscriptionData.id,
      status: subscriptionData.status === 'APPROVAL_PENDING' ? 'pending' : subscriptionData.status,
      current_period_start: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Devolver URLs de aprobación
    const approvalUrl = subscriptionData.links?.find((l: LooseValue) => l.rel === 'approve')?.href;

    return NextResponse.json({
      url: approvalUrl,
      subscriptionId: subscriptionData.id,
      status: subscriptionData.status,
    });
  } catch (error: unknown) {
    console.error('Error creating PayPal subscription:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al crear suscripción' },
      { status: 500 }
    );
  }
}