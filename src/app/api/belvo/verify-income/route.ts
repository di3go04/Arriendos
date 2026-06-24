import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // In production: call Belvo API to retrieve income data
    // const belvo = new Belvo(process.env.BELVO_SECRET_ID!, process.env.BELVO_SECRET_PASSWORD!, 'sandbox')
    // const incomes = await belvo.incomes.retrieve(linkId)
    // const transactions = await belvo.transactions.retrieve(linkId, dateFrom, dateTo)

    // Simulate income verification response
    const incomeData = {
      monthlyIncome: 4500000,
      incomeCurrency: 'COP',
      employment: 'Empleado',
      verified: true,
      scoreData: {
        debtToIncome: 0.28,
        averageBalance: 1200000,
        paymentHistory: 'good',
      },
    }

    // Save to database
    await prisma.incomeVerification.create({
      data: {
        linkId: 'belvo_link_' + Math.random().toString(36).slice(2),
        verified: true,
        monthlyIncome: incomeData.monthlyIncome,
        incomeCurrency: incomeData.incomeCurrency,
        employment: incomeData.employment,
        scoreData: incomeData.scoreData,
      },
    })

    return NextResponse.json({ ok: true, data: incomeData })
  } catch (error) {
    console.error('Error verifying income:', error)
    return NextResponse.json({ error: 'Error al verificar ingresos' }, { status: 500 })
  }
}
