import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit-redis'

const querySchema = z.object({
  institution: z.string().min(1).default('erebor_retail'),
})

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const institutionParam = searchParams.get('institution') || undefined
    
    // Validate request query parameters using Zod
    const validation = querySchema.safeParse({ institution: institutionParam })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { institution } = validation.data

    // In production, instantiate Belvo and call:
    // const belvo = new Belvo(process.env.BELVO_SECRET_ID!, process.env.BELVO_SECRET_PASSWORD!, 'sandbox')
    // const link = await belvo.links.create({ institution, username: 'user', password: 'pass' })
    const mockLinkToken = 'belvo_link_token_placeholder_' + Math.random().toString(36).slice(2)

    return NextResponse.json({
      ok: true,
      linkToken: mockLinkToken,
      institution,
    })
  } catch (error) {
    console.error('Error in Belvo Link Token route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al generar el token' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(handler, 10, 60_000)

