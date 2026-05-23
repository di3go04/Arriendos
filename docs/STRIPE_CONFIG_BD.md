# Stripe dinámico desde `configuracion_sistema`

## 1. Migración

Ejecuta en Supabase SQL Editor o CLI:

`supabase/migrations/14_configuracion_sistema.sql`

Verifica:

```sql
SELECT id, next_public_site_url,
       stripe_secret_key IS NOT NULL AS tiene_secret,
       stripe_webhook_secret IS NOT NULL AS tiene_webhook,
       updated_at
FROM configuracion_sistema;
```

Debe existir **una fila** con `id = 1`.

## 2. Variables mínimas del servidor

Solo infraestructura (no credenciales Stripe del comprador):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # obligatorio para leer/escribir configuracion_sistema
```

Opcional en dev: `STRIPE_*` en `.env.local` como respaldo si la tabla está vacía.

## 3. Configurar credenciales (admin)

1. Inicia sesión con usuario `role = admin` en `profiles`.
2. Abre `/admin/configuracion`.
3. Guarda `sk_test_...`, `whsec_...`, `https://tu-dominio.com`.

O vía API:

```bash
curl -X PUT http://localhost:3000/api/admin/system-config \
  -H "Content-Type: application/json" \
  -H "Cookie: <sesion-admin>" \
  -d '{
    "stripe_secret_key": "sk_test_...",
    "stripe_webhook_secret": "whsec_...",
    "next_public_site_url": "http://localhost:3000"
  }'
```

## 4. Probar desde la plataforma (UI)

### A) Panel admin (recomendado)

1. `npm run dev`
2. Inicia sesión como **admin**
3. Abre **http://localhost:3000/admin/configuracion**
4. Guarda las 3 credenciales Stripe → debe decir **Configurado (database)**
5. En la sección **「Probar desde la plataforma」**, deja tu email y pulsa **「Probar checkout Stripe $12 USD」**
6. Te redirige a Stripe Checkout → paga con `4242 4242 4242 4242` · fecha futura · CVC cualquiera
7. Vuelves a `/dashboard?stripe=success`

### B) Página pública de precios

1. Con Stripe configurado en BD, abre **http://localhost:3000/precios**
2. Verás el aviso **「Stripe activo · fuente: database」**
3. En plan Profesional o Empresa, el botón usa Stripe (no Mercado Pago)
4. Debes estar **logueado** (usa el email de tu cuenta) o te manda a `/login`

## 5. Probar checkout (API / curl)

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "subscription",
    "customerEmail": "test@example.com",
    "planName": "RentNow Profesional",
    "priceInCents": 1200,
    "planId": "profesional"
  }'
```

Respuesta esperada: `{ "url": "https://checkout.stripe.com/...", "configSource": "database" }`.

Abre `url` en el navegador y paga con tarjeta de prueba `4242 4242 4242 4242`.

## 6. Probar webhook

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` del CLI y guárdalo en `/admin/configuracion`.

Completa un pago de prueba; en logs debe aparecer `checkout.session.completed`.

## 7. Checklist “¿se creó todo bien?”

| Paso | Cómo verificar |
|------|----------------|
| Tabla BD | `SELECT * FROM configuracion_sistema` → 1 fila |
| Admin API | `GET /api/admin/system-config` → `configured: true` |
| Checkout API | `GET /api/checkout` → `configured: true`, `configSource: "database"` |
| Pago | POST checkout → URL Stripe válida |
| Webhook | Stripe CLI o Dashboard → evento 200 OK |

## Rutas

- `POST /api/checkout` — lee BD, crea sesión
- `POST /api/webhooks/stripe` — lee BD, valida firma
- `GET/PUT /api/admin/system-config` — solo admin
- `/admin/configuracion` — UI admin
