import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createMarketingService } from '@/modules/ai-marketing/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { propertyId, platform } = await req.json();
  if (!propertyId) return NextResponse.json({ error: 'propertyId requerido' }, { status: 400 });

  const svc = createMarketingService();

  if (platform) {
    const result = await svc.generateSocialPost(propertyId, platform);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const result = await svc.generatePropertyContent(propertyId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
