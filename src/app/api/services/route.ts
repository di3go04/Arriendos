import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET: Listar servicios disponibles
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    let query = supabase
      .from('service_providers')
      .select('*')
      .eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (city) query = query.ilike('service_cities', `%${city}%`);

    const { data: providers, error } = await query.order('rating', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ providers: providers || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}

// POST: Registrar servicio/contratación
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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { providerId, serviceType, propertyId, description, scheduledDate } = await req.json();

    // Guardar solicitud de servicio
    const { data: serviceRequest, error } = await supabase.from('service_requests').insert({
      requester_id: user.id,
      provider_id: providerId,
      property_id: propertyId,
      service_type: serviceType,
      description,
      scheduled_date: scheduledDate,
      status: 'pending',
    }).select().single();

    if (error) throw error;

    // Notificar al proveedor
    const { data: provider } = await supabase
      .from('service_providers')
      .select('user_id, business_name')
      .eq('id', providerId)
      .single();

    if (provider) {
      await supabase.from('notifications').insert({
        user_id: provider.user_id,
        title: 'Nueva solicitud de servicio',
        message: `Has recibido una solicitud de servicio para ${serviceType}`,
        type: 'info',
      });
    }

    return NextResponse.json({ success: true, serviceRequest });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}