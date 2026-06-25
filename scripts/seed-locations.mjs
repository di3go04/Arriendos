// scripts/seed-locations.js
// Seed the `locations` table in Supabase with initial data
// Usage: node scripts/seed-locations.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const LOCATIONS = [
  // Colombia
  { country: 'Colombia', department: 'Antioquia',   city: 'Medellín',      lat: 6.2476,  lng: -75.5658 },
  { country: 'Colombia', department: 'Cundinamarca', city: 'Bogotá',        lat: 4.7110,  lng: -74.0721 },
  { country: 'Colombia', department: 'Bolívar',      city: 'Cartagena',     lat: 10.3910, lng: -75.5144 },
  { country: 'Colombia', department: 'Valle del Cauca', city: 'Cali',       lat: 3.4516,  lng: -76.5320 },
  { country: 'Colombia', department: 'Atlántico',    city: 'Barranquilla',  lat: 10.9685, lng: -74.7813 },
  { country: 'Colombia', department: 'Santander',    city: 'Bucaramanga',   lat: 7.1254,  lng: -73.1198 },
  // México
  { country: 'México', department: 'CDMX',          city: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
  { country: 'México', department: 'Quintana Roo',   city: 'Cancún',       lat: 21.1619, lng: -86.8515 },
  { country: 'México', department: 'Nuevo León',     city: 'Monterrey',    lat: 25.6866, lng: -100.3161 },
  { country: 'México', department: 'Jalisco',        city: 'Guadalajara',  lat: 20.6597, lng: -103.3496 },
  // Argentina
  { country: 'Argentina', department: 'Buenos Aires', city: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { country: 'Argentina', department: 'Córdoba',     city: 'Córdoba',      lat: -31.4201, lng: -64.1888 },
  { country: 'Argentina', department: 'Santa Fe',    city: 'Rosario',      lat: -32.9468, lng: -60.6393 },
  // España
  { country: 'España', department: 'Madrid',         city: 'Madrid',       lat: 40.4168, lng: -3.7038 },
  { country: 'España', department: 'Barcelona',      city: 'Barcelona',    lat: 41.3874, lng: 2.1686 },
  { country: 'España', department: 'Valencia',       city: 'Valencia',     lat: 39.4699, lng: -0.3763 },
  // Estados Unidos
  { country: 'Estados Unidos', department: 'California',  city: 'Los Ángeles',    lat: 34.0522, lng: -118.2437 },
  { country: 'Estados Unidos', department: 'California',  city: 'San Francisco',  lat: 37.7749, lng: -122.4194 },
  { country: 'Estados Unidos', department: 'Florida',     city: 'Miami',          lat: 25.7617, lng: -80.1918 },
  { country: 'Estados Unidos', department: 'New York',    city: 'Nueva York',     lat: 40.7128, lng: -74.0060 },
];

async function seed() {
  console.log(`Seeding ${LOCATIONS.length} locations...`);

  // Clear existing data first (optional)
  const { error: delErr } = await supabase.from('locations').delete().neq('id', 0);
  if (delErr) console.warn('Clear warning (table may be empty):', delErr.message);

  const { data, error } = await supabase.from('locations').insert(LOCATIONS).select();

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} locations successfully.`);
}

seed();
