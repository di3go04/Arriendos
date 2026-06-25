# Deploy de produccion

## Requisitos

- Node 20.
- Proyecto en Vercel conectado al repo.
- Supabase con migraciones aplicadas en orden.
- Dominio con HTTPS.

## Variables minimas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
RESEND_API_KEY=
WHATSAPP_BRIDGE_URL=https://tu-vps-whatsapp:3001
WHATSAPP_BRIDGE_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=
```

## Pasos

1. Ejecutar `npm ci`.
2. Ejecutar `npm run verify`.
3. Aplicar migraciones `supabase/migrations/*.sql`.
4. Crear bucket privado `contract-documents` en Supabase Storage.
5. Configurar webhook de Mercado Pago hacia `/api/payments/webhook-mp`.
6. Desplegar `npm run whatsapp:bridge` en un VPS y apuntar `WHATSAPP_BRIDGE_URL` desde Vercel.
7. Configurar DNS del dominio principal.
8. Publicar en Vercel.
9. Abrir `/status` y `/admin/readiness`.

## Criterio de aceptacion

- `npm run build` compila.
- `/api/health` responde.
- El checkout crea una preferencia real o sandbox.
- El webhook rechaza firmas invalidas si `MP_WEBHOOK_SECRET` esta definido.
