import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSuperadminTenantService } from '@/modules/superadmin-tenant/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 });

  const svc = createSuperadminTenantService();
  return NextResponse.json(await svc.globalMetrics());
}
