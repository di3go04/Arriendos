import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'demo@rentnow.com';
const DEMO_PASSWORD = 'RentNowDemo2026!';

async function createDemoUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Laura Administradora Demo', role: 'arrendador' },
  });

  if (error) {
    if (error.code === '422' || error.message?.includes('already')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === DEMO_EMAIL);
      if (existing) {
        console.log('Usuario demo ya existe, ID:', existing.id);
        return existing.id;
      }
      throw error;
    }
    throw error;
  }

  console.log('Usuario demo creado, ID:', data.user.id);
  return data.user.id;
}

async function runSeed(userId) {
  const queries = [
    `INSERT INTO public.profiles (id, full_name, phone, role, preferred_currency)
     VALUES ('${userId}', 'Laura Administradora Demo', '+57 300 000 0001', 'arrendador', 'COP')
     ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;`,

    `INSERT INTO public.properties (owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms, description, amenities, monthly_rent, deposit, available_from, status, image_urls)
     SELECT '${userId}', 'Apartamento Chapinero Alto', 'apartamento', 'Cra 7 #45-12', 'Bogotá', 85, 3, 2,
       'Hermoso apartamento con vista a los cerros orientales, cocina integral y balcón.',
       ARRAY['Portería','Parqueadero','Balcón','Calentador'], 2800000, 2800000, CURRENT_DATE, 'disponible', ARRAY[]::text[]
     WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Apartamento Chapinero Alto' AND owner_id = '${userId}');`,

    `INSERT INTO public.properties (owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms, description, amenities, monthly_rent, deposit, available_from, status, image_urls)
     SELECT '${userId}', 'Oficina Centro Internacional', 'oficina', 'Cra 13 #26-45', 'Bogotá', 120, 1, 1,
       'Oficina ejecutiva en edificio corporativo con seguridad 24h y parqueadero de visitantes.',
       ARRAY['Seguridad 24h','Parqueadero','Ascensor','Internet'], 3500000, 3500000, CURRENT_DATE, 'disponible', ARRAY[]::text[]
     WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Oficina Centro Internacional' AND owner_id = '${userId}');`,

    `INSERT INTO public.properties (owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms, description, amenities, monthly_rent, deposit, available_from, status, image_urls)
     SELECT '${userId}', 'Casa Usaquén', 'casa', 'Cra 6 #119-30', 'Bogotá', 200, 4, 3,
       'Casa colonial restaurada con jardín, chimenea y terraza. Ideal para familia.',
       ARRAY['Jardín','Chimenea','Terraza','Garaje','Calentador'], 5200000, 5200000, CURRENT_DATE, 'disponible', ARRAY[]::text[]
     WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Casa Usaquén' AND owner_id = '${userId}');`,
  ];

  for (const q of queries) {
    const { error } = await supabase.rpc('exec_sql', { query: q }).maybeSingle();
    if (error && !error.message?.includes('function')) {
      const { error: e2 } = await supabase.from('_seed_log').insert({ query: q.substring(0, 200) }).maybeSingle();
      if (e2) {
        const { error: direct } = await supabase.from('profiles').select('id').eq('id', userId).single();
        if (!direct) {
          const { error: raw } = await supabase.postgrest.rpc('exec_sql', { query: q }).maybeSingle();
          if (raw) console.warn('Seed query warning:', raw.message);
        }
      }
    }
  }

  const { data: props } = await supabase.from('properties').select('id, title').eq('owner_id', userId);
  if (!props || props.length === 0) {
    console.log('Usando inserción directa...');
    const { data: p1 } = await supabase.from('properties').insert({
      owner_id: userId, title: 'Apartamento Chapinero Alto', type: 'apartamento',
      address: 'Cra 7 #45-12', city: 'Bogotá', area_sqm: 85, bedrooms: 3, bathrooms: 2,
      description: 'Hermoso apartamento con vista a los cerros orientales.',
      amenities: ['Portería','Parqueadero','Balcón'], monthly_rent: 2800000, deposit: 2800000,
      available_from: new Date().toISOString(), status: 'disponible', image_urls: [],
    }).select();
    await supabase.from('properties').insert({
      owner_id: userId, title: 'Oficina Centro Internacional', type: 'oficina',
      address: 'Cra 13 #26-45', city: 'Bogotá', area_sqm: 120, bedrooms: 1, bathrooms: 1,
      description: 'Oficina ejecutiva en edificio corporativo.',
      amenities: ['Seguridad 24h','Parqueadero','Ascensor'], monthly_rent: 3500000, deposit: 3500000,
      available_from: new Date().toISOString(), status: 'disponible', image_urls: [],
    }).select();
    await supabase.from('properties').insert({
      owner_id: userId, title: 'Casa Usaquén', type: 'casa',
      address: 'Cra 6 #119-30', city: 'Bogotá', area_sqm: 200, bedrooms: 4, bathrooms: 3,
      description: 'Casa colonial restaurada con jardín, chimenea y terraza.',
      amenities: ['Jardín','Chimenea','Terraza','Garaje'], monthly_rent: 5200000, deposit: 5200000,
      available_from: new Date().toISOString(), status: 'disponible', image_urls: [],
    }).select();

    const { data: p } = await supabase.from('properties').select('id, title').eq('owner_id', userId);
    console.log(`Creadas ${p?.length || 0} propiedades`);
  } else {
    console.log(`Encontradas ${props.length} propiedades existentes`);
  }

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) {
    await supabase.from('tenants').insert([
      { name: 'Carlos Mendoza', email: 'carlos@ejemplo.com', phone: '+57 310 111 2233', document_id: 'CC-12345678' },
      { name: 'María Gómez', email: 'maria@ejemplo.com', phone: '+57 320 222 3344', document_id: 'CC-23456789' },
      { name: 'Andrés Ruiz', email: 'andres@ejemplo.com', phone: '+57 300 333 4455', document_id: 'CC-34567890' },
    ]);
  }
}

async function main() {
  console.log('=== RentNow — Seed Demo ===');
  const userId = await createDemoUser();
  await runSeed(userId);
  console.log('\n=== Seed completado exitosamente ===');
  console.log('\nCredenciales demo:');
  console.log('  Email:    demo@rentnow.com');
  console.log('  Password: RentNowDemo2026!');
  console.log('\nInicia el servidor:');
  console.log('  npm run dev');
  console.log('  Abre http://localhost:3000');
}

main().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
