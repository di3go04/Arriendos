import { createServerClient } from '@supabase/ssr';
import { eachMonthOfInterval,endOfYear,format,startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
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
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const propertyId = searchParams.get('propertyId');

    // Obtener contratos del arrendador
    let contractQuery = supabase.from('contracts').select('id, monthly_rent, start_date, end_date, status, property_id').eq('landlord_id', user.id);
    if (propertyId) contractQuery = contractQuery.eq('property_id', propertyId);
    const { data: contracts } = await contractQuery;

    if (!contracts?.length) {
      return NextResponse.json({ error: 'No hay contratos' }, { status: 404 });
    }

    const contractIds = contracts.map(c => c.id);

    // Obtener pagos del año
    const startDate = startOfYear(new Date(year, 0));
    const endDate = endOfYear(new Date(year, 0));

    const paymentQuery = supabase
      .from('payments')
      .select('amount, paid, due_date, paid_at, contract_id')
      .in('contract_id', contractIds)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString());

    const { data: payments } = await paymentQuery;

    // Obtener propiedades
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, address, city, monthly_rent')
      .eq('owner_id', user.id);

    // Métricas anuales
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const monthlyBreakdown = months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthPayments = (payments || []).filter(p => p.due_date?.startsWith(monthStr));

      const paid = monthPayments.filter(p => p.paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = monthPayments.filter(p => !p.paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const total = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const onTime = monthPayments.filter(p => p.paid && p.paid_at && new Date(p.paid_at) <= new Date(p.due_date));
      const late = monthPayments.filter(p => p.paid && p.paid_at && new Date(p.paid_at) > new Date(p.due_date));

      return {
        month: format(month, 'MMM yyyy', { locale: es }),
        monthIndex: month.getMonth(),
        paid,
        pending,
        total,
        paymentCount: monthPayments.length,
        onTimeCount: onTime.length,
        lateCount: late.length,
        efficiency: monthPayments.length > 0 ? Math.round((onTime.length / monthPayments.length) * 100) : 100,
      };
    });

    const totalPaid = monthlyBreakdown.reduce((s, m) => s + m.paid, 0);
    const totalPending = monthlyBreakdown.reduce((s, m) => s + m.pending, 0);
    const totalBilled = monthlyBreakdown.reduce((s, m) => s + m.total, 0);
    const avgMonthlyIncome = totalPaid > 0 ? totalPaid / Math.max(1, monthlyBreakdown.filter(m => m.paid > 0).length) : 0;
    const collectionEfficiency = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

    // Proyección anual
    const projectedAnnual = avgMonthlyIncome * 12 * (collectionEfficiency / 100);

    // Reporte por propiedad
    const propertyBreakdown = (properties || []).map(prop => {
      const propContracts = (contracts || []).filter(c => c.property_id === prop.id);
      const propContractIds = propContracts.map(c => c.id);
      const propPayments = (payments || []).filter(p => propContractIds.includes(p.contract_id));

      const paid = propPayments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
      const pending = propPayments.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0);
      const projected = Number(prop.monthly_rent) * 12;

      return {
        id: prop.id,
        title: prop.title,
        address: prop.address,
        city: prop.city,
        monthlyRent: Number(prop.monthly_rent),
        paid,
        pending,
        occupancy: propContracts.length > 0 ? 'Arrendada' : 'Disponible',
        projectedAnnual: projected,
        efficiency: (paid + pending) > 0 ? Math.round((paid / (paid + pending)) * 100) : 0,
      };
    });

    return NextResponse.json({
      year,
      summary: {
        totalPaid: Math.round(totalPaid),
        totalPending: Math.round(totalPending),
        totalBilled: Math.round(totalBilled),
        avgMonthlyIncome: Math.round(avgMonthlyIncome),
        projectedAnnual: Math.round(projectedAnnual),
        collectionEfficiency,
        activeContracts: contracts.filter(c => c.status === 'activo' || c.status === 'firmado').length,
      },
      monthlyBreakdown,
      propertyBreakdown,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}