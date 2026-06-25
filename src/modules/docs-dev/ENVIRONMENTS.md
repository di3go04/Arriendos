# Variables por entorno — módulo docs-dev

## development (.env.local)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (auth-enterprise, superadmin)
- `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- `WHATSAPP_BRIDGE_URL=http://127.0.0.1:3001`

## staging

Igual que development con URLs de preview Vercel y MP sandbox `TEST-`.

## production

- Tokens `APP_USR-` de Mercado Pago producción
- `WHATSAPP_BRIDGE_URL` apuntando al VPS del bridge Baileys
- `VAPID_*` para push notifications
