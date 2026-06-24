import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createRecommendationsService } from '@/modules/recommendations/service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const limit = parseInt(searchParams.get('limit') || '6');

  const svc = createRecommendationsService();

  if (propertyId) {
    const recommendations = await svc.getSimilarProperties(propertyId, limit);
    return NextResponse.json({ ok: true, data: recommendations });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const personalized = await svc.getPersonalizedRecommendations(user.id, limit);
  return NextResponse.json({ ok: true, data: personalized });
}
