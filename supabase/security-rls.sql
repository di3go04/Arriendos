-- ============================================================
-- SECURITY PATCH: RLS for all unprotected tables
-- Run this in Supabase SQL Editor (SQL Editor > New Query)
-- ============================================================

-- Enable RLS on tables that lack it
ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solvency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS open_banking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dashboard_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vapi_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS voice_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_impersonation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth_user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_signature_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_exports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- OWNER-ONLY POLICIES (user_id column present)
-- ============================================================

CREATE POLICY "owner_select" ON bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON bank_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON bank_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON kyc_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON kyc_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON solvency_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON solvency_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON solvency_scores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON solvency_scores FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON open_banking_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON open_banking_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON open_banking_links FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON open_banking_links FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON dashboard_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON dashboard_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON dashboard_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON dashboard_alerts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON dashboard_metrics_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON dashboard_metrics_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON dashboard_metrics_cache FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON dashboard_metrics_cache FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON reas_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON reas_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON reas_subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON reas_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "owner_select" ON ai_generation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON ai_generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_select" ON contract_signature_audit FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON contract_signature_audit FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_select" ON auth_login_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_select" ON auth_user_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON auth_user_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON auth_user_devices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ADMIN-ONLY POLICIES (sensitive system tables)
-- ============================================================

CREATE POLICY "admin_all" ON configuracion_sistema FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_all" ON api_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_all" ON audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_all" ON backup_exports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_all" ON admin_impersonation_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- payment_commitments: tenant + admin access
-- ============================================================
CREATE POLICY "tenant_or_admin_select" ON payment_commitments FOR SELECT USING (
  auth.uid()::text = tenant_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tenant_or_admin_insert" ON payment_commitments FOR INSERT WITH CHECK (
  auth.uid()::text = tenant_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tenant_or_admin_update" ON payment_commitments FOR UPDATE USING (
  auth.uid()::text = tenant_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  auth.uid()::text = tenant_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- Make KYC storage bucket private
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'kyc_documents';
