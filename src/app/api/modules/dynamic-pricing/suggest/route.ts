import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createDynamicPricingService } from '@/modules/dynamic-pricing/service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createDynamicPricingService();

  if (propertyId) {
    const result = await svc.suggestPrice(propertyId);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const batch = await svc.batchSuggestPrices(user.id);
  return NextResponse.json({ ok: true, data: batch });
}
