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
    // Demo mode: allow access without auth
    if (!user) {
      // Return demo data instead of empty
      const { data: allProps } = await supabase.from('properties').select('*', { count: 'exact' });
      return NextResponse.json({ 
        authenticated: false, 
        data: { 
          properties: allProps || [],
          propertyCount: allProps?.length || 0 
        } 
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ authenticated: true, data: null });
    }

    if (profile.role === 'admin') {
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      const { count: activeContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['activo', 'firmado', 'pendiente_firma']);

      const { count: totalArrendatarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'arrendatario');

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: paymentsThisMonth } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDay);

      return NextResponse.json({
        authenticated: true,
        data: [
          { icon: 'Building2', value: totalProperties ?? 0, label: 'Propiedades registradas' },
          { icon: 'FileText', value: activeContracts ?? 0, label: 'Contratos activos' },
          { icon: 'Users', value: totalArrendatarios ?? 0, label: 'Arrendatarios' },
          { icon: 'CreditCard', value: paymentsThisMonth ?? 0, label: 'Pagos este mes' },
        ],
      });
    }

    if (profile.role === 'arrendador') {
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      const { count: activeContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', user.id)
        .in('status', ['activo', 'firmado', 'pendiente_firma']);

      const { count: uniqueTenants } = await supabase
        .from('contracts')
        .select('tenant_id', { count: 'exact', head: true })
        .eq('landlord_id', user.id)
        .in('status', ['activo', 'firmado', 'pendiente_firma']);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: paymentsThisMonth } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .in('contract_id', (
          await supabase
            .from('contracts')
            .select('id')
            .eq('landlord_id', user.id)
        ).data?.map(c => c.id) ?? [])
        .gte('created_at', firstDay);

      return NextResponse.json({
        authenticated: true,
        data: [
          { icon: 'Building2', value: totalProperties ?? 0, label: 'Tus propiedades' },
          { icon: 'FileText', value: activeContracts ?? 0, label: 'Contratos activos' },
          { icon: 'Users', value: uniqueTenants ?? 0, label: 'Arrendatarios' },
          { icon: 'CreditCard', value: paymentsThisMonth ?? 0, label: 'Pagos este mes' },
        ],
      });
    }

    if (profile.role === 'arrendatario') {
      const { count: myContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id);

      const { count: activeContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id)
        .in('status', ['activo', 'firmado']);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: myPaymentsThisMonth } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id)
        .gte('created_at', firstDay);

      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id)
        .eq('paid', false);

      return NextResponse.json({
        authenticated: true,
        data: [
          { icon: 'FileText', value: myContracts ?? 0, label: 'Mis contratos' },
          { icon: 'FileText', value: activeContracts ?? 0, label: 'Contratos activos' },
          { icon: 'CreditCard', value: myPaymentsThisMonth ?? 0, label: 'Pagos este mes' },
          { icon: 'Clock', value: pendingPayments ?? 0, label: 'Pendientes' },
        ],
      });
    }

    return NextResponse.json({ authenticated: true, data: null });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ authenticated: false, data: null, error: 'Error interno' }, { status: 500 });
  }
}
