import { NextResponse } from 'next/server';
import { validateAdminRole } from '@/lib/validate-admin';

// GET: Listar organizaciones (multi-tenant)
export async function GET() {
  try {
    const auth = await validateAdminRole();
    if ('error' in auth && auth.error) return auth.error;
    const { supabase } = auth;

    const { data: orgs } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ organizations: orgs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}

// POST: Crear organización
export async function POST(req: Request) {
  try {
    const auth = await validateAdminRole();
    if ('error' in auth && auth.error) return auth.error;
    const { supabase, user } = auth;

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
    const auth = await validateAdminRole();
    if ('error' in auth && auth.error) return auth.error;
    const { supabase } = auth;

    const { id, ...updates } = await req.json();

    const { error } = await supabase.from('organizations').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}
