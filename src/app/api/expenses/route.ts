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
    const propertyId = searchParams.get('propertyId');

    let query = supabase.from('expenses').select('*, property:properties(title)').eq('owner_id', user.id).order('expense_date', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);

    const { data: expenses, error } = await query;
    if (error) throw error;

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
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}

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

    const { property_id, category, amount, description, expense_date } = await req.json();
    if (!property_id || !category || !amount) {
      return NextResponse.json({ error: 'Campos requeridos: property_id, category, amount' }, { status: 400 });
    }

    const { data, error } = await supabase.from('expenses').insert({
      property_id, owner_id: user.id, category, amount, description,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ expense: data });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}
