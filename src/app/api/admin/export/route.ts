import { NextResponse } from 'next/server';
import { validateAdminRole } from '@/lib/validate-admin';

export async function GET() {
  const auth = await validateAdminRole();
  if ('error' in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  const tables = [
    'profiles',
    'properties',
    'contracts',
    'payments',
    'payment_transactions',
    'subscriptions',
    'property_leads',
    'expenses',
    'maintenance_issues',
    'organizations',
    'organization_members',
  ];

  const exportData: Record<string, LooseValue> = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(5000);
    exportData[table] = error ? { error: (error as { message?: string }).message } : data;
  }

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'admin_export',
    entity_type: 'backup',
    metadata: { tables, generated_at: new Date().toISOString() },
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    format: 'json',
    tables,
    data: exportData,
  });
}

