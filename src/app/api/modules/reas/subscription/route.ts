import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createReasService } from '@/modules/reas-service/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const svc = createReasService();
  const result = await svc.createSubscription(user.id, {
    propertyId: body.propertyId,
    unitId: body.unitId,
    planType: body.planType,
    pricePerMonth: body.pricePerMonth,
    currency: body.currency,
    minMonths: body.minMonths,
    maxPauseMonths: body.maxPauseMonths,
    startDate: body.startDate,
    endDate: body.endDate,
    stripePriceId: body.stripePriceId,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createReasService();
  const subscriptions = await svc.getUserSubscriptions(user.id);
  return NextResponse.json({ ok: true, data: subscriptions });
}
