# WhatsApp con Baileys (gratis)

RentNow **no usa AiSensy** ni APIs de pago para WhatsApp. Todo pasa por **Baileys** y un bridge HTTP local o en VPS.

## Desarrollo

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run whatsapp:bridge
```

La primera vez escanea el QR en la terminal 2. La sesión queda en `auth_info/` (no se sube a git).

## Variables

```env
WHATSAPP_BRIDGE_URL=http://127.0.0.1:3001
WHATSAPP_BRIDGE_PORT=3001
WHATSAPP_BRIDGE_SECRET=   # opcional, protege POST /send
```

## APIs

| Ruta | Uso |
|------|-----|
| `POST /api/whatsapp/send` | `{ to, message }` |
| `POST /api/notifications/whatsapp` | `{ phone, message, type? }` |

Ambas llaman al bridge → Baileys.

## Producción

1. Despliega `scripts/whatsapp-bridge.mjs` en un **VPS** (Railway, Fly.io, etc.) con Node 20+.
2. Define `WHATSAPP_BRIDGE_URL=https://tu-vps:3001` en Vercel.
3. Opcional: `WHATSAPP_BRIDGE_SECRET` en ambos lados.

Vercel serverless **no** puede ejecutar Baileys directamente; el bridge debe ser un proceso aparte.

## Health

`GET /api/health` comprueba `GET {WHATSAPP_BRIDGE_URL}/health`.
