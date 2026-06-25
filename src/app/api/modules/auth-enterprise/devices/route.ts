import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAuthEnterpriseService } from '@/modules/auth-enterprise';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const fp = req.nextUrl.searchParams.get('fingerprint') || undefined;
  const auth = createAuthEnterpriseService();
  const result = await auth.listDevices(user.id, fp);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { deviceId } = await req.json();
  if (!deviceId) return NextResponse.json({ error: 'deviceId requerido' }, { status: 400 });

  const auth = createAuthEnterpriseService();
  const result = await auth.revokeDevice(user.id, deviceId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
