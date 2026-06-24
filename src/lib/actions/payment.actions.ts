'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

export async function createPaymentIntent(paymentId: string, amount: number) {
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
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar que el pago pertenezca al usuario
    const { data: payment } = await supabase
      .from('payments')
      .select('*, contract:contracts!inner(landlord_id, tenant_id)')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    const contract = payment as LooseRecord;
    if (contract.contract.landlord_id !== user.id && contract.contract.tenant_id !== user.id) {
      return { success: false, error: 'No tiene permisos sobre este pago' };
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'cop',
      metadata: {
        paymentId,
        userId: user.id,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    return { success: false, error: (error as { message?: string }).message };
  }
}
