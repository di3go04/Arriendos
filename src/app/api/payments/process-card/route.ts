import { PRICING } from '@/config/payments';
import { createCardPayment } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mercado Pago no está configurado (MP_ACCESS_TOKEN).' },
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

    const body = await req.json();
    const {
      planId,
      currency = 'USD',
      token,
      paymentMethodId,
      issuerId,
      installments = 1,
      payerIdentification,
    } = body;

    if (!token || !paymentMethodId) {
      return NextResponse.json({ error: 'token y paymentMethodId requeridos' }, { status: 400 });
    }

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
    const externalReference = JSON.stringify({ userId: user.id, planId, type: 'card_payment' });

    const payment = await createCardPayment({
      token,
      paymentMethodId,
      issuerId,
      installments: Number(installments) || 1,
      amount,
      currency,
      description: `RentNow - ${plan.name}`,
      payerEmail: profile?.email || user.email || '',
      payerIdentification,
      externalReference,
      notificationUrl: `${appUrl}/api/payments/webhook-mp`,
    });

    const status = payment.status === 'approved' ? 'approved' : 'pending';

    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      mp_payment_id: String(payment.id),
      status,
      mp_status: payment.status,
      external_reference: externalReference,
    });

    if (payment.status === 'approved') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'user_id' });
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });
  } catch (error: unknown) {
    console.error('process-card error:', error);
    const mpError = error as { message?: string; cause?: { message?: string } };
    return NextResponse.json(
      { error: mpError.cause?.message || mpError.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
