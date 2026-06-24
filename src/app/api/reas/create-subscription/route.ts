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
    const { propertyId, planType, pricePerMonth, currency, minMonths } = body

    // In production: create Stripe subscription
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const subscription = await stripe.subscriptions.create({
    //   customer: customerId,
    //   items: [{ price: stripePriceId }],
    //   metadata: { propertyId, planType },
    // })

    const subscription = await prisma.subscription.create({
      data: {
        propertyId,
        planType: planType || 'flex_lease',
        status: 'active',
        pricePerMonth,
        currency: currency || 'COP',
        minMonths: minMonths || 3,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.planType,
        pricePerMonth: subscription.pricePerMonth,
        currency: subscription.currency,
        minMonths: subscription.minMonths,
      },
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }
}
