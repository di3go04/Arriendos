ALTER TABLE public.contract_templates
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'manual';
