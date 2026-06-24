import { NextResponse } from 'next/server';
import { verifyWebhookRequest } from '@/lib/webhook-signature';

const WEBHOOK_SECRET = process.env.WEBHOOK_RECEIVE_SECRET || '';

export async function POST(req: Request) {
  const { valid, body, response } = await verifyWebhookRequest(req, WEBHOOK_SECRET, {
    headerName: 'x-webhook-signature',
  });
  if (!valid) return response;

  const payload = body as Record<string, unknown>;
  const event = (payload?.event || payload?.type || 'unknown') as string;

  console.log(`[Webhook] Received ${event}:`, JSON.stringify(payload).slice(0, 200));

  return NextResponse.json({
    received: true,
    event,
    timestamp: new Date().toISOString(),
  });
}
