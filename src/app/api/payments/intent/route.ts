import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(req: Request) {
  try {
    // Verificar autenticación
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

    // Obtener datos del pago
    const { paymentId, amount, currency = 'cop' } = await req.json();

    if (!paymentId || !amount) {
      return NextResponse.json(
        { error: 'Se requiere paymentId y amount' },
        { status: 400 }
      );
    }

    // Verificar que el pago pertenezca al usuario
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, contract:contracts!inner(landlord_id, tenant_id)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario tenga permisos sobre este pago
    const contract = payment as LooseRecord;
    if (contract.contract.landlord_id !== user.id && contract.contract.tenant_id !== user.id) {
      return NextResponse.json({ error: 'No tiene permisos sobre este pago' }, { status: 403 });
    }

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe trabaja en centavos
      currency,
      metadata: {
        paymentId,
        userId: user.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al iniciar el pago' },
      { status: 500 }
    );
  }
}
