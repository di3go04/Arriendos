import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createDashboardAlertsService } from '@/modules/dashboard-alerts/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createDashboardAlertsService();
  const metrics = await svc.getMetrics(user.id);
  return NextResponse.json({ ok: true, data: metrics });
}
