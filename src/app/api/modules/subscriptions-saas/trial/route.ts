import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSubscriptionsSaasService } from '@/modules/subscriptions-saas';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { planId, trialDays } = await req.json();
  if (!planId) return NextResponse.json({ error: 'planId requerido' }, { status: 400 });

  const svc = createSubscriptionsSaasService();
  const result = await svc.startTrial(user.id, planId, trialDays);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
