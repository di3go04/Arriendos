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
    const { linkId } = body

    if (!linkId) {
      return NextResponse.json({ error: 'linkId es requerido' }, { status: 400 })
    }

    const belvoLink = await prisma.belvoLink.findUnique({
      where: { linkId },
      include: { incomeVerifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    if (!belvoLink) {
      return NextResponse.json({ error: 'Link de Belvo no encontrado' }, { status: 404 })
    }

    const incomeData = {
      monthlyIncome: Math.round(3000000 + Math.random() * 5000000),
      incomeCurrency: 'COP',
      employment: ['Empleado', 'Independiente', 'Pensionado', 'Empresario'][Math.floor(Math.random() * 4)],
      verified: Math.random() > 0.2,
      scoreData: {
        debtToIncome: +(Math.random() * 0.5).toFixed(2),
        averageBalance: Math.round(500000 + Math.random() * 3000000),
        paymentHistory: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)],
        totalTransactions: Math.floor(10 + Math.random() * 90),
        periodMonths: 6,
      },
    }

    const verification = await prisma.incomeVerification.create({
      data: {
        linkId,
        verified: incomeData.verified,
        monthlyIncome: incomeData.monthlyIncome,
        incomeCurrency: incomeData.incomeCurrency,
        employment: incomeData.employment,
        scoreData: incomeData.scoreData,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: verification.id,
        ...incomeData,
        score: incomeData.verified
          ? Math.round((1 - (incomeData.scoreData.debtToIncome / 1.5)) * 100)
          : 0,
        recommendation: incomeData.verified && incomeData.scoreData.debtToIncome < 0.35
          ? 'APROBADO'
          : incomeData.verified
            ? 'APROBADO_CONDICIONADO'
            : 'RECHAZADO',
      },
    })
  } catch (error) {
    console.error('Error fetching income data:', error)
    return NextResponse.json({ error: 'Error al obtener datos de ingresos' }, { status: 500 })
  }
}
