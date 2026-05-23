import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    const { title, type, address, city, monthly_rent, full_name, email, phone, start_date, end_date, payment_day } = await req.json();

    // 1. Crear propiedad
    const { data: property, error: propError } = await supabase.from('properties').insert({
      owner_id: user.id,
      title: title || 'Mi Propiedad',
      type: type || 'apartamento',
      address,
      city,
      monthly_rent: Number(monthly_rent) || 0,
      status: 'disponible',
      amenities: [],
      image_urls: [],
    }).select().single();

    if (propError) throw new Error('Error al crear propiedad: ' + propError.message);

    // 2. Si hay datos de inquilino, crear o invitar
    let tenantUser = null;
    if (full_name && email) {
      // Intentar buscar usuario existente por email
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .maybeSingle();

      if (existingProfiles) {
        tenantUser = existingProfiles;
      } else {
        // Crear perfil temporal (el usuario deberá registrarse después)
        const { data: newTenant, error: tenantError } = await supabase.from('profiles').insert({
          id: crypto.randomUUID(),
          full_name,
          phone,
          role: 'arrendatario',
          preferred_currency: 'COP',
        }).select().single();

        if (!tenantError) tenantUser = newTenant;
      }
    }

    // 3. Si hay datos de contrato, crear contrato y pagos
    if (tenantUser && start_date) {
      const contractNumber = `RN-${Date.now().toString(36).toUpperCase()}`;

      const { data: contract, error: contractError } = await supabase.from('contracts').insert({
        property_id: property.id,
        landlord_id: user.id,
        tenant_id: tenantUser.id,
        contract_number: contractNumber,
        status: 'borrador',
        start_date,
        end_date: end_date || null,
        monthly_rent: Number(monthly_rent) || 0,
        deposit: 0,
        payment_day: payment_day || 5,
      }).select().single();

      if (contractError) throw new Error('Error al crear contrato: ' + contractError.message);

      // Generar pagos para los próximos 12 meses
      if (contract && monthly_rent > 0) {
        const payments = [];
        const start = new Date(start_date);
        for (let i = 0; i < 12; i++) {
          const dueDate = new Date(start.getFullYear(), start.getMonth() + i, payment_day || 5);
          payments.push({
            contract_id: contract.id,
            tenant_id: tenantUser.id,
            amount: Number(monthly_rent),
            due_date: dueDate.toISOString().split('T')[0],
            paid: false,
            month_year: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`,
            status: 'pendiente',
          });
        }
        await supabase.from('payments').insert(payments);
      }
    }

    // Marcar onboarding como completado
    await supabase.from('profiles').update({
      full_name: full_name || undefined,
      phone: phone || undefined,
    }).eq('id', user.id);

    // Crear notificación de bienvenida
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: '🎉 ¡Onboarding completado!',
      message: 'Tu primera propiedad ha sido configurada exitosamente.',
      type: 'success',
    });

    return NextResponse.json({ success: true, propertyId: property.id });
  } catch (error: unknown) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}