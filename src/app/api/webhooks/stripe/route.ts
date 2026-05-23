import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleStripeWebhook, isStripeConfigured } from '@/modules/stripe-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe con body crudo y validación de firma (STRIPE_WEBHOOK_SECRET).
 *
 * Configurar en Stripe Dashboard → Developers → Webhooks:
 *   URL: https://tu-dominio.com/api/webhooks/stripe
 *   Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 *
 * Desarrollo local: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe no configurado' }, { status: 503 });
    }

    const rawBody = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    const result = await handleStripeWebhook(rawBody, signature);

    if (!result.ok) {
      const status = result.error?.includes('Firma') ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ received: true, type: result.eventType });
  } catch (error: unknown) {
    console.error('[POST /api/webhooks/stripe]', error);
    const message = error instanceof Error ? error.message : 'Error en webhook';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
