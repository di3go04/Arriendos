import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createVirtualToursService } from '@/modules/virtual-tours/service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  if (!propertyId) return NextResponse.json({ error: 'propertyId requerido' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createVirtualToursService();
  const tours = await svc.getToursByProperty(propertyId);

  const enriched = await Promise.all(tours.map(async (t) => {
    if (t.provider === 'matterport' && t.modelId) {
      const token = await svc.generateEmbedToken(t.modelId);
      return { ...t, embedToken: token };
    }
    return t;
  }));

  return NextResponse.json({ ok: true, data: enriched });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const svc = createVirtualToursService();
  const result = await svc.registerTour(body.propertyId, body.provider, body.modelId, body.embedUrl, body.thumbnailUrl);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
