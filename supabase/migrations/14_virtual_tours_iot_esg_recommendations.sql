-- Migration 14: Virtual Tours, IoT, ESG, Recommendations, Dynamic Pricing, Reconciliation

-- ============================================================
-- 1. RECORRIDOS VIRTUALES 360°
-- ============================================================
CREATE TABLE IF NOT EXISTS property_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('matterport','kuula','threejs')),
  model_id TEXT NOT NULL,
  thumbnail_url TEXT,
  embed_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','processing','error')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tours_property ON property_tours(property_id);

-- ============================================================
-- 2. IoT / MANTENIMIENTO PREDICTIVO
-- ============================================================
CREATE TABLE IF NOT EXISTS iot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('temperature','humidity','water_flow','energy','gas')),
  value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iot_property_sensor ON iot_readings(property_id, sensor_type, recorded_at DESC);

CREATE TABLE IF NOT EXISTS iot_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  message TEXT NOT NULL,
  current_value NUMERIC(10,2) NOT NULL,
  threshold_value NUMERIC(10,2) NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iot_alerts_property ON iot_alerts(property_id, acknowledged);

-- ============================================================
-- 3. ESG / SOSTENIBILIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS property_esg_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  energy_kwh_year NUMERIC(12,2) NOT NULL DEFAULT 0,
  water_m3_year NUMERIC(12,2) NOT NULL DEFAULT 0,
  waste_kg_year NUMERIC(12,2) NOT NULL DEFAULT 0,
  carbon_footprint_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  certification TEXT NOT NULL DEFAULT 'ninguna' CHECK (certification IN ('edge','leed','ninguna')),
  energy_score INTEGER NOT NULL DEFAULT 0,
  water_score INTEGER NOT NULL DEFAULT 0,
  waste_score INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  last_assessment TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. RECOMENDACIONES (property_views + pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_views_user ON property_views(user_id, viewed_at DESC);

-- pgvector extension (requiere habilitación en Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS property_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_property ON property_embeddings(property_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON property_embeddings USING hnsw (embedding vector_cosine_ops);

-- Función RPC para búsqueda por similitud
CREATE OR REPLACE FUNCTION find_similar_properties(
  target_property_id UUID,
  match_limit INTEGER DEFAULT 6
) RETURNS TABLE(
  id UUID, title TEXT, monthly_rent NUMERIC, city TEXT, type TEXT,
  similarity FLOAT, thumbnail_url TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.monthly_rent, p.city, p.type,
    (1 - (pe.embedding <=> (SELECT embedding FROM property_embeddings WHERE property_id = target_property_id)))::FLOAT AS similarity,
    (p.images->>0) AS thumbnail_url
  FROM property_embeddings pe
  JOIN properties p ON p.id = pe.property_id
  WHERE pe.property_id != target_property_id
    AND p.status = 'disponible'
  ORDER BY similarity DESC
  LIMIT match_limit;
END;
$$;

-- ============================================================
-- 5. PRECIOS DINÁMICOS
-- ============================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS suggested_price NUMERIC(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_price_suggestion_at TIMESTAMPTZ;

-- ============================================================
-- 6. CONCILIACIÓN BANCARIA
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL,
  account_name TEXT NOT NULL,
  belvo_link_id TEXT,
  last_synced_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','error','disconnected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  transaction_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  reference TEXT,
  UNIQUE(external_id, bank_account_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_tx_account ON bank_transactions(bank_account_id, transaction_date DESC);

CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_matches(status);
