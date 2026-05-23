import { getMercadoPagoPublicKey, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { NextResponse } from 'next/server';

export async function GET() {
  const configured = isMercadoPagoConfigured();
  const publicKey = getMercadoPagoPublicKey();

  return NextResponse.json({
    configured,
    publicKey: publicKey || null,
    checkoutMode: publicKey && configured ? 'checkout_api' : configured ? 'checkout_pro' : 'disabled',
  });
}
