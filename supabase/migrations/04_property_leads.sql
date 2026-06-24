CREATE TABLE IF NOT EXISTS public.property_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  lead_name text NOT NULL,
  lead_email text NOT NULL,
  lead_phone text NOT NULL,
  lead_message text,
  source text DEFAULT 'portal_publico',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view their own leads" ON public.property_leads
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Anyone can insert leads" ON public.property_leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Owners can update leads" ON public.property_leads
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());
