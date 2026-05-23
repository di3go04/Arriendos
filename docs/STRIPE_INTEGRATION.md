# Stripe — Pagos USD White-Label

Arquitectura modular en `src/modules/stripe-payments/`. Rutas delgadas:

| Ruta | Descripción |
|------|-------------|
| `POST /api/checkout` | Crea sesión Checkout (payment o subscription) |
| `POST /api/webhooks/stripe` | Webhook con firma y sync Supabase |
| `GET /api/checkout` | Estado de configuración |

## Variables (producción white-label)

**Recomendado:** credenciales en tabla `configuracion_sistema` vía `/admin/configuracion`.

**Servidor (obligatorio):**

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

**Respaldo dev (opcional):**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Guía de pruebas: [STRIPE_CONFIG_BD.md](./STRIPE_CONFIG_BD.md)

Opcional (Price IDs fijos):

```env
STRIPE_PRICE_PROFESIONAL=price_...
STRIPE_PRICE_EMPRESA=price_...
```

## Test vs Live

- Desarrollo: `sk_test_` + `pk_test_`
- Producción: `sk_live_` + `pk_live_`

No hay cambios de código; Stripe detecta el modo por el prefijo de la secret key.

## Ejemplo frontend

```typescript
const res = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'subscription',
    customerEmail: 'cliente@email.com',
    productName: 'RentNow Profesional',
    amountUsd: 12,
    planId: 'profesional',
    billingInterval: 'month',
  }),
});
const { url } = await res.json();
if (url) window.location.href = url;
```

## Webhook local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` que imprime el CLI a `STRIPE_WEBHOOK_SECRET`.

## Migración Supabase

Ejecuta `supabase/migrations/13_stripe_columns.sql` para columnas `stripe_*` en `subscriptions` y `payment_transactions`.
