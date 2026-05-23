import { mercadopagoClient } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { Payment,PreApproval } from 'mercadopago';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Maneja notificaciones de preapproval (suscripciones recurrentes)
 */
async function handlePreapprovalNotification(body: LooseValue, data: LooseValue) {
  const preapprovalId = data?.id || data?.preapproval_id || body?.id;
  if (!preapprovalId) {
    return NextResponse.json({ received: true });
  }

  const preapproval = new PreApproval(mercadopagoClient);
  const preApprovalData = await preapproval.get({ id: preapprovalId }) as LooseRecord;

  if (!preApprovalData) {
    return NextResponse.json({ error: 'Preapproval no encontrado' }, { status: 404 });
  }

  // Extraer referencia externa
  let externalRef: { userId?: string; planId?: string } = {};
  try {
    externalRef = JSON.parse(preApprovalData.external_reference || '{}');
  } catch {}

  const userId = externalRef.userId;
  const planId = externalRef.planId;
  if (!userId || !planId) {
    return NextResponse.json({ error: 'Referencia inválida' }, { status: 400 });
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

  const mpStatus = preApprovalData.status || '';

  // Actualizar transacción
  await supabase.from('payment_transactions').update({
    status: mpStatus === 'authorized' ? 'approved' : mpStatus === 'cancelled' ? 'cancelled' : 'pending',
    mp_status: mpStatus,
    mp_preapproval_id: preapprovalId,
  }).eq('mp_preapproval_id', preapprovalId);

  if (mpStatus === 'authorized') {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      mp_preapproval_id: preapprovalId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'user_id' });

    // Notificación in-app
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Suscripción activada',
      message: `Tu suscripción al plan ${planId} está activa. Se renovará automáticamente cada mes.`,
      type: 'success',
    });

    // Email con Resend
    if (resend) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          await resend.emails.send({
            from: 'RentNow <noreply@rentnow.app>',
            to: profile.email,
            subject: 'Suscripción activada - RentNow',
            html: `<div style="font-family:sans-serif;padding:20px;max-width:600px;margin:auto">
              <h2 style="color:#1E3A5F;">¡Suscripción Activada!</h2>
              <p>Hola ${profile.full_name || 'usuario'},</p>
              <p>Tu suscripción al plan <strong>${planId}</strong> ha sido activada exitosamente.</p>
              <p>El cobro se realizará automáticamente cada mes.</p>
              <p>ID de suscripción: ${preapprovalId}</p>
            </div>`,
          });
        }
      } catch {}
    }
  }

  if (mpStatus === 'cancelled') {
    await supabase.from('subscriptions').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('mp_preapproval_id', preapprovalId);
  }

  return NextResponse.json({ received: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Manejar notificaciones de preapproval (suscripciones)
    if (type === 'preapproval' || type === 'subscription_preapproval' || type === 'subcription_preapproval') {
      return handlePreapprovalNotification(body, data);
    }

    // Solo procesar notificaciones de pago
    if (type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pago requerido' }, { status: 400 });
    }

    // Obtener detalles del pago desde Mercado Pago
    const payment = new Payment(mercadopagoClient);
    const paymentData = await payment.get({ id: paymentId }) as LooseRecord;

    if (!paymentData) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Extraer referencia externa (userId, planId)
    let externalRef: { userId?: string; planId?: string } = {};
    try {
      externalRef = JSON.parse(paymentData.external_reference || '{}');
    } catch {}

    const userId = externalRef.userId;
    const planId = externalRef.planId;

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Referencia inválida' }, { status: 400 });
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

    const mpStatus: string = paymentData.status || '';
    const mpStatusDetail: string = paymentData.status_detail || '';

    // Mapear estados
    const statusMap: Record<string, string> = {
      approved: 'approved',
      in_process: 'pending',
      pending: 'pending',
      rejected: 'rejected',
      refunded: 'refunded',
      cancelled: 'cancelled',
      charged_back: 'disputed',
    };
    const internalStatus = statusMap[mpStatus] || 'unknown';
    const mpPreferenceId: string = paymentData.preference_id?.toString() || '';

    // Actualizar transacción
    if (mpPreferenceId) {
      await supabase.from('payment_transactions').update({
        status: internalStatus,
        mp_payment_id: String(paymentId),
        mp_status: mpStatus,
        mp_status_detail: mpStatusDetail,
        paid_at: mpStatus === 'approved' ? new Date().toISOString() : null,
      }).eq('mp_preference_id', mpPreferenceId);
    }

    // Si el pago fue aprobado, activar suscripción
    if (mpStatus === 'approved') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        mp_payment_id: String(paymentId),
      }, { onConflict: 'user_id' });

      // Notificación in-app
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Pago confirmado',
        message: `Tu suscripción al plan ${planId} ha sido activada.`,
        type: 'success',
      });

      // Email con Resend
      if (resend) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          if (profile?.email) {
            await resend.emails.send({
              from: 'RentNow <noreply@rentnow.app>',
              to: profile.email,
              subject: 'Pago confirmado - RentNow',
              html: `<div style="font-family:sans-serif;padding:20px;max-width:600px;margin:auto">
                <h2 style="color:#1E3A5F;">Pago Confirmado</h2>
                <p>Hola ${profile.full_name || 'usuario'},</p>
                <p>Tu pago fue procesado exitosamente.</p>
                <p><strong>Plan:</strong> ${planId}<br/>
                <strong>ID:</strong> ${paymentId}</p>
              </div>`,
            });
          }
        } catch {}
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error en webhook MP:', (error as { message?: string }).message);
    return NextResponse.json({ received: true });
  }
}