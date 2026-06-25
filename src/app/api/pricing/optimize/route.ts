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
    const { propertyId, basePrice, occupancy, season } = body

    if (!propertyId || !basePrice) {
      return NextResponse.json({ error: 'propertyId y basePrice son requeridos' }, { status: 400 })
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { units: true, dynamicPrices: { orderBy: { createdAt: 'desc' }, take: 3 } },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const occupancyRate = occupancy ??
      (property.units.length > 0
        ? property.units.filter((u: any) => u.status === 'OCUPADO').length / property.units.length
        : 0.7)

    const seasonFactors: Record<string, number> = {
      alta: 1.25,
      media: 1.0,
      baja: 0.85,
      diciembre: 1.35,
      enero: 1.2,
      junio: 1.15,
      julio: 1.1,
      default: 1.0,
    }

    const seasonName = season || 'media'
    const seasonFactor = seasonFactors[seasonName] || seasonFactors.default

    const occupancyFactor = occupancyRate > 0.9 ? 1.15
      : occupancyRate > 0.7 ? 1.05
      : occupancyRate > 0.4 ? 0.95
      : 0.85

    const historicalAvg = property.dynamicPrices.length > 0
      ? property.dynamicPrices.reduce((sum: number, dp: { suggestedPrice: number }) => sum + dp.suggestedPrice, 0) / property.dynamicPrices.length
      : basePrice

    const trendFactor = historicalAvg > basePrice ? 1.05 : 0.95
    const confidence = 0.65 + (occupancyRate * 0.2) + (property.dynamicPrices.length > 0 ? 0.1 : 0)
    const factor = +(seasonFactor * occupancyFactor * trendFactor).toFixed(2)
    const suggestedPrice = Math.round(basePrice * factor)

    await prisma.dynamicPrice.create({
      data: {
        propertyId,
        basePrice,
        suggestedPrice,
        factor,
        season: seasonName,
        confidence: Math.min(confidence, 0.99),
      },
    })

    const analysis = []
    if (seasonFactor > 1) analysis.push(`Temporada ${seasonName}: +${Math.round((seasonFactor - 1) * 100)}%`)
    else if (seasonFactor < 1) analysis.push(`Temporada ${seasonName}: -${Math.round((1 - seasonFactor) * 100)}%`)

    if (occupancyFactor > 1) analysis.push(`Alta ocupación (${Math.round(occupancyRate * 100)}%): +${Math.round((occupancyFactor - 1) * 100)}%`)
    else if (occupancyFactor < 1) analysis.push(`Baja ocupación (${Math.round(occupancyRate * 100)}%): -${Math.round((1 - occupancyFactor) * 100)}%`)

    return NextResponse.json({
      ok: true,
      data: {
        basePrice,
        suggestedPrice,
        factor,
        confidence: Math.min(confidence, 0.99),
        season: seasonName,
        occupancyRate: Math.round(occupancyRate * 100),
        analysis,
        recommendation: factor > 1.1
          ? 'Aumentar precio — demanda alta'
          : factor < 0.9
            ? 'Reducir precio — demanda baja'
            : 'Mantener precio actual',
      },
    })
  } catch (error) {
    console.error('Error optimizando precio:', error)
    return NextResponse.json({ error: 'Error al optimizar precio' }, { status: 500 })
  }
}
