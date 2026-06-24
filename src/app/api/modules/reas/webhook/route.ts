import { NextResponse } from 'next/server';
import { createReasService } from '@/modules/reas-service/service';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_REAS;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    const event = stripe.webhooks.constructEvent(rawBody, signature || '', webhookSecret);

    const svc = createReasService();
    await svc.processStripeWebhook(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}
