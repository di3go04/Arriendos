import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/apiErrorWrapper';
import { getPrisma } from '@/lib/prisma';
import type { LooseValue } from '@/modules/_kernel/types';

/* ---------------------------------------------------------------
   Singleton Supabase client (already present but now guards env)   
   --------------------------------------------------------------- */
let supabaseClient: ReturnType<typeof createServerClient> | null = null;

function envIsValid() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !!process.env.DATABASE_URL // Prisma / other DB connection string
  );
}

async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!envIsValid()) {
    throw new Error('Missing required environment variables');
  }
  const cookieStore = await cookies();
  supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
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

/* ---------------------------------------------------------------
   GET – list expenses with totals
   --------------------------------------------------------------- */
export const GET = withErrorHandler(async (req: Request) => {
  const tag = '[expenses/GET]';
  try {
    console.log(tag, 'Inicio –', req.url);
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
      return NextResponse.json({ error: 'Error al consultar gastos' }, { status: 500 });
    }

    const totalByCategory = (expenses || []).reduce<Record<string, number>>(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
        return acc;
      },
      {}
    );
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

    return NextResponse.json({
      expenses: expenses ?? [],
      summary: { totalExpenses, totalByCategory, count: expenses?.length ?? 0 },
    });
  } catch (err: unknown) {
    console.error(tag, 'Unexpected error:', err);
    // Generic 500 for client – no stack trace
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});

/* ---------------------------------------------------------------
   POST – crear gasto
   --------------------------------------------------------------- */
export async function POST(req: Request) {
  const tag = '[expenses/POST]';
  try {
    const supabase = await getSupabase();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) {
      console.error(tag, 'Invalid JSON body');
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    const {
      property_id,
      category,
      amount,
      description = '',
      expense_date,
    } = body as {
      property_id?: string;
      category?: string;
      amount?: unknown;
      description?: string;
      expense_date?: string;
    };

    // --------- INPUT VALIDATION ---------
    const allowedCategories = ['maintenance', 'utilities', 'taxes', 'insurance', 'other'];
    if (!property_id) return NextResponse.json({ error: 'property_id es requerido' }, { status: 400 });
    if (!category || !allowedCategories.includes(category))
      return NextResponse.json({ error: `category debe ser una de ${allowedCategories.join(', ')}` }, { status: 400 });
    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0)
      return NextResponse.json({ error: 'amount debe ser un número positivo' }, { status: 400 });
    if (expense_date && isNaN(Date.parse(expense_date)))
      return NextResponse.json({ error: 'expense_date no es una fecha válida' }, { status: 400 });

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        property_id,
        owner_id: user.id,
        category,
        amount: amountNum,
        description,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error(tag, 'Insert error:', error);
      return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
    }

    // OPTIONAL: if you need to sync totals in another DB via Prisma, you could do:
    // await getPrisma().property.update({
    //   where: { id: property_id },
    //   data: { /* recalculate sums */ },
    // });

    return NextResponse.json({ expense: data });
  } catch (err: unknown) {
    console.error(tag, 'Unexpected error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

let supabaseClient: ReturnType<typeof createServerClient> | null = null;

function supabaseConfigValid() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const cookieStore = await cookies();
  if (!supabaseConfigValid()) {
    throw new Error('Supabase configuration missing');
  }
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

export const GET = withErrorHandler(async (req: Request) => {
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
});

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
