import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TRANSCRIPTS = [
  {
    outcome: 'commitment' as const,
    transcript: [
      { speaker: 'IA', text: 'Hola, soy el asistente virtual de RentNow. Lo llamo para recordarle que su pago de canon de arrendamiento está pendiente.' },
      { speaker: 'IA', text: 'El valor pendiente es de $1,500,000 COP con vencimiento el 15 de este mes.' },
      { speaker: 'IA', text: '¿Le gustaría realizar el pago ahora, o prefiere comprometerse a una fecha?' },
      { speaker: 'Usuario', text: 'No puedo pagar hoy, pero me comprometo al 25 de este mes.' },
      { speaker: 'IA', text: 'Perfecto. He registrado tu compromiso de pago para el 25. Te enviaré un recordatorio por WhatsApp.' },
    ],
  },
  {
    outcome: 'payment' as const,
    transcript: [
      { speaker: 'IA', text: 'Hola, soy el asistente virtual de RentNow. Lo llamo para recordarle que su pago de canon de arrendamiento está pendiente.' },
      { speaker: 'IA', text: 'El valor pendiente es de $1,500,000 COP con vencimiento el 15 de este mes.' },
      { speaker: 'IA', text: '¿Le gustaría realizar el pago ahora, o prefiere comprometerse a una fecha?' },
      { speaker: 'Usuario', text: 'Sí, voy a pagar ahora mismo.' },
      { speaker: 'IA', text: 'Excelente. Te enviaré un enlace de pago por WhatsApp para que puedas realizar la transacción.' },
    ],
  },
  {
    outcome: 'escalate' as const,
    transcript: [
      { speaker: 'IA', text: 'Hola, soy el asistente virtual de RentNow. Lo llamo para recordarle que su pago de canon de arrendamiento está pendiente.' },
      { speaker: 'IA', text: 'El valor pendiente es de $1,500,000 COP con vencimiento el 15 de este mes.' },
      { speaker: 'IA', text: '¿Le gustaría realizar el pago ahora, o prefiere comprometerse a una fecha?' },
      { speaker: 'Usuario', text: 'Tengo problemas financieros, no puedo pagar este mes.' },
      { speaker: 'IA', text: 'Lamento los inconvenientes. Voy a escalar tu caso a un asesor humano que se comunicará contigo.' },
    ],
  },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { contractId } = body

    const scenario = TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)]
    const duration = Math.floor(30 + Math.random() * 180)
    const promisedAmount = scenario.outcome === 'payment' ? 1500000 : scenario.outcome === 'commitment' ? 1500000 : 0

    const call = await prisma.vapiCall.create({
      data: {
        contractId,
        callSid: 'vapi_' + Math.random().toString(36).slice(2),
        status: 'completed',
        duration,
        outcome: scenario.outcome,
        debtAmount: 1500000,
        promisedAmount,
        promisedDate: scenario.outcome === 'commitment'
          ? new Date(Date.now() + 7 * 86400000)
          : null,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        callId: call.id,
        callSid: call.callSid,
        duration,
        outcome: scenario.outcome,
      },
      transcript: scenario.transcript,
    })
  } catch (error) {
    console.error('Error starting Vapi call:', error)
    return NextResponse.json({ error: 'Error al iniciar llamada' }, { status: 500 })
  }
}
