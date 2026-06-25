-- Módulo 17 — cola de mensajes WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text NOT NULL,
  template_key text NOT NULL DEFAULT 'payment_reminder',
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_pending
  ON public.whatsapp_message_queue (status, scheduled_at)
  WHERE status = 'pending';
