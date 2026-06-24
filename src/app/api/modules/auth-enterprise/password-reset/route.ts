import { createAuthEnterpriseService } from '@/modules/auth-enterprise';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-redis';

const requestSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
});

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request input with Zod
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const auth = createAuthEnterpriseService();
    const result = await auth.requestPasswordReset(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in password reset route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la solicitud de restablecimiento' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handler, 5, 60_000);

