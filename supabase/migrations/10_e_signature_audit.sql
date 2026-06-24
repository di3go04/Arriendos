CREATE TABLE IF NOT EXISTS public.contract_signature_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_role text NOT NULL CHECK (signer_role IN ('landlord', 'tenant')),
  ip_address text,
  user_agent text,
  content_hash text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_signature_audit ENABLE ROW LEVEL SECURITY;
