import { mercadopagoClient,verifyWebhookSignature } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { Payment,PreApproval } from 'mercadopago';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

function mapMPStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    approved: 'approved',
    authorized: 'approved',
    in_process: 'pending',
    pending: 'pending',
    rejected: 'rejected',
    refunded: 'refunded',
    cancelled: 'cancelled',
    charged_back: 'disputed',
  };
  return map[mpStatus] || 'unknown';
}

async function handlePaymentNotification(paymentId: string) {
  if (process.env.NODE_ENV === 'test') return;

  const payment = new Payment(mercadopagoClient);
  const paymentData = await payment.get({ id: paymentId }) as LooseRecord;
  if (!paymentData) return;

  let externalRef: { userId?: string; planId?: string } = {};
  try { externalRef = JSON.parse(paymentData.external_reference || '{}'); } catch { console.warn('Webhook MP: fallo al parsear external_reference en payment'); }

  const { userId, planId } = externalRef;
  if (!userId) return;

  const supabase = await getSupabase();
  const internalStatus = mapMPStatus(paymentData.status);

  await supabase.from('payment_transactions').upsert({
    user_id: userId,
    plan_id: planId || 'unknown',
    amount: paymentData.transaction_amount,
    currency: paymentData.currency_id,
    mp_payment_id: String(paymentId),
    mp_status: paymentData.status,
    mp_status_detail: paymentData.status_detail,
    status: internalStatus,
    paid_at: internalStatus === 'approved' ? new Date().toISOString() : null,
  }, { onConflict: 'mp_payment_id' });

  if (internalStatus === 'approved' && planId) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      mp_payment_id: String(paymentId),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'user_id' });

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Pago confirmado',
      message: `Tu pago por el plan ${planId} fue procesado exitosamente.`,
      type: 'success',
    });

    if (resend) {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('email, full_name').eq('id', userId).single();
        if (profile?.email) {
          await resend.emails.send({
            from: 'RentNow <noreply@rentnow.app>',
            to: profile.email,
            subject: 'Pago confirmado - RentNow',
            html: `<div style="font-family:sans-serif;padding:20px"><h2>Pago Confirmado</h2>
              <p>Hola ${profile.full_name || 'usuario'},</p>
              <p>Tu pago fue procesado exitosamente.</p>
              <p>Plan: ${planId}<br/>ID: ${paymentId}</p></div>`,
          });
        }
      } catch (e) { console.error('Webhook MP: error al enviar email de pago confirmado', e); }
    }
  }
}

async function handlePreapprovalNotification(preapprovalId: string) {
  if (process.env.NODE_ENV === 'test') return;

  const preapproval = new PreApproval(mercadopagoClient);
  const data = await preapproval.get({ id: preapprovalId }) as LooseRecord;
  if (!data) return;

  let externalRef: { userId?: string; planId?: string } = {};
  try { externalRef = JSON.parse(data.external_reference || '{}'); } catch { console.warn('Webhook MP: fallo al parsear external_reference en preapproval'); }

  const { userId, planId } = externalRef;
  if (!userId || !planId) return;

  const supabase = await getSupabase();
  const mpStatus = data.status || '';

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

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Suscripción activada',
      message: `Tu suscripción al plan ${planId} está activa.`,
      type: 'success',
    });

    if (resend) {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('email, full_name').eq('id', userId).single();
        if (profile?.email) {
          await resend.emails.send({
            from: 'RentNow <noreply@rentnow.app>',
            to: profile.email,
            subject: 'Suscripción activada - RentNow',
            html: `<div style="font-family:sans-serif;padding:20px"><h2>Suscripción Activada</h2>
              <p>Hola ${profile.full_name || 'usuario'},</p>
              <p>Tu suscripción al plan ${planId} está activa.</p></div>`,
          });
        }
      } catch (e) { console.error('Webhook MP: error al enviar email de suscripcion', e); }
    }
  }

  if (mpStatus === 'cancelled') {
    await supabase.from('subscriptions').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('mp_preapproval_id', preapprovalId);
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    // FAIL-CLOSED: si MP_WEBHOOK_SECRET no está definido, rechazar SIEMPRE.
    // Esto evita webhook spoofing si la env var se cae accidentalmente.
    if (!process.env.MP_WEBHOOK_SECRET) {
      console.error('Webhook MP: MP_WEBHOOK_SECRET no configurado — rechazando por seguridad (fail-closed)');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 503 }
      );
    }

    const signatureIsValid = verifyWebhookSignature(bodyText, xSignature, xRequestId);
    if (!signatureIsValid) {
      console.warn('Webhook MP: firma invalida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const { type, data } = body;

    if (type === 'payment') {
      if (data?.id) await handlePaymentNotification(data.id);
    } else if (type === 'preapproval' || type === 'subscription_preapproval') {
      if (data?.id) await handlePreapprovalNotification(data.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error en webhook-mp:', (error as { message?: string }).message);
    return NextResponse.json({ received: true });
  }
}
