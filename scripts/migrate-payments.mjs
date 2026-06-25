// scripts/migrate-payments.js
// Drops the existing `payments` table (if any) and creates a fresh one
// with the columns the dashboard needs.
//
// Usage:
//   SUPABASE_ACCESS_TOKEN=xxx node scripts/migrate-payments.js
//
// Get your access token at: https://supabase.com/dashboard/account/tokens

require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'dinrxquxyyrygfkotqja';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is required.');
  console.error('   Get one at https://supabase.com/dashboard/account/tokens');
  console.error('   Then run:  SUPABASE_ACCESS_TOKEN=xxx node scripts/migrate-payments.js');
  process.exit(1);
}

const SQL = `
DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_name TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('Paid','Pending','Overdue','Failed')),
  invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update" ON public.payments;
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_delete" ON public.payments;
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (auth.uid() = user_id);
`;

async function run() {
  console.log('Migrating payments table...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('❌ Migration failed:', text);
    process.exit(1);
  }
  console.log('✅ Payments table migrated successfully.');
}

run();
