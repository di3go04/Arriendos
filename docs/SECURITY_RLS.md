# Auditoría RLS Supabase

Tablas con RLS obligatorio: `profiles`, `properties`, `contracts`, `payments`, `auth_user_devices`.

El service role solo se usa en rutas `src/app/api/modules/*` validadas.
