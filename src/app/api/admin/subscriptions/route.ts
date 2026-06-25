import { NextResponse } from 'next/server';
import { validateAdminRole } from '@/lib/validate-admin';

export async function GET() {
  const auth = await validateAdminRole();
  if ('error' in auth && auth.error) return auth.error;
  const { supabase } = auth;

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

