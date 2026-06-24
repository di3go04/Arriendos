-- Migration 04: New Features - Maintenance, Accounting, Screening, Collections, Legal, Expenses, Tenant Portal, Market Intelligence

-- ============================================================
-- 1. MAINTENANCE MANAGEMENT ENHANCED
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.maintenance_issues ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority text CHECK (priority IN ('low','medium','high','emergency')) DEFAULT 'medium',
  status text CHECK (status IN ('pending','approved','assigned','in_progress','completed','cancelled')) DEFAULT 'pending',
  assigned_to uuid REFERENCES public.profiles ON DELETE SET NULL,
  category text DEFAULT 'general',
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  scheduled_date timestamptz,
  completed_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  categories text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  is_preferred boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. ACCOUNTING INTEGRATION (QuickBooks/Xero)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounting_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  provider text CHECK (provider IN ('quickbooks','xero')) NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  realm_id text,
  tenant_id text,
  organization_name text,
  is_active boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(landlord_id, provider)
);

CREATE TABLE IF NOT EXISTS public.accounting_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  sync_type text CHECK (sync_type IN ('invoices','payments','expenses','manual')),
  status text CHECK (status IN ('success','failed','pending')) DEFAULT 'pending',
  records_synced int DEFAULT 0,
  error_message text,
  synced_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. TENANT SCREENING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_screening_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  screen_for uuid REFERENCES public.profiles ON DELETE CASCADE, -- null if external
  screen_for_name text NOT NULL,
  screen_for_email text,
  screen_for_phone text,
  status text CHECK (status IN ('pending','in_progress','completed','failed')) DEFAULT 'pending',
  income_verified boolean DEFAULT false,
  credit_score_range text,
  background_check_passed boolean,
  eviction_history boolean DEFAULT false,
  risk_score numeric CHECK (risk_score >= 0 AND risk_score <= 100),
  report_url text,
  notes text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================
-- 4. INTELLIGENT COLLECTIONS & DELINQUENCY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collection_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE NOT NULL,
  attempt_type text CHECK (attempt_type IN ('email','sms','push','payment_plan','manual_call')) NOT NULL,
  status text CHECK (status IN ('sent','opened','completed','failed')) DEFAULT 'sent',
  response_data jsonb,
  payment_plan jsonb, -- {installments: number, amounts: number[], due_dates: date[]}
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.late_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  grace_period_days int DEFAULT 5,
  fee_type text CHECK (fee_type IN ('fixed','percentage')) DEFAULT 'fixed',
  fee_amount numeric DEFAULT 0,
  fee_percentage numeric DEFAULT 0,
  max_fee numeric,
  apply_weekly boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. LEGAL COMPLIANCE & REGULATORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.legal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  type text CHECK (type IN ('lease_clause','eviction_guide','compliance_checklist','legal_notice','regulation_alert')) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  applicable_regions text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE,
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties ON DELETE CASCADE,
  check_type text NOT NULL,
  status text CHECK (status IN ('pending','passed','warning','failed')) DEFAULT 'pending',
  findings jsonb,
  checked_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. EXPENSE TRACKING & TAX PREPARATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties ON DELETE CASCADE,
  category text CHECK (category IN ('maintenance','utilities','insurance','taxes','management','renovation','legal','marketing','other')) NOT NULL,
  amount numeric NOT NULL,
  tax_deductible boolean DEFAULT true,
  description text,
  receipt_url text,
  vendor_name text,
  expense_date date NOT NULL,
  fiscal_year text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  fiscal_year text NOT NULL,
  total_income numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  net_income numeric DEFAULT 0,
  estimated_tax numeric DEFAULT 0,
  tax_deductible_expenses numeric DEFAULT 0,
  status text CHECK (status IN ('draft','ready','filed')) DEFAULT 'draft',
  report_data jsonb,
  generated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. TENANT ENGAGEMENT PORTAL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  category text CHECK (category IN ('maintenance','billing','general','emergency')) DEFAULT 'general',
  status text CHECK (status IN ('open','in_progress','waiting','resolved','closed')) DEFAULT 'open',
  priority text CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  assigned_to uuid REFERENCES public.profiles ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tenant_tickets ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.amenity_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  amenity text NOT NULL,
  booked_date date NOT NULL,
  start_time time,
  end_time time,
  status text CHECK (status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE,
  satisfaction_score int CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  would_renew boolean,
  feedback text,
  submitted_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. MARKET INTELLIGENCE & RENT OPTIMIZATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  property_type text NOT NULL,
  avg_price_per_sqm numeric,
  median_rent numeric,
  sample_size int,
  source text DEFAULT 'internal',
  recorded_at date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.rent_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  current_rent numeric NOT NULL,
  recommended_rent numeric,
  market_avg_rent numeric,
  min_rent_range numeric,
  max_rent_range numeric,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 100),
  factors jsonb,
  generated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS POLICIES for new tables
