// scripts/seed-payments.js
// Seed the `payments` table with demo data for the RentNow dashboard.
// Usage: node scripts/seed-payments.js
//
// Prerequisites:
//   1. Run sql/create-payments.sql in Supabase SQL Editor FIRST
//   2. .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
//   3. A user with email demo@rentnow.app exists (or set USER_ID=xxx)

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const PAYMENTS = [
  { tenant_name: 'Carlos López', property_name: 'Edif. Mediterráneo', amount: 1500000, status: 'Paid', date: daysAgo(2) },
  { tenant_name: 'Carlos López', property_name: 'Edif. Mediterráneo', amount: 1500000, status: 'Paid', date: daysAgo(34) },
  { tenant_name: 'Laura Pérez', property_name: 'Apartamento 1401', amount: 4800000, status: 'Paid', date: daysAgo(5) },
  { tenant_name: 'Laura Pérez', property_name: 'Apartamento 1401', amount: 4800000, status: 'Paid', date: daysAgo(37) },
  { tenant_name: 'María García', property_name: 'Casa Laureles', amount: 3200000, status: 'Paid', date: daysAgo(15) },
  { tenant_name: 'Andrés Medina', property_name: 'Coliving Poblado', amount: 1200000, status: 'Paid', date: daysAgo(60) },
  { tenant_name: 'María García', property_name: 'Casa Laureles', amount: 3200000, status: 'Pending', date: daysAgo(7) },
  { tenant_name: 'Pedro Ramírez', property_name: 'Local Centro', amount: 2500000, status: 'Pending', date: daysAgo(3) },
  { tenant_name: 'Sofía Herrera', property_name: 'Oficina Norte', amount: 1800000, status: 'Pending', date: daysAgo(10) },
  { tenant_name: 'Andrés Medina', property_name: 'Coliving Poblado', amount: 1200000, status: 'Overdue', date: daysAgo(30) },
  { tenant_name: 'Roberto Vega', property_name: 'Casa Sur', amount: 2200000, status: 'Overdue', date: daysAgo(45) },
  { tenant_name: 'Ana Torres', property_name: 'Estudio Centro', amount: 950000, status: 'Failed', date: daysAgo(1) },
];

async function seed() {
  let userId = process.env.USER_ID;

  if (!userId) {
    console.log('Looking up user demo@rentnow.app...');
    const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
      email: 'demo@rentnow.app',
      password: process.env.DEMO_PASSWORD || 'Demo123!',
    });
    if (signInErr) {
      console.error('Could not sign in as demo@rentnow.app.', signInErr.message);
      console.error('Provide USER_ID env var:  USER_ID=xxx node scripts/seed-payments.js');
      process.exit(1);
    }
    userId = signIn.user.id;
    console.log(`Found user: ${signIn.user.email} (${userId})`);
  }

  // Check if new columns exist
  const { error: colCheck } = await supabase.from('payments').select('property_name').limit(1);
  if (colCheck && colCheck.message?.includes('Could not find')) {
    console.error('❌ The payments table needs migration. Run the SQL in sql/create-payments.sql first.');
    console.error('   Open: https://supabase.com/dashboard/project/dinrxquxyyrygfkotqja/sql/new');
    console.error('   Paste the contents of sql/create-payments.sql and click Run.');
    process.exit(1);
  }

  // Clear existing seeds for this user
  const { error: delErr } = await supabase.from('payments').delete().eq('user_id', userId);
  if (delErr) console.warn('Could not clear existing payments:', delErr.message);

  // Insert all payments
  const rows = PAYMENTS.map(p => ({
    user_id: userId,
    property_name: p.property_name,
    tenant_name: p.tenant_name,
    amount: p.amount,
    date: p.date,
    status: p.status,
  }));

  const { error: insErr } = await supabase.from('payments').insert(rows);
  if (insErr) {
    console.error('Error inserting payments:', insErr.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${rows.length} payments successfully.`);
  process.exit(0);
}

seed();
