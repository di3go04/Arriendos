import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const DEMO_EMAIL = 'demo@rentnow.app';
const DEMO_PASSWORD = 'Demo123!';
const DEMO_LANDLORD_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_TENANT1_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_TENANT2_ID = '00000000-0000-0000-0000-000000000003';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Create or update demo user in Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingDemo = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

    let demoUserId: string;
    if (existingDemo) {
      demoUserId = existingDemo.id;
      await supabase.auth.admin.updateUserById(demoUserId, { password: DEMO_PASSWORD });
    } else {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'arrendador', full_name: 'Usuario Demo' },
      });
      if (createErr) throw new Error(`Error creating auth user: ${createErr.message}`);
      demoUserId = newUser!.user.id;
    }

    // 2. Upsert landlord profile
    await supabase.from('profiles').upsert({
      id: DEMO_LANDLORD_ID,
      full_name: 'Carlos Arrendador Demo',
      email: DEMO_EMAIL,
      phone: '+57 300 111 2233',
      role: 'arrendador',
      preferred_currency: 'COP',
    }, { onConflict: 'id' });

    // Also link auth user to landlord profile
    await supabase.from('profiles').upsert({
      id: demoUserId,
      full_name: 'Usuario Demo',
      email: DEMO_EMAIL,
      phone: '+57 300 111 2233',
      role: 'arrendador',
      preferred_currency: 'COP',
    }, { onConflict: 'id' });

    // 3. Create tenant profiles
    await supabase.from('profiles').upsert([
      { id: DEMO_TENANT1_ID, full_name: 'Ana María López', email: 'ana.lopez@email.com', phone: '+57 300 444 5566', role: 'arrendatario', preferred_currency: 'COP' },
      { id: DEMO_TENANT2_ID, full_name: 'María García Ruiz', email: 'maria.garcia@email.com', phone: '+57 310 777 8899', role: 'arrendatario', preferred_currency: 'COP' },
    ], { onConflict: 'id' });

    // 4. Insert 3 properties
    const properties = [
      {
        owner_id: DEMO_LANDLORD_ID, title: 'Apartamento Chapinero', type: 'apartamento',
        address: 'Carrera 11 # 70-30', city: 'Bogotá', state: 'Cundinamarca', country: 'CO',
        area_sqm: 85, bedrooms: 3, bathrooms: 2,
        description: 'Hermoso apartamento en el corazón de Chapinero. Cerca a universidades, restaurantes y transporte público. Cuenta con portería 24h, parqueadero y balcón con vista a la ciudad.',
        amenities: ['Portería', 'Parqueadero', 'Balcón', 'Ascensor', 'Citófono'],
        monthly_rent: 2800000, deposit: 2800000, status: 'ocupado', image_urls: [],
      },
      {
        owner_id: DEMO_LANDLORD_ID, title: 'Casa en Laureles', type: 'casa',
        address: 'Calle 35 # 80-15', city: 'Medellín', state: 'Antioquia', country: 'CO',
        area_sqm: 150, bedrooms: 4, bathrooms: 3,
        description: 'Amplia casa en el exclusivo barrio Laureles. Jardín privado con zona de parrilla, garaje para 2 autos y sistema de seguridad. Ideal para familia.',
        amenities: ['Jardín', 'Parqueadero', 'Chimenea', 'Zona de parrilla', 'Seguridad 24h', 'Cocina integral'],
        monthly_rent: 3500000, deposit: 3500000, status: 'disponible', image_urls: [],
      },
      {
        owner_id: DEMO_LANDLORD_ID, title: 'Local Comercial Centro', type: 'local',
        address: 'Calle 19 # 7-50', city: 'Bogotá', state: 'Cundinamarca', country: 'CO',
        area_sqm: 60, bedrooms: 0, bathrooms: 1,
        description: 'Local comercial en el centro histórico de Bogotá. Alta afluencia de público peatonal y vehicular. Ideal para tienda, café o restaurante.',
        amenities: ['Baño privado', 'Vitrina', 'Aire acondicionado', 'Bodega', 'Acceso 24h'],
        monthly_rent: 4200000, deposit: 4200000, status: 'disponible', image_urls: [],
      },
    ];

    const createdProperties: any[] = [];
    for (const prop of properties) {
      const { data, error } = await supabase.from('properties').insert(prop).select().single();
      if (error) console.error('Error creating property:', error.message);
      else createdProperties.push(data);
    }

    // 5. Insert 2 tenants
    const tenants = [
      { name: 'Ana María López', email: 'ana.lopez@email.com', phone: '+57 300 444 5566', document_id: 'CC 1023456789', notes: 'Inquilino referido por agencia' },
      { name: 'María García Ruiz', email: 'maria.garcia@email.com', phone: '+57 310 777 8899', document_id: 'CC 1098765432', notes: 'Contrato anual' },
    ];

    const createdTenants: any[] = [];
    for (const tenant of tenants) {
      const { data, error } = await supabase.from('tenants').insert(tenant).select().single();
      if (error) console.error('Error creating tenant:', error.message);
      else createdTenants.push(data);
    }

    // 6. Insert 2 contracts
    const now = new Date();
    const startDate1 = new Date(now); startDate1.setMonth(startDate1.getMonth() - 4);
    const endDate1 = new Date(startDate1); endDate1.setFullYear(endDate1.getFullYear() + 1);
    const startDate2 = new Date(now); startDate2.setMonth(startDate2.getMonth() - 2);
    const endDate2 = new Date(startDate2); endDate2.setFullYear(endDate2.getFullYear() + 1);

    const contracts = [];
    if (createdProperties[0] && createdTenants[0]) {
      const { data, error } = await supabase.from('contracts').insert({
        property_id: createdProperties[0].id, landlord_id: DEMO_LANDLORD_ID, tenant_id: createdTenants[0].id,
        contract_number: 'RENT-2026-001', status: 'activo',
        start_date: startDate1.toISOString().split('T')[0], end_date: endDate1.toISOString().split('T')[0],
        monthly_rent: 2800000, deposit: 2800000, payment_day: 5,
        contract_content: '<h1>Contrato de Arrendamiento</h1><p>Contrato de arrendamiento residencial entre Carlos Arrendador Demo y Ana María López para el Apartamento Chapinero.</p>',
      }).select().single();
      if (error) console.error('Error creating contract 1:', error.message);
      else contracts.push(data);
    }

    if (createdProperties[1] && createdTenants[1]) {
      const { data, error } = await supabase.from('contracts').insert({
        property_id: createdProperties[1].id, landlord_id: DEMO_LANDLORD_ID, tenant_id: createdTenants[1].id,
        contract_number: 'RENT-2026-002', status: 'activo',
        start_date: startDate2.toISOString().split('T')[0], end_date: endDate2.toISOString().split('T')[0],
        monthly_rent: 3500000, deposit: 3500000, payment_day: 10,
        contract_content: '<h1>Contrato de Arrendamiento</h1><p>Contrato de arrendamiento residencial entre Carlos Arrendador Demo y María García Ruiz para la Casa en Laureles.</p>',
      }).select().single();
      if (error) console.error('Error creating contract 2:', error.message);
      else contracts.push(data);
    }

    // 7. Insert payments (at least 3: 2 on time, 1 overdue)
    const payments = [];
    if (contracts.length > 0 && createdTenants[0]) {
      const c = contracts[0];
      const paid1 = new Date(now); paid1.setMonth(paid1.getMonth() - 3); paid1.setDate(6);
      const paid2 = new Date(now); paid2.setMonth(paid2.getMonth() - 2); paid2.setDate(5);
      const paid3 = new Date(now); paid3.setMonth(paid3.getMonth() - 1); paid3.setDate(4);

      payments.push(
        { contract_id: c.id, tenant_id: createdTenants[0].id, amount: 2800000, due_date: new Date(paid1.getTime() - 86400000 * 5).toISOString().split('T')[0], paid: true, paid_at: paid1.toISOString(), month_year: paid1.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) },
        { contract_id: c.id, tenant_id: createdTenants[0].id, amount: 2800000, due_date: new Date(paid2.getTime() - 86400000 * 5).toISOString().split('T')[0], paid: true, paid_at: paid2.toISOString(), month_year: paid2.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) },
        { contract_id: c.id, tenant_id: createdTenants[0].id, amount: 2800000, due_date: now.toISOString().split('T')[0], paid: false, month_year: now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) },
      );
    }

    if (contracts.length > 1 && createdTenants[1]) {
      const c = contracts[1];
      const paid1 = new Date(now); paid1.setMonth(paid1.getMonth() - 2); paid1.setDate(12);
      payments.push(
        { contract_id: c.id, tenant_id: createdTenants[1].id, amount: 3500000, due_date: new Date(paid1.getTime() - 86400000 * 10).toISOString().split('T')[0], paid: true, paid_at: paid1.toISOString(), month_year: paid1.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) },
      );
    }

    for (const pay of payments) {
      const { error } = await supabase.from('payments').insert(pay as any);
      if (error) console.error('Error creating payment:', error.message);
    }

    // 8. Notifications
    await supabase.from('notifications').insert([
      { user_id: DEMO_LANDLORD_ID, title: 'Seed completado', message: 'Los datos demo se han cargado exitosamente. Bienvenido a RentNow.', type: 'success', read: false },
      { user_id: DEMO_LANDLORD_ID, title: 'Pago recibido', message: 'Ana María López realizó un pago de $2,800,000.', type: 'payment', read: false },
      { user_id: DEMO_LANDLORD_ID, title: 'Pago vencido', message: 'Ana María López tiene un pago de $2,800,000 vencido.', type: 'warning', read: false },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Datos demo creados exitosamente',
      data: {
        credentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        properties: createdProperties.length,
        tenants: createdTenants.length,
        contracts: contracts.length,
        payments: payments.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
