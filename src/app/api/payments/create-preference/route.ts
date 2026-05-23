import { PRICING } from '@/config/payments';
import { createPaymentPreference } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mercado Pago no esta configurado. Define MP_ACCESS_TOKEN.' },
        { status: 503 }
      );
    }

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

    const { planId, currency = 'USD' } = await req.json();

    if (!planId || !PRICING[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PRICING[planId];
    const amount = plan.prices[currency];

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Moneda no soportada' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/payments/webhook-mp`;

    const preference = await createPaymentPreference({
      planId,
      planName: plan.name,
      planDescription: plan.description,
      amount,
      currency,
      payerEmail: profile?.email || user.email,
      payerName: profile?.full_name || undefined,
      userId: user.id,
      returnUrl: appUrl,
      webhookUrl,
    });

    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      mp_preference_id: preference.id,
      status: 'pending',
      external_reference: JSON.stringify({ userId: user.id, planId, type: 'payment' }),
    });

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
    });
  } catch (error: unknown) {
    console.error('Error creating preference:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al crear preferencia de pago' },
      { status: 500 }
    );
  }
}
