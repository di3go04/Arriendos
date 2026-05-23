import { createWhatsappAutomationService } from '@/modules/whatsapp-automation/service';
import { NextResponse } from 'next/server';

/** Cron o admin — procesa cola WhatsApp */
export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const svc = createWhatsappAutomationService();
  const result = await svc.processPending();
  return NextResponse.json(result);
}
