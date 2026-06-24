import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createReasService } from '@/modules/reas-service/service';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { subscriptionId, action } = await req.json();
  if (!subscriptionId || !['pause', 'resume'].includes(action)) {
    return NextResponse.json({ error: 'subscriptionId y action (pause|resume) requeridos' }, { status: 400 });
  }

  const svc = createReasService();
  const result = action === 'pause'
    ? await svc.pauseSubscription(subscriptionId, user.id)
    : await svc.resumeSubscription(subscriptionId, user.id);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
