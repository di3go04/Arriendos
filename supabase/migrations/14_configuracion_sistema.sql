-- Configuración global white-label (singleton) — credenciales Stripe del dueño del SaaS
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  stripe_secret_key text,
  stripe_webhook_secret text,
  next_public_site_url text NOT NULL DEFAULT 'http://localhost:3000',
  stripe_publishable_key text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.configuracion_sistema IS
  'Credenciales Stripe y URL del sitio. Una sola fila (id=1). Solo editable por admin vía API.';

INSERT INTO public.configuracion_sistema (id, next_public_site_url)
VALUES (1, 'http://localhost:3000')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Sin acceso directo desde el cliente; lectura/escritura vía service role en rutas API
CREATE POLICY "configuracion_sistema_no_direct_access"
  ON public.configuracion_sistema
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
