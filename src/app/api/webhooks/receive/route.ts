import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.event || body.type || 'unknown';

    console.log(`[Webhook] Received ${event}:`, JSON.stringify(body).slice(0, 200));

    return NextResponse.json({
      received: true,
      event,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
