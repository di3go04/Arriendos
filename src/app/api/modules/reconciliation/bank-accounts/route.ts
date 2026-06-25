import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createReconciliationService } from '@/modules/reconciliation/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single();
  if (!org) return NextResponse.json({ error: 'Sin organización' }, { status: 400 });

  const body = await req.json();
  const svc = createReconciliationService();
  const result = await svc.registerBankAccount(org.id, body.institution, body.accountNumber, body.accountName, body.belvoLinkId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
