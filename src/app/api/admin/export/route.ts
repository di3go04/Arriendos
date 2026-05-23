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

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden exportar backups' }, { status: 403 });
  }

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

