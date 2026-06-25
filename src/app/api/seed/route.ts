import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEMO_EMAIL = 'demo@rentnow.app';
const DEMO_PASSWORD = 'Demo123!';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Create or get demo user
    const { data: users } = await admin.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.email === DEMO_EMAIL);
    let userId: string;

    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD, email_confirm: true });
    } else {
      const { data: newUser, error } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
        user_metadata: { full_name: 'Carlos Demo', role: 'arrendador' },
      });
      if (error) throw error;
      userId = newUser!.user.id;
    }

    // 2. Upsert profile
    await admin.from('profiles').upsert({
      id: userId, full_name: 'Carlos Demo', email: DEMO_EMAIL,
      phone: '+57 300 111 2233', role: 'arrendador', preferred_currency: 'COP',
    }, { onConflict: 'id' });

    // 3. Clean old data
    await admin.from('payments').delete().neq('id', '00000000');
    await admin.from('contracts').delete().neq('id', '00000000');
    await admin.from('property_leads').delete().neq('id', '00000000');
    await admin.from('notifications').delete().neq('id', '00000000');
    await admin.from('tenants').delete().neq('id', '00000000');
    await admin.from('properties').delete().neq('id', '00000000');

    // 4. Insert properties
    const { data: props } = await admin.from('properties').insert([
      { owner_id: userId, title: 'Apartamento Norte', type: 'apartamento', address: 'Calle 127 # 15-20', city: 'Bogotá', state: 'Cundinamarca', country: 'CO', lat: 4.7110, lng: -74.0721, area_sqm: 95, bedrooms: 3, bathrooms: 2, description: 'Apartamento moderno en el norte de Bogotá.', amenities: ['Gimnasio', 'Piscina', 'Parqueadero'], monthly_rent: 3200000, deposit: 3200000, status: 'ocupado', image_urls: [] },
      { owner_id: userId, title: 'Local Kennedy', type: 'local', address: 'Carrera 86 # 45-30', city: 'Bogotá', state: 'Cundinamarca', country: 'CO', lat: 4.6270, lng: -74.1565, area_sqm: 80, bedrooms: 0, bathrooms: 1, description: 'Local comercial zona de alto tráfico.', amenities: ['Vitrina', 'Aire acondicionado'], monthly_rent: 4500000, deposit: 4500000, status: 'disponible', image_urls: [] },
      { owner_id: userId, title: 'Casa Campestre', type: 'casa', address: 'Km 5 Via La Calera', city: 'La Calera', state: 'Cundinamarca', country: 'CO', lat: 4.8590, lng: -74.0591, area_sqm: 220, bedrooms: 4, bathrooms: 3, description: 'Casa campestre con jardín amplio.', amenities: ['Jardín', 'BBQ', 'Fireplace'], monthly_rent: 5500000, deposit: 5500000, status: 'disponible', image_urls: [] },
      { owner_id: userId, title: 'Apartamento Chapinero', type: 'apartamento', address: 'Carrera 11 # 70-30', city: 'Bogotá', state: 'Cundinamarca', country: 'CO', lat: 4.6538, lng: -74.0641, area_sqm: 72, bedrooms: 2, bathrooms: 2, description: 'Acogedor apartamento en Chapinero.', amenities: ['Portería', 'Parqueadero', 'Ascensor'], monthly_rent: 2100000, deposit: 2100000, status: 'ocupado', image_urls: [] },
      { owner_id: userId, title: 'Casa Laureles', type: 'casa', address: 'Calle 35 # 80-15', city: 'Medellín', state: 'Antioquia', country: 'CO', lat: 6.2442, lng: -75.5812, area_sqm: 180, bedrooms: 4, bathrooms: 3, description: 'Elegante casa en Laureles.', amenities: ['Jardín', 'Parqueadero', 'Seguridad 24h'], monthly_rent: 3800000, deposit: 3800000, status: 'ocupado', image_urls: [] },
    ]).select();

    // 5. Insert tenants
    const { data: tenants } = await admin.from('tenants').insert([
      { name: 'Ana María López', email: 'ana.lopez@email.com', phone: '+57 300 444 5566', document_id: 'CC 1023456789', notes: 'Inquilina ejemplar' },
      { name: 'María García Ruiz', email: 'maria.garcia@email.com', phone: '+57 310 777 8899', document_id: 'CC 1098765432', notes: 'Contrato anual' },
      { name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', phone: '+57 320 222 3344', document_id: 'CC 1034567890', notes: 'Nuevo inquilino' },
    ]).select();

    // 6. Insert contracts
    const contracts: any[] = [];
    const now = new Date();
    if (props && props.length >= 3 && tenants && tenants.length >= 3) {
      const contractData = [
        { propIdx: 0, tenantIdx: 0, status: 'activo', monthsAgo: 6, rent: 3200000, number: 'RENT-2026-001' },
        { propIdx: 3, tenantIdx: 1, status: 'activo', monthsAgo: 4, rent: 2100000, number: 'RENT-2026-002' },
        { propIdx: 4, tenantIdx: 2, status: 'pendiente_firma', monthsAgo: 0, rent: 3800000, number: 'RENT-2026-003' },
      ];
      for (const c of contractData) {
        const start = new Date(now); start.setMonth(start.getMonth() - c.monthsAgo);
        const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
        const { data: contract } = await admin.from('contracts').insert({
          property_id: props[c.propIdx].id, landlord_id: userId, tenant_id: tenants[c.tenantIdx].id,
          contract_number: c.number, status: c.status,
          start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0],
          monthly_rent: c.rent, deposit: c.rent, payment_day: 5,
          contract_content: `<h1>Contrato ${c.number}</h1><p>Contrato demo.</p>`,
        }).select().single();
        if (contract) contracts.push(contract);
      }
    }

    // 7. Insert payments (12)
    const payments: any[] = [];
    if (contracts.length >= 2 && tenants && tenants.length >= 2) {
      for (let ci = 0; ci < 2; ci++) {
        for (let m = 5; m >= 0; m--) {
          const date = new Date(now); date.setMonth(date.getMonth() - m);
          const dueDate = new Date(date); dueDate.setDate(5);
          const isPaid = m > 0;
          const isOverdue = m === 1 && ci === 1;
          payments.push({
            contract_id: contracts[ci].id, tenant_id: tenants[ci].id,
            amount: contracts[ci].monthly_rent, due_date: dueDate.toISOString().split('T')[0],
            paid: isPaid && !isOverdue, paid_at: isPaid && !isOverdue ? dueDate.toISOString() : null,
            month_year: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          });
        }
      }
      await admin.from('payments').insert(payments);
    }

    // 8. Notifications
    await admin.from('notifications').insert([
      { user_id: userId, title: 'Bienvenido a RentNow', message: 'Tu cuenta demo está lista.', type: 'success', read: false },
      { user_id: userId, title: 'Pago recibido', message: 'Ana María López pagó $3,200,000.', type: 'payment', read: false },
      { user_id: userId, title: 'Pago vencido', message: 'María García tiene un pago atrasado de $2,100,000.', type: 'warning', read: false },
      { user_id: userId, title: 'Contrato pendiente', message: 'RENT-2026-003 requiere firma.', type: 'info', read: false },
      { user_id: userId, title: 'Pago recibido', message: 'María García pagó $2,100,000.', type: 'payment', read: false },
      { user_id: userId, title: 'Nueva consulta', message: 'Lead solicitó info sobre Local Kennedy.', type: 'info', read: true },
    ]);

    // 9. Leads
    if (props && props.length >= 3) {
      await admin.from('property_leads').insert([
        { property_id: props[1].id, owner_id: userId, lead_name: 'Pedro Cliente', lead_email: 'pedro@email.com', lead_phone: '+57 311 555 0001', lead_message: 'Interesado en el Local Kennedy.' },
        { property_id: props[2].id, owner_id: userId, lead_name: 'Laura Prospect', lead_email: 'laura@email.com', lead_phone: '+57 312 555 0002', lead_message: '¿Aceptan mascotas en la Casa Campestre?' },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completado',
      data: { userId, properties: props?.length || 0, tenants: tenants?.length || 0, contracts: contracts.length, payments: payments.length },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
