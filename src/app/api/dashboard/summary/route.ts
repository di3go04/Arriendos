import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    const [leadsData, contractsData, paymentsData, propsData] = await Promise.all([
      supabase.from('property_leads').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('contracts').select('id, monthly_rent, status, tenant_id, property:properties(title), tenant:profiles!contracts_tenant_id_fkey(full_name, email)').eq('landlord_id', user.id),
      supabase.from('payments').select('amount, paid, due_date, contract_id, tenant_id').eq('tenant_id', tenantId || user.id),
      supabase.from('properties').select('id, title, monthly_rent, status').eq('owner_id', user.id),
    ]);

    const leads = leadsData.data || [];
    const contracts = contractsData.data || [];
    const payments = paymentsData.data || [];
    const properties = propsData.data || [];

    const tenants = [...new Set(contracts.map(c => c.tenant_id))];
    const riskScores: LooseRecord[] = [];
    for (let ti = 0; ti < Math.min(tenants.length, 10); ti++) {
      const tid = tenants[ti];
      const tPayments = payments.filter(p => p.tenant_id === tid);
      if (!tPayments.length) continue;
      const paid = tPayments.filter(p => p.paid).length;
      const unpaid = tPayments.filter(p => !p.paid).length;
      const rate = tPayments.length > 0 ? (paid / tPayments.length) * 100 : 0;
      const score = Math.min(100, Math.round((100 - rate) * 0.7 + unpaid * 5));
      const contract = contracts.find(c => c.tenant_id === tid);
      riskScores.push({
        tenantId: tid,
        tenantName: (contract as LooseRecord)?.tenant?.full_name || 'Desconocido',
        tenantEmail: (contract as LooseRecord)?.tenant?.email || '',
        score,
        risk: score < 25 ? 'low' : score < 50 ? 'medium' : score < 75 ? 'high' : 'critical',
        paymentCount: tPayments.length,
        unpaidCount: unpaid,
      });
    }

    const activeContracts = contracts.filter(c => c.status === 'activo' || c.status === 'firmado');
    const monthlyRentTotal = activeContracts.reduce((s, c) => s + Number(c.monthly_rent || 0), 0);
    const paidTotal = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
    const pendingTotal = payments.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0);

    return NextResponse.json({
      leads: leads.map(l => ({
        id: l.id,
        name: l.lead_name,
        email: l.lead_email,
        phone: l.lead_phone,
        message: l.lead_message,
        propertyId: l.property_id,
        read: l.read,
        createdAt: l.created_at,
      })),
      riskScores: riskScores.filter(Boolean),
      summary: {
        totalProperties: properties.length,
        activeContracts: activeContracts.length,
        monthlyRentTotal,
        paidTotal,
        pendingTotal,
        occupancyRate: properties.length > 0
          ? Math.round((properties.filter(p => p.status === 'ocupado').length / properties.length) * 100)
          : 0,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}


