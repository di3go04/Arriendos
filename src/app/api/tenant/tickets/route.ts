import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ticketSchema = z.object({
  contractId: z.string().uuid().optional(),
  landlordId: z.string().uuid(),
  subject: z.string().min(3).max(120),
  description: z.string().max(3000).optional(),
  category: z.enum(['maintenance', 'billing', 'general', 'emergency']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabase
    .from('tenant_tickets')
    .select('*')
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(req: Request) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = ticketSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: ticket, error } = await supabase
    .from('tenant_tickets')
    .insert({
      tenant_id: user.id,
      landlord_id: parsed.data.landlordId,
      contract_id: parsed.data.contractId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });

  await supabase.from('notifications').insert({
    user_id: parsed.data.landlordId,
    title: 'Nuevo ticket de inquilino',
    message: parsed.data.subject,
    type: parsed.data.priority === 'urgent' ? 'warning' : 'info',
  });

  return NextResponse.json({ ticket }, { status: 201 });
}

