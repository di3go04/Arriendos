import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSuperadminTenantService } from '@/modules/superadmin-tenant/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId requerido' }, { status: 400 });

  const svc = createSuperadminTenantService();
  return NextResponse.json(await svc.createImpersonationToken(user.id, targetUserId));
}
