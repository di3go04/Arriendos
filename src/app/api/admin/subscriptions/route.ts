import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });

  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('amount,currency,status,plan_id,paid_at,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const active = (subscriptions || []).filter((sub) => sub.status === 'active');
  const revenueUsd = (transactions || [])
    .filter((tx) => tx.status === 'approved' && tx.currency === 'USD')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return NextResponse.json({
    summary: {
      total: subscriptions?.length || 0,
      active: active.length,
      cancelled: (subscriptions || []).filter((sub) => sub.status === 'cancelled').length,
      approvedRevenueUsd: revenueUsd,
    },
    subscriptions: subscriptions || [],
    recentTransactions: transactions || [],
  });
}

