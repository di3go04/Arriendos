import { PRICING } from '@/config/payments';
import { createSubscriptionPreApproval } from '@/lib/mercadopago';
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

    // 1. Verificar autenticación
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

    // 2. Obtener datos del plan
    const { planId, currency = 'USD' } = await req.json();

    if (!planId || !PRICING[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PRICING[planId];
    const amount = plan.prices[currency];

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Moneda no soportada' }, { status: 400 });
    }

    // 3. Obtener perfil del usuario (email obligatorio para preapproval)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const payerEmail = profile?.email || user.email;
    if (!payerEmail) {
      return NextResponse.json({ error: 'Email requerido para suscripción' }, { status: 400 });
    }

    // 4. Crear suscripción recurrente en Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/payments/webhook-mp`;

    const preApproval = await createSubscriptionPreApproval({
      planName: plan.name,
      planDescription: plan.description,
      amount,
      currency,
      payerEmail,
      userId: user.id,
      returnUrl: appUrl,
      webhookUrl,
      frequency: 1,
      frequencyType: 'months',
    });

    // 5. Guardar referencia en Supabase
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      mp_preapproval_id: preApproval.id,
      status: 'pending',
      external_reference: JSON.stringify({ userId: user.id, planId, type: 'preapproval' }),
    });

    // 6. Devolver URL de aprobación (init_point de la suscripción)
    return NextResponse.json({
      init_point: preApproval.init_point,
      preapproval_id: preApproval.id,
    });
  } catch (error: unknown) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al crear suscripción' },
      { status: 500 }
    );
  }
}
