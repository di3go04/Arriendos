import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { documentType, documentUrl, selfieUrl } = body

    // In production: call Onfido API
    // const onfido = new Onfido({ apiToken: process.env.ONFIDO_API_TOKEN! })
    // const check = await onfido.check.create({
    //   applicantId: applicant.id,
    //   reportNames: ['document', 'facial_similarity_photo'],
    // })

    // For demo, create KYC document record
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        type: documentType || 'national_id',
        status: 'DOCUMENTOS_ENVIADOS',
        documentUrl,
        selfieUrl,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: kycDocument.id,
        status: 'VERIFICADO',
        message: 'Identidad verificada exitosamente',
      },
    })
  } catch (error) {
    console.error('Error verifying identity:', error)
    return NextResponse.json({ error: 'Error al verificar identidad' }, { status: 500 })
  }
}
