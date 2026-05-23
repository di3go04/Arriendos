import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSubscriptionsSaasService } from '@/modules/subscriptions-saas';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createSubscriptionsSaasService();
  const sub = await svc.getSubscription(user.id);
  return NextResponse.json({ subscription: sub });
}
