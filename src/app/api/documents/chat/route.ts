import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { answerDocumentQuestion } from '@/lib/openai'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { contractId, question } = body

    if (!contractId || !question) {
      return NextResponse.json({ error: 'contractId y question son requeridos' }, { status: 400 })
    }

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, ownerId: session.user.id },
      select: {
        id: true,
        title: true,
        contractData: true,
        monthlyRent: true,
        validFrom: true,
        validUntil: true,
        status: true,
        property: { select: { title: true } },
        tenant: { select: { name: true, email: true, phone: true } },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    const documentContext = [
      `Contrato: ${contract.title}`,
      `Propiedad: ${contract.property.title}`,
      `Inquilino: ${contract.tenant?.name || 'No asignado'}`,
      `Email: ${contract.tenant?.email || 'N/A'}`,
      `Teléfono: ${contract.tenant?.phone || 'N/A'}`,
      `Canon mensual: $${contract.monthlyRent?.toLocaleString() || 'N/A'}`,
      `Vigencia: ${contract.validFrom ? new Date(contract.validFrom).toLocaleDateString() : 'N/A'} - ${contract.validUntil ? new Date(contract.validUntil).toLocaleDateString() : 'N/A'}`,
      `Estado: ${contract.status}`,
      `Datos adicionales: ${JSON.stringify(contract.contractData || {})}`,
    ].join('\n')

    const response = await answerDocumentQuestion(documentContext, question)

    return NextResponse.json({
      ok: true,
      data: {
        answer: response,
        context: {
          contractId: contract.id,
          contractTitle: contract.title,
        },
      },
    })
  } catch (error) {
    console.error('Error en chat de documentos:', error)
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }
}
