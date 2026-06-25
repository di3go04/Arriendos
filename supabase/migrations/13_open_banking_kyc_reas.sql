-- Migration 13: Open Banking, KYC, REaaS, Voice Agents, Dashboard Alerts
-- Requiere: migraciones 01-12 ejecutadas

-- ============================================================
-- 1. OPEN BANKING
-- ============================================================
CREATE TABLE IF NOT EXISTS open_banking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belvo_link_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','connected','error','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS solvency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved','rejected','pending_review')),
  avg_monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_monthly_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  debt_to_income_ratio NUMERIC(5,4) NOT NULL DEFAULT 0,
  max_recommended_rent NUMERIC(12,2) NOT NULL DEFAULT 0,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solvency_scores_user ON solvency_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_open_banking_links_user ON open_banking_links(user_id);

-- ============================================================
-- 2. REaaS (Real Estate as a Service)
-- ============================================================
CREATE TABLE IF NOT EXISTS reas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('coliving_room','flex_lease','senior_living','full_property')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','past_due','trialing')),
  price_per_month NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  min_months INTEGER NOT NULL DEFAULT 1,
  pause_months_used INTEGER NOT NULL DEFAULT 0,
  max_pause_months INTEGER NOT NULL DEFAULT 3,
  next_billing_date TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reas_user ON reas_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reas_property ON reas_subscriptions(property_id);
CREATE INDEX IF NOT EXISTS idx_reas_status ON reas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_reas_stripe_sub ON reas_subscriptions(stripe_subscription_id);

-- ============================================================
-- 3. KYC DIGITAL
-- ============================================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id','passport','driver_license')),
  document_number TEXT NOT NULL DEFAULT '',
  document_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','verified','rejected','expired')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
  face_match_score NUMERIC(4,3) NOT NULL DEFAULT 0,
  ocr_data JSONB NOT NULL DEFAULT '{}',
  provider_verification_id TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_provider ON kyc_documents(provider_verification_id);

-- ============================================================
-- 4. VOICE AGENTS — Compromisos de Pago
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  promised_amount NUMERIC(12,2) NOT NULL,
  promised_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','breached')),
  call_sid TEXT,
  call_transcript TEXT,
  intent_detected TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commitments_contract ON payment_commitments(contract_id);
CREATE INDEX IF NOT EXISTS idx_commitments_tenant ON payment_commitments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON payment_commitments(status);

-- ============================================================
-- 5. DASHBOARD — Alertas Predictivas + Caché de Métricas
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  threshold NUMERIC(12,2) NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON dashboard_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON dashboard_alerts(user_id, read);

CREATE TABLE IF NOT EXISTS dashboard_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  roi NUMERIC(10,4) NOT NULL DEFAULT 0,
  cashflow_month NUMERIC(12,2) NOT NULL DEFAULT 0,
  cashflow_year NUMERIC(12,2) NOT NULL DEFAULT 0,
  delinquency_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  occupancy_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  mrr NUMERIC(12,2) NOT NULL DEFAULT 0,
  arr NUMERIC(12,2) NOT NULL DEFAULT 0,
  collection_efficiency NUMERIC(6,3) NOT NULL DEFAULT 0,
  active_contracts INTEGER NOT NULL DEFAULT 0,
  total_properties INTEGER NOT NULL DEFAULT 0,
  total_tenants INTEGER NOT NULL DEFAULT 0,
  pending_maintenance INTEGER NOT NULL DEFAULT 0,
  avg_monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  projected_annual_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. CONFIGURACIÓN DE SISTEMA (claves de integración)
-- ============================================================
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS belvo_secret_id TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS belvo_secret_password TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS belvo_webhook_secret TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS twilio_from_number TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS voiceflow_api_key TEXT;
ALTER TABLE configuracion_sistema ADD COLUMN IF NOT EXISTS stripe_webhook_secret_reas TEXT;
