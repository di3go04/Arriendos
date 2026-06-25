import { READINESS_ITEMS } from '@/config/readiness';
import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    mercadoPago: Boolean(process.env.MP_ACCESS_TOKEN),
    mercadoPagoWebhook: Boolean(process.env.MP_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    whatsappBridge: Boolean(process.env.WHATSAPP_BRIDGE_URL),
    vapid: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(
      process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
    ),
    stripeSiteUrl: Boolean(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    ),
    demoMode: process.env.DEMO_MODE === 'true',
  };

  const summary = READINESS_ITEMS.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { done: 0, needs_config: 0, manual: 0 }
  );

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    score: Math.round((summary.done / READINESS_ITEMS.length) * 100),
    summary,
    env,
    items: READINESS_ITEMS,
  });
}
