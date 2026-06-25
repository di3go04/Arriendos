import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generateContractFromTemplate } from '@/modules/ai-contracts/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { countryCode, templateHtml, variables } = await req.json();
  if (!countryCode || !templateHtml) {
    return NextResponse.json({ error: 'countryCode y templateHtml requeridos' }, { status: 400 });
  }

  const result = await generateContractFromTemplate({
    countryCode,
    templateHtml,
    variables: variables || {},
    userId: user.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });

  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (adminKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, adminKey);
    const { error: logErr } = await admin.from('ai_generation_logs').insert({
      user_id: user.id,
      country_code: countryCode,
      estimated_tokens: result.log.estimatedTokens,
      estimated_cost_usd: result.log.estimatedCostUsd,
      model: result.log.model,
    });
    if (logErr) console.warn('[ai-contracts] log', logErr.message);
  }

  return NextResponse.json({ content: result.content, log: result.log });
}
