import { createAuthEnterpriseService } from '@/modules/auth-enterprise';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 });

  const auth = createAuthEnterpriseService();
  const result = await auth.requestPasswordReset(email);
  return NextResponse.json(result);
}
