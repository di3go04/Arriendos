import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createDashboardAlertsService } from '@/modules/dashboard-alerts/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createDashboardAlertsService();
  const alerts = await svc.getActiveAlerts(user.id);
  return NextResponse.json({ ok: true, data: alerts });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { alertId } = await req.json();
  if (!alertId) return NextResponse.json({ error: 'alertId requerido' }, { status: 400 });

  const svc = createDashboardAlertsService();
  await svc.markAlertRead(alertId, user.id);
  return NextResponse.json({ ok: true });
}
