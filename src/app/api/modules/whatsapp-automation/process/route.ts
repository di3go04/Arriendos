import { createWhatsappAutomationService } from '@/modules/whatsapp-automation/service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-redis';

const headersSchema = z.object({
  'x-cron-secret': z.string().min(1, 'El secreto del cron es requerido'),
});

/** Cron o admin — procesa cola WhatsApp */
async function handler(req: NextRequest) {
  try {
    const cronSecretHeader = req.headers.get('x-cron-secret');
    
    // Validate request headers using Zod
    const validation = headersSchema.safeParse({ 'x-cron-secret': cronSecretHeader });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Encabezados de autorización inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 'x-cron-secret': secret } = validation.data;
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const svc = createWhatsappAutomationService();
    const result = await svc.processPending();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in WhatsApp process queue route:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la cola de WhatsApp' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handler, 10, 60_000);

