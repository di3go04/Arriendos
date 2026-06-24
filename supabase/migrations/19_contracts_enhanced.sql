-- Enhanced Contracts table for AI-powered module
-- Adds structured contract fields, signature tracking, and contract text storage

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,

  -- Identifiers
  contract_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'borrador'
    CHECK (status IN ('borrador', 'pendiente_firma', 'firmado', 'activo', 'finalizado', 'cancelado', 'vencido')),

  -- Financial
  monthly_rent NUMERIC(12, 2) NOT NULL,
  deposit NUMERIC(12, 2) DEFAULT 0,
  payment_day INTEGER NOT NULL DEFAULT 5 CHECK (payment_day BETWEEN 1 AND 31),
  late_fee_rate NUMERIC(5, 2) DEFAULT 1.5,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Documents
  contract_content TEXT,                        -- Compiled HTML contract
  contract_text TEXT,                           -- Plain text version (for AI chat context)
  pdf_url TEXT,                                 -- Signed PDF URL (future)

  -- Signature tracking
  signed_by_landlord BOOLEAN DEFAULT FALSE,
  signed_by_tenant BOOLEAN DEFAULT FALSE,
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  landlord_signature_data TEXT,                  -- Base64 signature image
  tenant_signature_data TEXT,                    -- Base64 signature image

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (
    auth.uid() = landlord_id OR
    auth.uid() = tenant_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Landlords can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = landlord_id OR auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = landlord_id OR auth.uid() = tenant_id);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts;
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_landlord ON contracts(landlord_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at DESC);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
