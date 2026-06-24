-- Migration 15: Componentes faltantes de las 7 brechas
-- Requiere: migraciones 01-14 ejecutadas

-- ============================================================
-- 1. ESG: Trigger para auto-calcular score al insertar consumo
-- ============================================================
CREATE OR REPLACE FUNCTION auto_calculate_esg()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score := LEAST(100, GREATEST(0,
    (NEW.energy_score * 0.4 + NEW.water_score * 0.35 + NEW.waste_score * 0.25)::INTEGER
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_esg ON property_esg_scores;
CREATE TRIGGER trg_auto_esg BEFORE INSERT OR UPDATE ON property_esg_scores
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_esg();

-- ============================================================
-- 2. IoT: Vista de métricas agregadas por propiedad
-- ============================================================
CREATE OR REPLACE VIEW v_iot_property_summary AS
SELECT
  property_id,
  COUNT(DISTINCT sensor_id) AS sensors_active,
  COUNT(*) FILTER (WHERE recorded_at > NOW() - INTERVAL '1 hour') AS readings_last_hour,
  MAX(recorded_at) AS last_reading_at,
  COUNT(*) FILTER (WHERE sensor_type = 'temperature' AND value > 35) AS high_temp_alerts
FROM iot_readings
GROUP BY property_id;

-- ============================================================
-- 3. REaaS: Vista de ocupación por propiedad
-- ============================================================
CREATE OR REPLACE VIEW v_reas_occupancy AS
SELECT
  p.id AS property_id,
  p.title,
  COUNT(pu.id) AS total_units,
  COUNT(pu.id) FILTER (WHERE pu.status = 'ocupado') AS occupied_units,
  CASE WHEN COUNT(pu.id) > 0
    THEN ROUND(COUNT(pu.id) FILTER (WHERE pu.status = 'ocupado')::NUMERIC / COUNT(pu.id) * 100, 1)
    ELSE 0
  END AS occupancy_pct
FROM properties p
LEFT JOIN property_units pu ON pu.property_id = p.id
GROUP BY p.id, p.title;

-- ============================================================
-- 4. Conciliación: Vista de pagos no conciliados
-- ============================================================
CREATE OR REPLACE VIEW v_unreconciled_payments AS
SELECT
  pm.id AS payment_id,
  pm.contract_id,
  pm.amount,
  pm.due_date,
  pm.paid_at,
  btx.id AS bank_tx_id,
  btx.amount AS bank_amount,
  btx.transaction_date,
  btx.description AS bank_description,
  ABS(pm.amount - btx.amount) AS diff_amount,
  CASE
    WHEN btx.id IS NULL THEN 'sin_match'
    WHEN rm.id IS NULL THEN 'unmatched'
    WHEN rm.status = 'pending' THEN 'pending_review'
    WHEN rm.status = 'confirmed' THEN 'confirmed'
    ELSE 'unknown'
  END AS reconciliation_status
FROM payments pm
LEFT JOIN reconciliation_matches rm ON rm.payment_id = pm.id
LEFT JOIN bank_transactions btx ON btx.id = rm.bank_transaction_id
WHERE pm.paid = true;

-- ============================================================
-- 5. Feature Flags: tabla de control para rollout
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_pct INTEGER NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO feature_flags (feature_key, enabled, rollout_pct, description) VALUES
  ('open_banking_kyc', false, 0, 'Verificación de solvencia con Belvo + KYC biométrico'),
  ('voice_agents', false, 0, 'Cobranza automatizada con Voice Agents IA'),
  ('reas', false, 0, 'Modelo de suscripción flexible REaaS (coliving/flex)'),
  ('virtual_tours', false, 0, 'Recorridos virtuales 360° con Matterport'),
  ('iot_predictive', false, 0, 'Mantenimiento predictivo con sensores IoT'),
  ('esg', false, 0, 'Métrica de sostenibilidad ESG con certificaciones'),
  ('recommendations', false, 0, 'Recomendación personalizada de propiedades'),
  ('pricing_ai', false, 0, 'Sugerencia dinámica de precios por IA'),
  ('reconciliation', false, 0, 'Conciliación bancaria automática con Belvo')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================
-- 6. Auditoría: tabla de eventos del sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type, created_at DESC);

-- ============================================================
-- 7. Añadir columnas faltantes a profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_kyc_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_onboarding_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
