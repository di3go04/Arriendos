import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createWhatsappAutomationService } from '@/modules/whatsapp-automation/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { phone, templateKey, variables } = await req.json();
  if (!phone || !templateKey) {
    return NextResponse.json({ error: 'phone y templateKey requeridos' }, { status: 400 });
  }

  const svc = createWhatsappAutomationService();
  const result = await svc.enqueue(phone, templateKey, variables || {}, user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
