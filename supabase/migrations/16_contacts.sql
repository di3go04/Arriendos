-- Migration 16: Tabla de contactos para formulario de landing page
-- Requiere: migraciones 01-15 ejecutadas

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Anyone can insert contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can select contacts" ON public.contacts
  FOR SELECT TO authenticated USING (true);
