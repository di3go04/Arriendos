import { NextRequest, NextResponse } from 'next/server';
import { createKycService } from '@/modules/kyc/service';
import { verifyWebhookRequest } from '@/lib/webhook-signature';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-redis';

const KYC_WEBHOOK_SECRET = process.env.KYC_WEBHOOK_SECRET || '';

// Zod schema for validating the incoming KYC Webhook payload structure
const webhookPayloadSchema = z.object({
  eventId: z.string().min(1),
  verificationId: z.string().min(1),
  status: z.enum(['completed', 'failed', 'pending']),
  createdAt: z.string().optional(),
});

async function handler(req: NextRequest) {
  try {
    const { valid, body: payload, response } = await verifyWebhookRequest(req, KYC_WEBHOOK_SECRET, {
      headerName: 'x-kyc-signature',
    });
    
    if (!valid || !response) {
      return response || NextResponse.json({ error: 'Firma de webhook no válida o inválida' }, { status: 401 });
    }

    // Validate the decoded payload body with Zod
    const validation = webhookPayloadSchema.safeParse(payload);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Payload de webhook incorrecto o mal formado', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const svc = createKycService();
    await svc.processWebhook(validation.data as Record<string, unknown>);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing KYC webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el webhook' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handler, 10, 60_000);

