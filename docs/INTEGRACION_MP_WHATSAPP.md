# Mercado Pago Checkout API + WhatsApp (Baileys)

## Mercado Pago — pago en tu sitio (sin redirección)

1. Variables en `.env.local`:
   - `MP_ACCESS_TOKEN` — Access Token (backend), formato `TEST-...` o `APP_USR-...` desde el panel
   - `NEXT_PUBLIC_MP_PUBLIC_KEY` — Public Key (Bricks en el navegador)
   - `MP_WEBHOOK_SECRET` — opcional, para validar IPN

   **OAuth (alternativa):** si usas Client ID + Secret en lugar del token directo:
   - `MP_CLIENT_ID`, `MP_CLIENT_SECRET`
   - `MP_OAUTH_TOKEN_URL=https://api.mercadopago.com/oauth/token`
   - Ejecuta: `node scripts/mp-oauth-token.mjs` y copia el `MP_ACCESS_TOKEN` que imprime

2. Webhook en el [panel de Mercado Pago](https://www.mercadopago.com.co/developers/panel/app):
   - URL: `https://tu-dominio.com/api/payments/webhook-mp`
   - Eventos: `payment`, `subscription_preapproval`

3. En `/precios`, si hay Public Key + Access Token, se muestra el **Card Payment Brick** (Checkout API). Si solo hay Access Token, se usa Checkout Pro (redirección).

Documentación: [Checkout API](https://www.mercadopago.com.co/developers/es/docs/checkout-api-payments/overview)

## WhatsApp — solo Baileys (sin AiSensy)

Ver guía completa: [WHATSAPP_BAILEYS.md](./WHATSAPP_BAILEYS.md)

1. `npm run dev` + `npm run whatsapp:bridge`
2. Escanea el QR una vez (`auth_info/`)
3. `WHATSAPP_BRIDGE_URL=http://127.0.0.1:3001` en `.env.local`

**Producción:** bridge en VPS; Next.js en Vercel apunta a esa URL.

## VAPID (push en el navegador)

Genera claves:

```bash
npx web-push generate-vapid-keys
```

Copia a `.env.local`:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:tu@email.com`
