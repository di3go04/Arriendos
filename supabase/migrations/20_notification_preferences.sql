-- Migration 20: Add notification_preferences column to profiles
-- Almacena preferencias de notificación como JSONB en lugar de localStorage

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email": true, "push": false, "whatsapp": false}'::jsonb;
