import { createAuthEnterpriseService } from '@/modules/auth-enterprise';
import { NextResponse } from 'next/server';

function metaFromRequest(req: Request, body: Record<string, unknown>) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
    fingerprint: (body.fingerprint as string) || null,
    email: (body.email as string) || null,
  };
}

/** Adapter HTTP — delega en módulo auth-enterprise */
export async function POST(req: Request) {
  const body = await req.json();
  const { action, email, userId } = body as {
    action: 'check' | 'failure' | 'success';
    email?: string;
    userId?: string;
    fingerprint?: string;
  };

  const auth = createAuthEnterpriseService();
  const meta = metaFromRequest(req, body);

  if (action === 'check' && email) {
    const result = await auth.checkLoginAllowed(email, meta);
    return NextResponse.json(result);
  }

  if (action === 'failure' && email) {
    const result = await auth.recordLoginFailure(email, meta);
    return NextResponse.json(result);
  }

  if (action === 'success' && userId) {
    const result = await auth.recordLoginSuccess(userId, meta);
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: false, error: 'Acción inválida' }, { status: 400 });
}
