import { isStripeConfigured, getStripeRuntimeMode } from '@/modules/stripe-payments/config';
import { NextResponse } from 'next/server';

export async function GET() {
  const configured = isStripeConfigured();
  return NextResponse.json({
    configured,
    configSource: configured ? getStripeRuntimeMode() : null,
  });
}

export async function POST(request: Request) {
  const { provider, amount, currency } = await request.json();

  try {
    const { paymentFactory } = await import('@/lib/payment/factory');
    paymentFactory.setProvider(provider);
    const adapter = paymentFactory.getAdapter();
    const { clientSecret, paymentIntentId, success } = await adapter.createPaymentIntent(amount, currency);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Payment failed' }, { status: 400 });
    }

    return NextResponse.json({ clientSecret, paymentIntentId });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
