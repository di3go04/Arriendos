import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ALL_COLUMNS: Record<string, { key: string; label: string }[]> = {
  properties: [
    { key: 'title', label: 'Título' },
    { key: 'address', label: 'Dirección' },
    { key: 'city', label: 'Ciudad' },
    { key: 'type', label: 'Tipo' },
    { key: 'monthly_rent', label: 'Canon Mensual' },
    { key: 'status', label: 'Estado' },
    { key: 'bedrooms', label: 'Habitaciones' },
    { key: 'bathrooms', label: 'Baños' },
    { key: 'area_sqm', label: 'Área (m²)' },
    { key: 'deposit', label: 'Depósito' },
    { key: 'available_from', label: 'Disponible Desde' },
    { key: 'created_at', label: 'Creada' },
  ],
  tenants: [
    { key: 'full_name', label: 'Nombre Completo' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'role', label: 'Rol' },
    { key: 'created_at', label: 'Registrado' },
  ],
  payments: [
    { key: 'amount', label: 'Monto' },
    { key: 'due_date', label: 'Fecha Vencimiento' },
    { key: 'paid', label: 'Pagado' },
    { key: 'paid_at', label: 'Fecha Pago' },
    { key: 'payment_method', label: 'Método' },
    { key: 'status', label: 'Estado' },
    { key: 'contract_id', label: 'Contrato ID' },
    { key: 'created_at', label: 'Creado' },
  ],
  contracts: [
    { key: 'contract_number', label: 'Número' },
    { key: 'status', label: 'Estado' },
    { key: 'monthly_rent', label: 'Canon' },
    { key: 'start_date', label: 'Inicio' },
    { key: 'end_date', label: 'Fin' },
    { key: 'created_at', label: 'Creado' },
  ],
};

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSVLine(row: Record<string, unknown>, selectedColumns: { key: string }[]): string {
  return selectedColumns.map(col => escapeCSV(row[col.key])).join(',');
}

export async function GET(req: NextRequest) {
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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'properties';
    const selectedColsParam = searchParams.get('columns');
    const propertyId = searchParams.get('propertyId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    const availableColumns = ALL_COLUMNS[type] || ALL_COLUMNS.properties;
    let selectedColumns = availableColumns;
    if (selectedColsParam) {
      const requestedKeys = selectedColsParam.split(',').map(k => k.trim());
      selectedColumns = availableColumns.filter(c => requestedKeys.includes(c.key));
      if (selectedColumns.length === 0) selectedColumns = availableColumns;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const header = generateCSVLine(
          Object.fromEntries(selectedColumns.map(c => [c.key, c.label])),
          selectedColumns
        );
        controller.enqueue(encoder.encode('\uFEFF' + header + '\n'));

        let page = 0;
        const pageSize = 500;
        let hasMore = true;

        while (hasMore) {
          let query;
          if (type === 'properties') {
            query = supabase
              .from('properties')
              .select('*')
              .eq('owner_id', user.id)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('created_at', { ascending: false });

            if (propertyId) query = query.eq('id', propertyId);
            if (status) query = query.eq('status', status);
          } else if (type === 'tenants') {
            query = supabase
              .from('profiles')
              .select('*')
              .eq('role', 'arrendatario')
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('created_at', { ascending: false });
          } else if (type === 'payments') {
            const { data: contracts } = await supabase
              .from('contracts')
              .select('id')
              .eq('landlord_id', user.id);
            const contractIds = contracts?.map(c => c.id) || [];

            query = supabase
              .from('payments')
              .select('*')
              .in('contract_id', contractIds)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('due_date', { ascending: false });

            if (dateFrom) query = query.gte('due_date', dateFrom);
            if (dateTo) query = query.lte('due_date', dateTo);
            if (status) query = query.eq('status', status);
          } else if (type === 'contracts') {
            query = supabase
              .from('contracts')
              .select('*')
              .eq('landlord_id', user.id)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('created_at', { ascending: false });

            if (propertyId) query = query.eq('property_id', propertyId);
            if (status) query = query.eq('status', status);
            if (dateFrom) query = query.gte('start_date', dateFrom);
            if (dateTo) query = query.lte('start_date', dateTo);
          } else {
            query = supabase
              .from('properties')
              .select('*')
              .eq('owner_id', user.id)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('created_at', { ascending: false });
          }

          const { data: rows } = await query;
          if (!rows || rows.length === 0) {
            hasMore = false;
            break;
          }

          for (const row of rows) {
            const line = generateCSVLine(row as Record<string, unknown>, selectedColumns) + '\n';
            controller.enqueue(encoder.encode(line));
          }

          page++;
          if ((rows?.length || 0) < pageSize) hasMore = false;
        }

        controller.close();
      },
    });

    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = new URL(req.url);
  url.search = new URLSearchParams(body).toString();
  return GET(new NextRequest(url.toString()));
}
