import { checkWhatsAppBridgeHealth, isWhatsAppBridgeConfigured } from '@/lib/whatsapp';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  const start = Date.now();

  // Supabase
  try {
    const t0 = performance.now();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    await supabase.from('properties').select('id').limit(1);
    checks.database = { status: 'operational', latency: Math.round(performance.now() - t0) };
  } catch {
    checks.database = { status: 'degraded', error: 'Cannot connect to Supabase' };
  }

  // Resend
  if (process.env.RESEND_API_KEY) {
    checks.email = { status: 'operational', latency: 0 };
  } else {
    checks.email = { status: 'not_configured', error: 'RESEND_API_KEY not set' };
  }

  // Mercado Pago
  if (process.env.MP_ACCESS_TOKEN) {
    checks.payments = { status: 'operational', latency: 0 };
  } else {
    checks.payments = { status: 'not_configured', error: 'MP_ACCESS_TOKEN not set' };
  }

  // WhatsApp (Baileys bridge)
  if (isWhatsAppBridgeConfigured()) {
    const t0 = performance.now();
    const wa = await checkWhatsAppBridgeHealth();
    checks.whatsapp = wa.ok
      ? { status: 'operational', latency: Math.round(performance.now() - t0) }
      : { status: 'degraded', error: wa.error || 'Bridge no responde' };
  } else {
    checks.whatsapp = {
      status: 'not_configured',
      error: 'Define WHATSAPP_BRIDGE_URL y npm run whatsapp:bridge',
    };
  }

  const allOk = Object.values(checks).every(c => c.status === 'operational');
  const totalLatency = Date.now() - start;

  return NextResponse.json({
    status: allOk ? 'operational' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    latency: totalLatency,
    services: checks,
  });
}