-- ============================================================
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_screening_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_recommendations ENABLE ROW LEVEL SECURITY;

-- Maintenance work orders: landlord sees own, tenant sees from their property
CREATE POLICY "work_orders_landlord_access" ON public.maintenance_work_orders
  FOR ALL TO authenticated USING (
    landlord_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

CREATE POLICY "work_orders_tenant_read" ON public.maintenance_work_orders
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE property_id = maintenance_work_orders.property_id AND tenant_id = auth.uid())
  );

-- Maintenance vendors: landlord manages own
CREATE POLICY "vendors_landlord_access" ON public.maintenance_vendors
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Accounting connections: landlord manages own
CREATE POLICY "accounting_connections_owner" ON public.accounting_connections
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

CREATE POLICY "accounting_sync_log_owner" ON public.accounting_sync_log
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Screening: landlord manages own
CREATE POLICY "screening_landlord_access" ON public.tenant_screening_requests
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

CREATE POLICY "screening_tenant_read" ON public.tenant_screening_requests
  FOR SELECT TO authenticated USING (screen_for = auth.uid());

-- Collections: landlord access
CREATE POLICY "collections_landlord" ON public.collection_attempts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE id = collection_attempts.contract_id AND landlord_id = auth.uid())
  );

CREATE POLICY "late_fee_rules_landlord" ON public.late_fee_rules
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Legal templates: public read
CREATE POLICY "legal_templates_read" ON public.legal_templates
  FOR SELECT TO authenticated USING (true);

-- Compliance checks: landlord access
CREATE POLICY "compliance_landlord" ON public.compliance_checks
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Expenses: landlord manages own, read for property owners
CREATE POLICY "expenses_landlord_access" ON public.expenses
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

CREATE POLICY "expenses_property_owner_read" ON public.expenses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = expenses.property_id AND owner_id = auth.uid())
  );

-- Tax reports: landlord manages own
CREATE POLICY "tax_reports_landlord" ON public.tax_reports
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Tenant tickets: either party sees and manages
CREATE POLICY "tickets_tenant_access" ON public.tenant_tickets
  FOR ALL TO authenticated USING (tenant_id = auth.uid());

CREATE POLICY "tickets_landlord_access" ON public.tenant_tickets
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Ticket messages: participants
CREATE POLICY "ticket_messages_participant" ON public.ticket_messages
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tenant_tickets WHERE id = ticket_id AND (tenant_id = auth.uid() OR landlord_id = auth.uid()))
  );

-- Amenity bookings: tenant manages own
CREATE POLICY "amenity_bookings_tenant" ON public.amenity_bookings
  FOR ALL TO authenticated USING (tenant_id = auth.uid());

CREATE POLICY "amenity_bookings_landlord_read" ON public.amenity_bookings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = amenity_bookings.property_id AND owner_id = auth.uid())
  );

-- Surveys: tenant submits own, landlord reads for property
CREATE POLICY "surveys_tenant" ON public.tenant_surveys
  FOR INSERT TO authenticated WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "surveys_landlord_read" ON public.tenant_surveys
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE id = tenant_surveys.contract_id AND landlord_id = auth.uid())
  );

-- Market prices: public read
CREATE POLICY "market_prices_read" ON public.market_prices
  FOR SELECT TO authenticated USING (true);

-- Rent recommendations: landlord manages own
CREATE POLICY "rent_recommendations_landlord" ON public.rent_recommendations
  FOR ALL TO authenticated USING (landlord_id = auth.uid());

-- Add new notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;