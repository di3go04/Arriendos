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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('contracts')
      .select(`
        *,
        property:properties (*),
        landlord:profiles!contracts_landlord_id_fkey (*),
        tenant:profiles!contracts_tenant_id_fkey (*)
      `);

    if (profile?.role === 'arrendatario') {
      query = query.eq('tenant_id', user.id);
    } else {
      query = query.eq('landlord_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Error fetching arriendos:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}
