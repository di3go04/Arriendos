/**
 * Script Maestro de Semillas — RentNow Demo
 * 
 * Uso: node scripts/seed-demo.mjs
 * 
 * Requiere las variables de entorno en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * El script:
 * 1. Crea/actualiza el usuario demo@rentnow.app en Supabase Auth
 * 2. Limpia datos antiguos
 * 3. Inserta propiedades, contratos, pagos, notificaciones, ubicaciones
 */

import { createClient } from '@supabase/supabase-js'

// ─── Configuración ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dinrxquxyyrygfkotqja.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno. Crea .env.local con:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_EMAIL = 'demo@rentnow.app'
const DEMO_PASSWORD = 'Demo123!'

// ─── Coordenadas realistas ───
const COORDS = {
  chapinero: { lat: 4.6538, lng: -74.0641 },
  laureles: { lat: 6.2442, lng: -75.5812 },
  kennedy: { lat: 4.6270, lng: -74.1565 },
  norte: { lat: 4.7110, lng: -74.0721 },
  sabana: { lat: 4.8590, lng: -74.0591 },
}

// ─── Main ───
async function main() {
  console.log('🚀 Iniciando seed de datos demo...\n')

  // 1. Crear/actualizar usuario demo
  console.log('1️⃣  Creando usuario demo...')
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === DEMO_EMAIL)
  
  let userId
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    userId = existing.id
    console.log(`   ✓ Usuario existente actualizado: ${userId}`)
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Carlos Demo', role: 'arrendador' },
    })
    if (error) throw error
    userId = newUser.user.id
    console.log(`   ✓ Nuevo usuario creado: ${userId}`)
  }

  // 2. Upsert profile
  console.log('2️⃣  Creando perfil...')
  await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Carlos Demo',
    email: DEMO_EMAIL,
    phone: '+57 300 111 2233',
    role: 'arrendador',
    preferred_currency: 'COP',
  }, { onConflict: 'id' })
  console.log('   ✓ Perfil creado')

  // 3. Limpiar datos antiguos
  console.log('3️⃣  Limpiando datos antiguos...')
  const tablesToClean = ['payments', 'contracts', 'properties', 'notifications', 'tenants']
  for (const table of tablesToClean) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000')
    if (error && !error.message.includes('no rows')) {
      console.log(`   ⚠ ${table}: ${error.message}`)
    }
  }
  console.log('   ✓ Datos limpiados')

  // 4. Insertar propiedades
  console.log('4️⃣  Insertando 5 propiedades...')
  const properties = [
    {
      owner_id: userId, title: 'Apartamento Norte', type: 'apartamento',
      address: 'Calle 127 # 15-20', city: 'Bogotá', state: 'Cundinamarca', country: 'CO',
      lat: COORDS.norte.lat, lng: COORDS.norte.lng,
      area_sqm: 95, bedrooms: 3, bathrooms: 2,
      description: 'Apartamento moderno en el norte de Bogotá. Vista panorámica, gimnasio y piscina.',
      amenities: ['Gimnasio', 'Piscina', 'Parqueadero', 'Portería 24h', 'Balcón'],
      monthly_rent: 3200000, deposit: 3200000, status: 'ocupado', image_urls: [],
    },
    {
      owner_id: userId, title: 'Local Kennedy', type: 'local',
      address: 'Carrera 86 # 45-30', city: 'Bogotá', state: 'Cundinamarca', country: 'CO',
      lat: COORDS.kennedy.lat, lng: COORDS.kennedy.lng,
      area_sqm: 80, bedrooms: 0, bathrooms: 1,
      description: 'Local comercial en zona de alta tráfico. Ideal para restaurante o tienda.',
      amenities: ['Vitrina', 'Aire acondicionado', 'Bodega', 'Baño privado'],
      monthly_rent: 4500000, deposit: 4500000, status: 'disponible', image_urls: [],
    },
    {
      owner_id: userId, title: 'Casa Campestre', type: 'casa',
      address: 'Km 5 Via La Calera', city: 'La Calera', state: 'Cundinamarca', country: 'CO',
      lat: COORDS.sabana.lat, lng: COORDS.sabana.lng,
      area_sqm: 220, bedrooms: 4, bathrooms: 3,
      description: 'Casa campestre con jardín amplio, zona de BBQ y vista a los cerros.',
      amenities: ['Jardín', 'BBQ', 'Fireplace', 'Garaje 2 autos', 'Sistema de seguridad'],
      monthly_rent: 5500000, deposit: 5500000, status: 'disponible', image_urls: [],
    },
    {
      owner_id: userId, title: 'Apartamento Chapinero', type: 'apartamento',
      address: 'Carrera 11 # 70-30', city: 'Bogotá', state: 'Cundinamarca', country: 'CO',
      lat: COORDS.chapinero.lat, lng: COORDS.chapinero.lng,
      area_sqm: 72, bedrooms: 2, bathrooms: 2,
      description: 'Acogedor apartamento en Chapinero. Cerca a universidades y transporte.',
      amenities: ['Portería', 'Parqueadero', 'Ascensor', 'Citófono'],
      monthly_rent: 2100000, deposit: 2100000, status: 'ocupado', image_urls: [],
    },
    {
      owner_id: userId, title: 'Casa Laureles', type: 'casa',
      address: 'Calle 35 # 80-15', city: 'Medellín', state: 'Antioquia', country: 'CO',
      lat: COORDS.laureles.lat, lng: COORDS.laureles.lng,
      area_sqm: 180, bedrooms: 4, bathrooms: 3,
      description: 'Elegante casa en Laureles. Jardín privado, zona de parrilla y seguridad 24h.',
      amenities: ['Jardín', 'Parqueadero', 'Zona de parrilla', 'Seguridad 24h', 'Cocina integral'],
      monthly_rent: 3800000, deposit: 3800000, status: 'ocupado', image_urls: [],
    },
  ]

  const { data: createdProps, error: propsError } = await supabase
    .from('properties').insert(properties).select()
  if (propsError) {
    console.error('   ❌ Error insertando propiedades:', propsError.message)
  } else {
    console.log(`   ✓ ${createdProps.length} propiedades insertadas`)
  }

  // 5. Insertar inquilinos
  console.log('5️⃣  Insertando inquilinos...')
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants').insert([
      { name: 'Ana María López', email: 'ana.lopez@email.com', phone: '+57 300 444 5566', document_id: 'CC 1023456789', notes: 'Inquilina ejemplar, pagos puntuales' },
      { name: 'María García Ruiz', email: 'maria.garcia@email.com', phone: '+57 310 777 8899', document_id: 'CC 1098765432', notes: 'Contrato anual renovable' },
      { name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', phone: '+57 320 222 3344', document_id: 'CC 1034567890', notes: 'Nuevo inquilino, primer contrato' },
    ]).select()
  if (tenantsError) {
    console.error('   ❌ Error insertando inquilinos:', tenantsError.message)
  } else {
    console.log(`   ✓ ${tenants.length} inquilinos insertados`)
  }

  // 6. Insertar contratos
  console.log('6️⃣  Insertando contratos...')
  const now = new Date()
  const contracts = []
  
  if (createdProps && createdProps.length >= 3 && tenants && tenants.length >= 3) {
    const contractData = [
      { propIdx: 0, tenantIdx: 0, status: 'activo', monthsAgo: 6, rent: 3200000, number: 'RENT-2026-001' },
      { propIdx: 3, tenantIdx: 1, status: 'activo', monthsAgo: 4, rent: 2100000, number: 'RENT-2026-002' },
      { propIdx: 4, tenantIdx: 2, status: 'pendiente_firma', monthsAgo: 0, rent: 3800000, number: 'RENT-2026-003' },
    ]

    for (const c of contractData) {
      const start = new Date(now); start.setMonth(start.getMonth() - c.monthsAgo)
      const end = new Date(start); end.setFullYear(end.getFullYear() + 1)
      
      const { data: contract, error } = await supabase.from('contracts').insert({
        property_id: createdProps[c.propIdx].id,
        landlord_id: userId,
        tenant_id: tenants[c.tenantIdx].id,
        contract_number: c.number,
        status: c.status,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        monthly_rent: c.rent,
        deposit: c.rent,
        payment_day: 5,
        contract_content: `<h1>Contrato de Arrendamiento ${c.number}</h1><p>Contrato entre Carlos Demo y ${tenants[c.tenantIdx].name} para ${createdProps[c.propIdx].title}.</p>`,
      }).select().single()
      
      if (error) {
        console.error(`   ❌ Contrato ${c.number}: ${error.message}`)
      } else {
        contracts.push(contract)
        console.log(`   ✓ Contrato ${c.number} (${c.status})`)
      }
    }
  }

  // 7. Insertar pagos (12 registros, últimos 3 meses)
  console.log('7️⃣  Insertando pagos...')
  let paymentsInserted = 0
  if (contracts.length > 0 && tenants.length > 0) {
    const payments = []
    
    // 4 pagos por contrato activo (3 meses pasados + actual)
    for (let ci = 0; ci < Math.min(contracts.length, 2); ci++) {
      const c = contracts[ci]
      const t = tenants[ci]
      
      for (let m = 3; m >= 0; m--) {
        const date = new Date(now); date.setMonth(date.getMonth() - m)
        const dueDate = new Date(date); dueDate.setDate(5)
        const isPaid = m > 0 // Mes actual = pendiente
        const isOverdue = m === 1 && ci === 1 // Un pago atrasado
        
        payments.push({
          contract_id: c.id,
          tenant_id: t.id,
          amount: c.monthly_rent,
          due_date: dueDate.toISOString().split('T')[0],
          paid: isPaid && !isOverdue,
          paid_at: isPaid && !isOverdue ? dueDate.toISOString() : null,
          month_year: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        })
      }
    }

    // Pagos extra para que sean 12+
    for (let ci = 0; ci < Math.min(contracts.length, 2); ci++) {
      const c = contracts[ci]
      const t = tenants[ci]
      for (let m = 5; m >= 4; m--) {
        const date = new Date(now); date.setMonth(date.getMonth() - m)
        const dueDate = new Date(date); dueDate.setDate(5)
        payments.push({
          contract_id: c.id,
          tenant_id: t.id,
          amount: c.monthly_rent,
          due_date: dueDate.toISOString().split('T')[0],
          paid: true,
          paid_at: dueDate.toISOString(),
          month_year: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        })
      }
    }

    const { error: payError } = await supabase.from('payments').insert(payments)
    if (payError) {
      console.error('   ❌ Error insertando pagos:', payError.message)
    } else {
      paymentsInserted = payments.length
      console.log(`   ✓ ${paymentsInserted} pagos insertados`)
    }
  }

  // 8. Insertar notificaciones
  console.log('8️⃣  Insertando notificaciones...')
  const { error: notifError } = await supabase.from('notifications').insert([
    { user_id: userId, title: 'Bienvenido a RentNow', message: 'Tu cuenta demo está lista. Explora todas las funcionalidades.', type: 'success', read: false },
    { user_id: userId, title: 'Pago recibido', message: 'Ana María López pagó $3,200,000 (Apartamento Norte).', type: 'payment', read: false },
    { user_id: userId, title: 'Pago recibido', message: 'María García pagó $2,100,000 (Apartamento Chapinero).', type: 'payment', read: false },
    { user_id: userId, title: 'Pago vencido', message: 'María García tiene un pago atrasado de $2,100,000.', type: 'warning', read: false },
    { user_id: userId, title: 'Contrato pendiente', message: 'El contrato RENT-2026-003 (Casa Laureles) requiere firma.', type: 'info', read: false },
    { user_id: userId, title: 'Nueva consulta', message: 'Lead Demo solicitó info sobre Local Kennedy.', type: 'info', read: true },
  ])
  if (notifError) {
    console.error('   ⚠ Notificaciones:', notifError.message)
  } else {
    console.log('   ✓ 6 notificaciones insertadas')
  }

  // 9. Leads
  console.log('9️⃣  Insertando leads...')
  if (createdProps && createdProps.length > 0) {
    const { error: leadError } = await supabase.from('property_leads').insert([
      { property_id: createdProps[1].id, owner_id: userId, lead_name: 'Pedro Cliente', lead_email: 'pedro@email.com', lead_phone: '+57 311 555 0001', lead_message: 'Interesado en el Local Kennedy. ¿Disponible para visita?' },
      { property_id: createdProps[2].id, owner_id: userId, lead_name: 'Laura Prospect', lead_email: 'laura@email.com', lead_phone: '+57 312 555 0002', lead_message: 'Me gusta la Casa Campestre. ¿Aceptan mascotas?' },
    ])
    if (leadError) {
      console.log('   ⚠ Leads:', leadError.message)
    } else {
      console.log('   ✓ 2 leads insertados')
    }
  }

  console.log('\n✅ Seed completado!')
  console.log(`   Usuario: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  console.log(`   Propiedades: ${createdProps?.length || 0}`)
  console.log(`   Inquilinos: ${tenants?.length || 0}`)
  console.log(`   Contratos: ${contracts.length}`)
  console.log(`   Pagos: ${paymentsInserted}`)
  console.log(`   Notificaciones: 6`)
  console.log('\n🚀 Prueba el demo en: https://arriendos-kappa.vercel.app/login-direct')
}

main().catch(e => {
  console.error('❌ Error fatal:', e.message)
  process.exit(1)
})
