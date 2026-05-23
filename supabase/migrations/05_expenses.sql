CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('maintenance', 'utilities', 'taxes', 'insurance', 'other')),
  amount numeric NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their expenses" ON public.expenses
  FOR ALL TO authenticated USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
