import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

let supabaseClient: ReturnType<typeof createServerClient> | null = null;

async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const cookieStore = await cookies();
  supabaseClient = createServerClient(
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
  return supabaseClient;
}

async function getAuthUser(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[expenses] auth.getUser error:', error);
    return null;
  }
  return user;
}

export async function GET(req: Request) {
  const tag = '[expenses/GET]';
  try {
    console.log(tag, 'Inicio —', req.url);
    const supabase = await getSupabase();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    let query = supabase
      .from('expenses')
      .select('*, property:properties(title)')
      .eq('owner_id', user.id)
      .order('expense_date', { ascending: false });

    if (propertyId) query = query.eq('property_id', propertyId);

    const { data: expenses, error } = await query;

    if (error) {
      console.error(tag, 'Query error:', error);
      return NextResponse.json({
        error: 'Error al consultar gastos',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      }, { status: 500 });
    }

    const totalByCategory = (expenses || []).reduce((acc: Record<string, number>, e: LooseValue) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});

    const totalExpenses = (expenses || []).reduce((sum: number, e: LooseValue) => sum + Number(e.amount), 0);

    return NextResponse.json({
      expenses: expenses || [],
      summary: { totalExpenses, totalByCategory, count: expenses?.length || 0 },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error(tag, 'Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const tag = '[expenses/POST]';
  try {
    console.log(tag, 'Inicio');
    const supabase = await getSupabase();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    const { property_id, category, amount, description, expense_date } = body;
    if (!property_id || !category || !amount) {
      return NextResponse.json(
        { error: 'Campos requeridos: property_id, category, amount' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        property_id,
        owner_id: user.id,
        category,
        amount,
        description,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error(tag, 'Insert error:', error);
      return NextResponse.json({
        error: 'Error al crear gasto',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      }, { status: 500 });
    }

    return NextResponse.json({ expense: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error(tag, 'Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
