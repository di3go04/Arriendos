import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: rawInvoices } = await supabase
      .from('payments')
      .select('id, amount, status, paid_at')
      .eq('tenant_id', user.id)
      .order('paid_at', { ascending: false })
      .limit(12);

    const invoices = (rawInvoices || []).map(inv => ({
      id: inv.id,
      amount: inv.amount,
      status: inv.status || (inv.paid_at ? 'paid' : 'pending'),
      date: inv.paid_at || new Date().toISOString(),
    }));

    const planMap: Record<string, string> = {
      price_profesional_sandbox: 'profesional',
      price_empresa_sandbox: 'empresa',
      profesional: 'profesional',
      empresa: 'empresa',
    };

    return NextResponse.json({
      subscription: subscription ? {
        planId: planMap[subscription.plan_id] || subscription.plan_id,
        status: subscription.status,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodEnd: subscription.current_period_end,
      } : null,
      invoices,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}
