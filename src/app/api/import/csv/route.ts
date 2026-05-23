import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
    }

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

    // Format rows to match the properties table
    const propertiesToInsert = rows.map((row: any) => ({
      owner_id: user.id,
      title: row.titulo || row.title || row.nombre || 'Propiedad Importada',
      address: row.direccion || row.address || 'Sin dirección',
      type: row.tipo || row.type || 'apartamento',
      price: parseFloat(row.precio || row.price || '0'),
      rooms: parseInt(row.habitaciones || row.rooms || '1', 10),
      bathrooms: parseInt(row.banos || row.bathrooms || '1', 10),
      status: 'disponible',
    }));

    const { data, error } = await supabase
      .from('properties')
      .insert(propertiesToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ message: 'Importación exitosa', inserted: data.length });
  } catch (error: any) {
    console.error('Import CSV error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
