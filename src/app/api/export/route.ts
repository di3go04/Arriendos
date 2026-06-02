import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    if (type === 'properties') {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      const headers = 'Título,Dirección,Canon,Estado,Creada';
      const csv = properties?.map(p =>
        [p.title, p.address, p.monthly_rent, p.status, p.created_at]
          .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n') || '';

      return new NextResponse(`\uFEFF${headers}\n${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="propiedades.csv"',
        },
      });
    }

    if (type === 'tenants') {
      const { data: tenants } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'arrendatario');

      const headers = 'Nombre,Email,Teléfono,Rol,Creado';
      const csv = tenants?.map(p =>
        [p.full_name, p.email, p.phone, p.role, p.created_at]
          .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n') || '';

      return new NextResponse(`\uFEFF${headers}\n${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="inquilinos.csv"',
        },
      });
    }

    return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
