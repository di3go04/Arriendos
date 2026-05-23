CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  country_code text,
  estimated_tokens int,
  estimated_cost_usd numeric(10, 6),
  model text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_logs_own ON public.ai_generation_logs FOR SELECT USING (auth.uid() = user_id);
