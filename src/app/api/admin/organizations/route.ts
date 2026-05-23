import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET: Listar organizaciones (multi-tenant)
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

    // Verificar si es admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { data: orgs } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ organizations: orgs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}

// POST: Crear organización
export async function POST(req: Request) {
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

    const { name, slug, logo_url, primary_color, domain, plan_id, max_properties, max_users } = await req.json();

    const { data: org, error } = await supabase.from('organizations').insert({
      name,
      slug,
      logo_url,
      primary_color: primary_color || '#1E3A5F',
      domain,
      plan_id: plan_id || 'profesional',
      max_properties: max_properties || 10,
      max_users: max_users || 5,
      is_active: true,
    }).select().single();

    if (error) throw error;

    // Asignar el creador como admin de la organización
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'admin',
    });

    return NextResponse.json({ success: true, organization: org });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}

// PUT: Actualizar organización (white-label)
export async function PUT(req: Request) {
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

    const { id, ...updates } = await req.json();

    const { error } = await supabase.from('organizations').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}
