import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, profiles!properties_owner_id_fkey(full_name, phone)')
      .in('status', ['disponible', 'ocupado'])
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    const properties = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      type: p.type,
      address: p.address,
      city: p.city,
      area_sqm: p.area_sqm,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      amenities: p.amenities,
      monthly_rent: p.monthly_rent,
      deposit: p.deposit,
      status: p.status,
      image_urls: p.image_urls || [],
      owner: p.profiles ? { name: p.profiles.full_name, phone: p.profiles.phone } : null,
      created_at: p.created_at,
    }));

    return NextResponse.json({ properties });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cargar propiedades';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
