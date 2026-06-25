import { NextResponse } from 'next/server';
import { createOpenBankingService } from '@/modules/open-banking/service';
import { verifyWebhookRequest } from '@/lib/webhook-signature';

const BELVO_WEBHOOK_SECRET = process.env.BELVO_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const { valid, body: payload, response } = await verifyWebhookRequest(req, BELVO_WEBHOOK_SECRET, {
    headerName: 'x-belvo-signature',
  });
  if (!valid) return response;

  const svc = createOpenBankingService();
  const result = await svc.processWebhook(payload as Record<string, unknown>);

  if (result.ok && (payload as Record<string, unknown>).link) {
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabase = await createSupabaseServerClient();
    const { data: linkData } = await supabase
      .from('open_banking_links')
      .select('user_id')
      .eq('belvo_link_id', (payload as Record<string, unknown>).link as string)
      .maybeSingle();

    if (linkData?.user_id) {
      await svc.evaluateSolvency(linkData.user_id, (payload as Record<string, unknown>).link as string);
    }
  }

  return NextResponse.json({ received: true });
}
