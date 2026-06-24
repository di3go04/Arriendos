# RentNow — Documentación developer-first (módulo docs-dev)

## 1. Introducción

RentNow es un SaaS B2B de arrendamientos con 20 módulos en `src/modules/`.

## 2. Requisitos

- Node 20+
- Cuenta Supabase
- Mercado Pago (sandbox o prod)
- Opcional: VPS para WhatsApp bridge

## 3. Instalación

```bash
git clone <repo>
cd arrendamiento
npm ci
cp .env.example .env.local
npm run dev
```

## 4. Migraciones Supabase

Ejecutar en orden `supabase/migrations/01` … `12`.

Críticas para módulos: **07** auth, **08** trials, **09** impersonation, **10** firma, **11** whatsapp queue, **12** AI logs.

## 5. Módulos 1–5

| # | Módulo | API base |
|---|--------|----------|
| 1 | auth-enterprise | `/api/modules/auth-enterprise/*` |
| 2 | payments-mp | `/api/payments/*` + Brick |
| 3 | subscriptions-saas | `/api/modules/subscriptions-saas/*` |
| 4 | superadmin-tenant | `/api/modules/superadmin-tenant/*` |
| 5 | e2e-ci | `npm run test` + Playwright |

## 6. Módulos 6–10

| # | Módulo | Uso |
|---|--------|-----|
| 6 | tests-api | `npm run test:modules` |
| 7 | docs-dev | Este archivo |
| 8 | openapi-devportal | `/developers/swagger` |
| 9 | seo-advanced | `buildLocalizedMetadata()` |
| 10 | pwa-prod | `PwaInit` en layout |

## 7. Módulos 11–15

Performance (AVIF, lazy), CI/CD (`.github/workflows/ci.yml`), Docker (`docker compose up`), firma (`/api/modules/e-signature/sign`), IA (`/api/modules/ai-contracts/generate`).

## 8. Módulos 16–20

WhatsApp cola, reportes `/dashboard/reports`, OWASP headers en proxy, landing `/comprar-codigo`.

## 9. Seguridad

- RLS en todas las tablas user-facing
- `SUPABASE_SERVICE_ROLE_KEY` solo servidor
- Headers en `src/proxy.ts`

## 10. Soporte comercial

Ver `src/modules/commercial-kit/SUPPORT.md`.
