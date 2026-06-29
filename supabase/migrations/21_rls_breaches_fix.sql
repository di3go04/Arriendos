-- Migration 21: RLS Breaches Fix
-- ============================================================
-- Cierra las 19 tablas que estaban sin RLS habilitada.
-- Tablas críticas expuestas:
--   kyc_documents, bank_accounts, bank_transactions, open_banking_links,
--   payment_commitments, solvency_scores, reas_subscriptions,
--   whatsapp_message_queue, reconciliation_matches,
--   property_views, property_tours, property_embeddings, property_esg_scores,
--   iot_readings, iot_alerts,
--   dashboard_alerts, dashboard_metrics_cache,
--   system_events, feature_flags
--
-- Patrón de políticas:
--   - Tablas con user_id → solo el dueño puede leer/escribir
--   - Tablas con organization_id → miembros de la org
--   - Tablas operacionales (system_events, feature_flags) → solo admins
--   - Tablas con property_id → el owner de la propiedad
-- ============================================================

-- ============================================================
-- 1. CRÍTICAS: Datos financieros / KYC / PII
-- ============================================================

-- 1.1 open_banking_links (Belvo link IDs)
ALTER TABLE public.open_banking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_open_banking_links"
  ON public.open_banking_links FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_open_banking_links"
  ON public.open_banking_links FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_open_banking_links"
  ON public.open_banking_links FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_open_banking_links"
  ON public.open_banking_links FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 1.2 solvency_scores (scores financieros)
ALTER TABLE public.solvency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_solvency_scores"
  ON public.solvency_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_solvency_scores"
  ON public.solvency_scores FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_solvency_scores"
  ON public.solvency_scores FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_solvency_scores"
  ON public.solvency_scores FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 1.3 kyc_documents (cédulas, pasaportes, selfies)
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_kyc_documents"
  ON public.kyc_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_kyc_documents"
  ON public.kyc_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_kyc_documents"
  ON public.kyc_documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_kyc_documents"
  ON public.kyc_documents FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 1.4 payment_commitments (compromisos de pago)
ALTER TABLE public.payment_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_payment_commitments"
  ON public.payment_commitments FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE landlord_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_payment_commitments"
  ON public.payment_commitments FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.contracts WHERE landlord_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_payment_commitments"
  ON public.payment_commitments FOR UPDATE TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE landlord_id = auth.uid()
    )
  )
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.contracts WHERE landlord_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_payment_commitments"
  ON public.payment_commitments FOR DELETE TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE landlord_id = auth.uid()
    )
  );

-- 1.5 reas_subscriptions (suscripciones REaaS)
ALTER TABLE public.reas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_reas_subscriptions"
  ON public.reas_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_reas_subscriptions"
  ON public.reas_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_reas_subscriptions"
  ON public.reas_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_reas_subscriptions"
  ON public.reas_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 1.6 whatsapp_message_queue (cola de mensajes WhatsApp con teléfonos)
ALTER TABLE public.whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_whatsapp_queue"
  ON public.whatsapp_message_queue FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_whatsapp_queue"
  ON public.whatsapp_message_queue FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_whatsapp_queue"
  ON public.whatsapp_message_queue FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_whatsapp_queue"
  ON public.whatsapp_message_queue FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2. CRÍTICAS: Bank accounts y transactions (organización)
-- ============================================================

