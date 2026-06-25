import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createEsgService } from '@/modules/esg-sustainability/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const svc = createEsgService();
  const result = await svc.calculateScore(body.propertyId, body.energyKwh, body.waterM3, body.wasteKg, body.certification || 'ninguna');
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  if (!propertyId) return NextResponse.json({ error: 'propertyId requerido' }, { status: 400 });

  const svc = createEsgService();
  const score = await svc.getScore(propertyId);
  if (!score) return NextResponse.json({ ok: false, error: 'Sin evaluación ESG' }, { status: 404 });
  return NextResponse.json({ ok: true, data: score });
}
