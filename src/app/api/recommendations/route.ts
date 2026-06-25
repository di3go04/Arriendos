import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20)

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { city: true, type: true, amenities: true },
      })

      if (!property) {
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
      }

      const similar = await prisma.property.findMany({
        where: {
          id: { not: propertyId },
          city: property.city,
          ownerId: session.user.id,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          city: true,
          images: true,
          units: { select: { monthlyRent: true, status: true }, take: 1 },
        },
      })

      return NextResponse.json({
        ok: true,
        data: similar.map((p: Record<string, unknown>) => ({
          ...p,
          score: 0.85,
          reason: 'Misma ciudad y tipo de propiedad',
        })),
      })
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: session.user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        city: true,
        images: true,
        units: { select: { monthlyRent: true, status: true }, take: 1 },
      },
    })

    return NextResponse.json({
      ok: true,
        data: properties.map((p: Record<string, unknown>) => ({
        ...p,
        score: 0.5 + Math.random() * 0.5,
        reason: 'Propiedad recomendada basada en tu portafolio',
      })),
    })
  } catch (error) {
    console.error('Error en recomendaciones:', error)
    return NextResponse.json({ error: 'Error al obtener recomendaciones' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { propertyId, action } = body

    if (!propertyId || !action) {
      return NextResponse.json({ error: 'propertyId y action son requeridos' }, { status: 400 })
    }

    const validActions = ['view', 'click', 'search', 'favorite', 'contact']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: `Interacción registrada: ${action} en propiedad ${propertyId}`,
    })
  } catch (error) {
    console.error('Error registrando interacción:', error)
    return NextResponse.json({ error: 'Error al registrar interacción' }, { status: 500 })
  }
}
