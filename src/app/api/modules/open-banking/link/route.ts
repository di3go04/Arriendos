import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createOpenBankingService } from '@/modules/open-banking/service';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createOpenBankingService();
  const result = await svc.createLink(user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createOpenBankingService();
  const score = await svc.getSolvencyStatus(user.id);
  if (!score) return NextResponse.json({ ok: false, error: 'Sin evaluación de solvencia' }, { status: 404 });
  return NextResponse.json({ ok: true, data: score });
}
