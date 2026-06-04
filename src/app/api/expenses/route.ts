import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/apiErrorWrapper';
import { getSupabase, getAuthUser } from '@/lib/supabase-server';

export const GET = withErrorHandler(async (req: Request) => {
  const tag = '[expenses/GET]';
  console.log(tag, 'Inicio –', req.url);
  const supabase = await getSupabase();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('owner_id', user.id)
    .order('expense_date', { ascending: false });

  if (propertyId) query = query.eq('property_id', propertyId);

  const { data: expenses, error } = await query;
  if (error) {
    console.error(tag, 'Query error:', error);
    const resp: Record<string, unknown> = { error: 'Error al consultar gastos' };
    if (searchParams.get('debug') === 'true') resp.details = error.message;
    return NextResponse.json(resp, { status: 500 });
  }

  const totalByCategory = (expenses || []).reduce(
    (acc: Record<string, number>, e: LooseValue) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    },
    {},
  );
  const totalExpenses = (expenses || []).reduce((sum: number, e: LooseValue) => sum + Number(e.amount), 0);

  return NextResponse.json({
    expenses: expenses ?? [],
    summary: { totalExpenses, totalByCategory, count: expenses?.length ?? 0 },
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const tag = '[expenses/POST]';
  console.log(tag, 'Inicio');
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

  const allowedCategories = ['maintenance', 'utilities', 'taxes', 'insurance', 'other'];
  if (!property_id) return NextResponse.json({ error: 'property_id es requerido' }, { status: 400 });
  if (!category || !allowedCategories.includes(category))
    return NextResponse.json(
      { error: `category debe ser una de ${allowedCategories.join(', ')}` },
      { status: 400 },
    );
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

  return NextResponse.json({ expense: data });
});
