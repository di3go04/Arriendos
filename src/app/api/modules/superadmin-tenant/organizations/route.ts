import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSuperadminTenantService } from '@/modules/superadmin-tenant/service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Solo admin' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const svc = createSuperadminTenantService();
  return NextResponse.json(await svc.listOrganizations());
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { orgId, maxProperties, maxUsers, plan } = await req.json();
  const svc = createSuperadminTenantService();
  return NextResponse.json(
    await svc.updateOrgLimits(orgId, { maxProperties, maxUsers, plan })
  );
}
