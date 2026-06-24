-- Tablas de pagos y suscripciones para Mercado Pago
-- Ejecutar después de 01_migration_schema.sql

-- Payment Transactions (para tracking de pagos individuales)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  plan_id text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending', -- pending, approved, rejected, refunded, cancelled, disputed
  mp_preference_id text,
  mp_payment_id text,
  mp_preapproval_id text,
  mp_status text,
  mp_status_detail text,
  external_reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions (para suscripciones activas)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id text NOT NULL,
  status text DEFAULT 'active', -- active, cancelled, past_due, paused
  mp_preapproval_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Orgs (para multi-tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  brand_color text DEFAULT '#1E3A5F',
  custom_domain text,
  owner_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member', -- admin, member
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (true)
  WITH CHECK (true);

CREATE POLICY "Organization members can view org" ON public.organizations
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Organization owners can manage org" ON public.organizations
  FOR ALL TO authenticated USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());