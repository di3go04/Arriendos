import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createEsgService } from '@/modules/esg-sustainability/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createEsgService();
  const report = await svc.getPortfolioReport(user.id);
  return NextResponse.json({ ok: true, data: report });
}
