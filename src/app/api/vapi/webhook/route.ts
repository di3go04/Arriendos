import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookRequest } from '@/lib/webhook-signature'

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || ''

export async function POST(req: Request) {
  const { valid, body: parsed, response } = await verifyWebhookRequest(req, VAPI_WEBHOOK_SECRET, {
    headerName: 'x-vapi-signature',
  })
  if (!valid) return response

  try {
    const body = parsed as Record<string, unknown>
    const { callSid, status, duration, recordingUrl, outcome, promisedAmount, promisedDate, phoneNumber } = body as {
      callSid?: string
      status?: string
      duration?: number
      recordingUrl?: string
      outcome?: string
      promisedAmount?: number
      promisedDate?: string
      phoneNumber?: string
      contractId?: string
    }

    if (callSid) {
      await prisma.vapiCall.updateMany({
        where: { callSid },
        data: {
          status: status || 'completed',
          duration: duration || 0,
          recordingUrl: recordingUrl || null,
          outcome: outcome || null,
          promisedAmount: promisedAmount || null,
          promisedDate: promisedDate ? new Date(promisedDate) : null,
        },
      })
    }

    if (phoneNumber && outcome) {
      const tenant = await prisma.tenant.findFirst({
        where: { phone: { contains: phoneNumber.slice(-10) } },
      })

      if (tenant) {
        await prisma.voiceCallLog.create({
          data: {
            type: 'inbound',
            status: status || 'completed',
            duration: duration || 0,
            notes: outcome ? `Resultado: ${outcome}. Monto comprometido: ${promisedAmount || 'N/A'}` : null,
            contractId: (body.contractId as string) || 'unknown',
            tenantId: tenant.id,
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing Vapi webhook:', error)
    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 })
  }
}
