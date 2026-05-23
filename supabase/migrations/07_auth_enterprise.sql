-- Módulo 1: auth-enterprise — intentos de login y sesiones por dispositivo

CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email_created
  ON public.auth_login_attempts (lower(email), created_at DESC);

CREATE TABLE IF NOT EXISTS public.auth_user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  user_agent text,
  ip_address text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_auth_user_devices_user
  ON public.auth_user_devices (user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_user_devices ENABLE ROW LEVEL SECURITY;

-- Solo el service role / rutas API registran intentos (sin políticas anon)

CREATE POLICY auth_devices_select_own ON public.auth_user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY auth_devices_update_own ON public.auth_user_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY auth_devices_delete_own ON public.auth_user_devices
  FOR DELETE USING (auth.uid() = user_id);

-- Perfiles: flag MFA requerido (opcional por org más adelante)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_enrolled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_required boolean DEFAULT false;
