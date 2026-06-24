import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createReconciliationService } from '@/modules/reconciliation/service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bankAccountId = searchParams.get('bankAccountId');
  if (!bankAccountId) return NextResponse.json({ error: 'bankAccountId requerido' }, { status: 400 });

  const svc = createReconciliationService();
  const matches = await svc.matchPayments(bankAccountId);
  return NextResponse.json({ ok: true, data: matches });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });

  const svc = createReconciliationService();
  await svc.confirmMatch(matchId);
  return NextResponse.json({ ok: true });
}
