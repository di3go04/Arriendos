import { PRICING } from '@/config/payments';
import { createPaymentPreference } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
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

    // 2. Obtener datos del plan y moneda
    const { planId, currency = 'USD' } = await req.json();
    
    if (!planId || !PRICING[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PRICING[planId];
    const amount = plan.prices[currency];
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Moneda no soportada para este plan' }, { status: 400 });
    }

    // 3. Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // 4. Crear preferencia en Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/payments/webhook`;

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

    // 5. Guardar referencia de pago en Supabase
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      mp_preference_id: preference.id,
      status: 'pending',
      external_reference: JSON.stringify({ userId: user.id, planId }),
    });

    // 6. Devolver URL de checkout
    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
    });
  } catch (error: unknown) {
    console.error('Error creating Mercado Pago preference:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}