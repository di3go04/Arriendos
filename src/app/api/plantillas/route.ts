import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function extractVariablesFromHtml(html: string): string[] {
  const regex = /data-campo="([^"]+)"/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { titulo, contenidoHtml, tipo } = await req.json();

    if (!titulo || !contenidoHtml) {
      return NextResponse.json(
        { error: 'Los campos titulo y contenidoHtml son obligatorios' },
        { status: 400 }
      );
    }

    const variables = extractVariablesFromHtml(contenidoHtml);

    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        owner_id: user.id,
        name: titulo,
        content: contenidoHtml,
        variables,
        is_public: false,
        tipo: tipo || 'manual',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al guardar la plantilla' },
      { status: 500 }
    );
  }
}
