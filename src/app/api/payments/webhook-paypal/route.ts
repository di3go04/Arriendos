import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyWebhookRequest } from '@/lib/webhook-signature';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
const PAYPAL_WEBHOOK_SECRET = process.env.PAYPAL_WEBHOOK_SECRET || '';

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
  // First pass: verify HMAC signature if configured
  if (PAYPAL_WEBHOOK_SECRET) {
    const { valid, body, response } = await verifyWebhookRequest(req, PAYPAL_WEBHOOK_SECRET, {
      headerName: 'x-paypal-webhook-signature',
    });
    if (!valid) return response;
    // Body already parsed — reconstruct for PayPal API verification below
    req = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(body),
    });
  }

  try {
    const body = await req.json();
    const headersList = req.headers;
    const webhookId = PAYPAL_WEBHOOK_ID;

    if (webhookId) {
      // Verificar webhook signature via PayPal API
      const accessToken = await getPayPalAccessToken();
      const verificationRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: headersList.get('PAYPAL-AUTH-ALGO') || '',
          cert_url: headersList.get('PAYPAL-CERT-URL') || '',
          transmission_id: headersList.get('PAYPAL-TRANSMISSION-ID') || '',
          transmission_sig: headersList.get('PAYPAL-TRANSMISSION-SIG') || '',
          transmission_time: headersList.get('PAYPAL-TRANSMISSION-TIME') || '',
          webhook_id: webhookId,
          webhook_event: body,
        }),
      });
      
      const verificationData = await verificationRes.json();
      if (verificationData.verification_status !== 'SUCCESS') {
        console.error('PayPal webhook verification failed');
        return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
      }
    }

    const eventType = body.event_type;
    console.log('PayPal webhook event:', eventType);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(body);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(body);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(body);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        // Pago único aprobado
        break;

      default:
        console.log(`Evento PayPal no manejado: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error en webhook PayPal:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}

async function handleSubscriptionActivated(body: LooseRecord) {
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

  const resource = body.resource;
  const subscriptionId = resource.id;
  const subscriberEmail = resource.subscriber?.email_address;

  // Buscar usuario por email de PayPal
  if (subscriberEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', subscriberEmail)
      .single();

    if (profile) {
      await supabase.from('subscriptions').upsert({
        user_id: profile.id,
        paypal_subscription_id: subscriptionId,
        status: 'active',
        plan_id: resource.plan_id || 'profesional',
        current_period_start: resource.start_time || new Date().toISOString(),
        current_period_end: resource.billing_info?.next_billing_time || '',
      }, { onConflict: 'user_id' });
    }
  }
}

async function handleSubscriptionCancelled(body: LooseRecord) {
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

  const subscriptionId = body.resource?.id;
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('paypal_subscription_id', subscriptionId);
  }
}

async function handlePaymentCompleted(body: LooseRecord) {
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

  const resource = body.resource;
  // resource es un sale object de PayPal
  // Buscar subscription bounty
  const billingAgreementId = resource.billing_agreement_id;

  if (billingAgreementId) {
    // Actualizar período de la suscripción
    await supabase
      .from('subscriptions')
      .update({
        current_period_end: resource.create_time
          ? new Date(new Date(resource.create_time).setMonth(new Date(resource.create_time).getMonth() + 1)).toISOString()
          : '',
        status: 'active',
      })
      .eq('paypal_subscription_id', billingAgreementId);
  }
}