-- 2.1 bank_accounts (cuentas bancarias)
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select_bank_accounts"
  ON public.bank_accounts FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations
      WHERE owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organizations.id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "org_owners_insert_bank_accounts"
  ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "org_owners_update_bank_accounts"
  ON public.bank_accounts FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "org_owners_delete_bank_accounts"
  ON public.bank_accounts FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- 2.2 bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select_bank_transactions"
  ON public.bank_transactions FOR SELECT TO authenticated
  USING (
    bank_account_id IN (
      SELECT ba.id FROM public.bank_accounts ba
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = o.id AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "org_owners_insert_bank_transactions"
  ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (
    bank_account_id IN (
      SELECT ba.id FROM public.bank_accounts ba
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE POLICY "org_owners_delete_bank_transactions"
  ON public.bank_transactions FOR DELETE TO authenticated
  USING (
    bank_account_id IN (
      SELECT ba.id FROM public.bank_accounts ba
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- 2.3 reconciliation_matches
ALTER TABLE public.reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select_reconciliation_matches"
  ON public.reconciliation_matches FOR SELECT TO authenticated
  USING (
    bank_transaction_id IN (
      SELECT bt.id FROM public.bank_transactions bt
      JOIN public.bank_accounts ba ON ba.id = bt.bank_account_id
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = o.id AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "org_owners_insert_reconciliation_matches"
  ON public.reconciliation_matches FOR INSERT TO authenticated
  WITH CHECK (
    bank_transaction_id IN (
      SELECT bt.id FROM public.bank_transactions bt
      JOIN public.bank_accounts ba ON ba.id = bt.bank_account_id
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE POLICY "org_owners_delete_reconciliation_matches"
  ON public.reconciliation_matches FOR DELETE TO authenticated
  USING (
    bank_transaction_id IN (
      SELECT bt.id FROM public.bank_transactions bt
      JOIN public.bank_accounts ba ON ba.id = bt.bank_account_id
      JOIN public.organizations o ON o.id = ba.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. MEDIAS: Datos operacionales de propiedades
-- ============================================================

-- 3.1 property_views (tracking de vistas)
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_property_views"
  ON public.property_views FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "authenticated_insert_property_views"
  ON public.property_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners_delete_property_views"
  ON public.property_views FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- 3.2 property_tours
ALTER TABLE public.property_tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_property_tours"
  ON public.property_tours FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_property_tours"
  ON public.property_tours FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_property_tours"
  ON public.property_tours FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_property_tours"
  ON public.property_tours FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- 3.3 property_embeddings (vector embeddings)
ALTER TABLE public.property_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_property_embeddings"
  ON public.property_embeddings FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_property_embeddings"
  ON public.property_embeddings FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_property_embeddings"
  ON public.property_embeddings FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_property_embeddings"
  ON public.property_embeddings FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- 3.4 property_esg_scores
ALTER TABLE public.property_esg_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_property_esg_scores"
  ON public.property_esg_scores FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_property_esg_scores"
  ON public.property_esg_scores FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_property_esg_scores"
  ON public.property_esg_scores FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_property_esg_scores"
  ON public.property_esg_scores FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- 3.5 iot_readings
ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_iot_readings"
  ON public.iot_readings FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_iot_readings"
  ON public.iot_readings FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_iot_readings"
  ON public.iot_readings FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- 3.6 iot_alerts
ALTER TABLE public.iot_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_iot_alerts"
  ON public.iot_alerts FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_iot_alerts"
  ON public.iot_alerts FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_iot_alerts"
  ON public.iot_alerts FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_iot_alerts"
  ON public.iot_alerts FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. MEDIAS: Dashboard del usuario
-- ============================================================

-- 4.1 dashboard_alerts
ALTER TABLE public.dashboard_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_dashboard_alerts"
  ON public.dashboard_alerts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_dashboard_alerts"
  ON public.dashboard_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_dashboard_alerts"
  ON public.dashboard_alerts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_dashboard_alerts"
  ON public.dashboard_alerts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 4.2 dashboard_metrics_cache
ALTER TABLE public.dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_dashboard_metrics_cache"
  ON public.dashboard_metrics_cache FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_dashboard_metrics_cache"
  ON public.dashboard_metrics_cache FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_dashboard_metrics_cache"
  ON public.dashboard_metrics_cache FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_dashboard_metrics_cache"
  ON public.dashboard_metrics_cache FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. BAJAS: Operacional del sistema (solo admins)
-- ============================================================

-- 5.1 system_events (logs)
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_system_events"
  ON public.system_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "authenticated_insert_system_events"
  ON public.system_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admins_delete_system_events"
  ON public.system_events FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5.2 feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_feature_flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admins_manage_feature_flags"
  ON public.feature_flags FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 6. REVOCAR permisos del rol anon
-- ============================================================
-- Las tablas con datos sensibles NUNCA deben ser accesibles al rol anon
-- (usuarios no autenticados). Esto bloquea cualquier intento de acceso
-- público incluso si las políticas anteriores tuvieran un bug.

REVOKE ALL ON public.kyc_documents FROM anon;
REVOKE ALL ON public.bank_accounts FROM anon;
REVOKE ALL ON public.bank_transactions FROM anon;
REVOKE ALL ON public.open_banking_links FROM anon;
REVOKE ALL ON public.payment_commitments FROM anon;
REVOKE ALL ON public.solvency_scores FROM anon;
REVOKE ALL ON public.reas_subscriptions FROM anon;
REVOKE ALL ON public.whatsapp_message_queue FROM anon;
REVOKE ALL ON public.reconciliation_matches FROM anon;
REVOKE ALL ON public.dashboard_alerts FROM anon;
REVOKE ALL ON public.dashboard_metrics_cache FROM anon;
REVOKE ALL ON public.system_events FROM anon;
REVOKE ALL ON public.feature_flags FROM anon;
REVOKE ALL ON public.property_views FROM anon;
REVOKE ALL ON public.property_tours FROM anon;
REVOKE ALL ON public.property_embeddings FROM anon;
REVOKE ALL ON public.property_esg_scores FROM anon;
REVOKE ALL ON public.iot_readings FROM anon;
REVOKE ALL ON public.iot_alerts FROM anon;

-- ============================================================
-- 7. COMENTARIO DE AUDITORÍA
-- ============================================================
COMMENT ON MIGRATION '21_rls_breaches_fix' IS
'Closes 19 tables that were missing RLS after audit.
Critical tables (kyc_documents, bank_accounts, solvency_scores, etc.)
now require authenticated user + ownership.
System tables (system_events, feature_flags) restricted to admins.
Revoked ALL permissions from anon role on all 19 tables.
Reference: security audit 2026-06-29.';
