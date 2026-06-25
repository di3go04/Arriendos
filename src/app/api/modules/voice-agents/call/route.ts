import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createVoiceAgentsService } from '@/modules/voice-agents/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const svc = createVoiceAgentsService();

  const result = await svc.initiateCollectionCall({
    tenantId: body.tenantId,
    tenantName: body.tenantName,
    tenantPhone: body.tenantPhone,
    propertyId: body.propertyId,
    contractId: body.contractId,
    debtAmount: body.debtAmount,
    daysOverdue: body.daysOverdue,
    dueDate: body.dueDate,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET() {
  const svc = createVoiceAgentsService();
  const script = svc.getCollectionScript();
  return NextResponse.json({ ok: true, script });
}
