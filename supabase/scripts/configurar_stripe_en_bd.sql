-- Ejecutar en Supabase SQL Editor (una sola vez)
-- Reemplaza los valores por tus llaves de Stripe TEST antes de ejecutar.

UPDATE public.configuracion_sistema
SET
  stripe_secret_key = 'sk_test_TU_SECRET_KEY',
  stripe_webhook_secret = 'whsec_TU_WEBHOOK_SECRET',
  stripe_publishable_key = 'pk_test_TU_PUBLISHABLE_KEY',
  next_public_site_url = 'http://localhost:3000',
  updated_at = now()
WHERE id = 1;

-- Verificar:
SELECT id, next_public_site_url,
       left(stripe_secret_key, 12) || '…' AS secret_preview,
       stripe_webhook_secret IS NOT NULL AS tiene_webhook
FROM public.configuracion_sistema;
