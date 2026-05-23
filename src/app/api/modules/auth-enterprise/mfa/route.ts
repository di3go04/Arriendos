import { createSupabaseServerClient } from '@/lib/supabase-server';
import { enrollTotp, getMfaStatus, verifyTotpEnrollment } from '@/modules/auth-enterprise';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const status = await getMfaStatus(user.id);
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { action, factorId, code } = await req.json();

  if (action === 'enroll') {
    return NextResponse.json(await enrollTotp());
  }
  if (action === 'verify' && factorId && code) {
    return NextResponse.json(await verifyTotpEnrollment(factorId, code));
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}
