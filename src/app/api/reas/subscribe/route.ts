import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subscribeSchema = z.object({
  propertyId: z.string().min(1, 'Propiedad requerida'),
  planType: z.enum(['flex_lease', 'premium_lease', 'full_lease']).default('flex_lease'),
  pricePerMonth: z.number().positive('Precio debe ser positivo'),
  currency: z.string().length(3).default('COP'),
  minMonths: z.number().int().min(1).max(24).default(3),
  tenantName: z.string().min(1, 'Nombre del inquilino requerido'),
  tenantEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  tenantPhone: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const { propertyId, planType, pricePerMonth, currency, minMonths, tenantName, tenantEmail, tenantPhone } = parsed.data

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: session.user.id },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { propertyId, status: 'active' },
    })

    if (existingSubscription) {
      return NextResponse.json({ error: 'Esta propiedad ya tiene una suscripción activa' }, { status: 409 })
    }

    let tenantId: string | undefined
    if (tenantName) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            ...(tenantEmail ? [{ email: tenantEmail }] : []),
            ...(tenantPhone ? [{ phone: tenantPhone }] : []),
          ],
        },
      })

      if (existingTenant) {
        tenantId = existingTenant.id
      } else {
        const newTenant = await prisma.tenant.create({
          data: {
            name: tenantName,
            email: tenantEmail || null,
            phone: tenantPhone || null,
          },
        })
        tenantId = newTenant.id
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        propertyId,
        planType,
        status: 'active',
        pricePerMonth,
        currency,
        minMonths,
        ownerId: session.user.id,
      },
    })

    if (planType === 'flex_lease') {
      await prisma.propertyUnit.create({
        data: {
          propertyId,
          label: `Coliving - ${tenantName}`,
          type: 'private_room',
          monthlyRent: pricePerMonth,
          currency,
          status: 'OCUPADO',
          amenities: ['wifi', 'agua', 'luz', 'limpieza'],
        },
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: subscription.id,
        propertyId: subscription.propertyId,
        planType: subscription.planType,
        status: subscription.status,
        pricePerMonth: subscription.pricePerMonth,
        currency: subscription.currency,
        minMonths: subscription.minMonths,
        tenantId,
        message: `Suscripción ${planType === 'flex_lease' ? 'Flex Lease' : planType === 'premium_lease' ? 'Premium Lease' : 'Full Lease'} creada exitosamente`,
      },
    })
  } catch (error) {
    console.error('Error creating REaaS subscription:', error)
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }
}
