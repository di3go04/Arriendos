# RentNow — SaaS PropTech para Gestión de Arrendamientos

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.105.4-3ECF8E)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Commercial-D4A017)](./LICENSE)

> **SaaS vertical multi-tenant para gestión de propiedades en alquiler.** Construido sobre Next.js 16 App Router, React 19, TypeScript estricto, Supabase y Tailwind CSS v4. Cubre el ciclo completo: captación de leads, KYC con Open Banking, contratos con IA, firma electrónica, cobranza multi-pasarela y notificaciones por WhatsApp.

---

## ✨ Características principales

### 📊 Dashboard ejecutivo
- KPIs en tiempo real: propiedades activas, ingresos mensuales, ocupación, pagos pendientes.
- Gráficos Recharts de ingresos vs ocupación (6 meses).
- Simulador de llamada de cobranza con IA + panel de riesgos con scoring de inquilinos.

### 🏠 Gestión de propiedades
- CRUD completo con galería, amenities, geolocalización y mapa interactivo (Mapbox/OSM).
- Filtros por tipo (apartamento, casa, local, oficina, bodega, coliving).
- Portal público en `/propiedades` con captura de leads y notificación al arrendador.

### 📄 Contratos digitales
- Plantillas personalizables con generación asistida por IA (Google Gemini).
- Firma electrónica con hash criptográfico SHA-256 y auditoría completa.
- Generación de PDF automática con `@react-pdf/renderer`.

### 💳 Cobranza multi-pasarela
- Stripe (internacional USD), Mercado Pago (LATAM), PayPal (suscripciones).
- Webhooks con verificación de firma HMAC, upserts idempotentes.
- Estados: pendiente, pagado, atrasado, cancelado. Recordatorios automáticos.
- Multi-moneda: USD, COP, MXN, EUR, BRL, ARS, CLP, PEN, GBP.

### 🤖 IA integrada
- Generación de contratos con Google Gemini.
- Predicción de morosidad (score 0–100, niveles low/medium/high/critical).
- Agente de voz IA para cobranza (Vapi.ai + Twilio) con transcripción en vivo.
- Análisis inteligente de leads y marketing.

### 🔐 Verificación y seguridad
- KYC con captura de selfie (react-webcam) y carga de documentos.
- Open Banking vía Belvo para verificación de ingresos del inquilino.
- 2FA TOTP (compatible con Google Authenticator / Authy).
- CSP con nonce por request, rate limiting, Row Level Security en Supabase.

### 🌐 Internacionalización y UX
- 6 idiomas completos: Español, Inglés, Portugués, Francés, Alemán, Italiano (`next-intl`).
- Modo claro/oscuro con `next-themes`, responsive mobile-first.
- PWA offline-first con push notifications nativas e instalación como app.
- Onboarding guiado en 5 pasos.

### 🏢 Multi-tenant y white-label
- Organizaciones con logo, colores y dominio personalizable.
- Roles: arrendador, arrendatario, admin, superadmin (con impersonation).
- Planes SaaS: Básico (gratis), Profesional ($12/mes), Empresa ($24/mes).

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, RSC, streaming) | 16.2.6 |
| UI | React + Tailwind CSS v4 + Framer Motion | 19.2.4 / 4.x / 12.39 |
| Lenguaje | TypeScript estricto | 5.x |
| Backend | Next.js API Routes + NextAuth v5 | — |
| Base de datos | Supabase (PostgreSQL + Auth + Storage + Realtime) + Prisma ORM | 2.105.4 / 7.8.0 |
| Pagos | Stripe + MercadoPago + PayPal | 22.1.1 / 3.0 / 9.2 |
| IA | Google Gemini AI | 0.24.1 |
| Mensajería | WhatsApp Baileys + Twilio + Resend | 7.0.0-rc13 / 6.0 / 6.12 |
| Voz IA | Vapi.ai + Voiceflow | — |
| Mapas | Mapbox GL JS + Leaflet (fallback OSM) | 3.24 / 1.9.4 |
| i18n | next-intl (ES, EN, FR, DE, PT, IT) | 4.12.0 |
| Testing | Jest + React Testing Library + Playwright | 30.4 / 16.3 / 1.60 |
| Calidad | ESLint 9 + Husky + lint-staged | — |

---

## 🚀 Inicio rápido

### Requisitos
- Node.js 20+
- npm 10+
- Cuenta Supabase (gratuita)
- (Opcional) Cuentas de Stripe, Twilio, Belvo, Gemini, Resend

### Instalación

```bash
# 1. Clonar e instalar
git clone https://github.com/di3go04/Arriendos.git rentnow
cd rentnow
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales (mínimo: Supabase + AUTH_SECRET)

# 3. Inicializar base de datos
docker compose up -d                # PostgreSQL + Supabase local
npx prisma migrate dev --name init
npm run seed                         # Datos demo (3 propiedades, 2 inquilinos, contratos, pagos)

# 4. Iniciar servidor
npm run dev
# Opcional, terminal 2: npm run whatsapp:bridge
```

Abrir http://localhost:3000 — login demo: `demo@rentnow.app` / `Demo123!`

### Variables de entorno mínimas

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
AUTH_SECRET=genera_con_openssl_rand_base64_32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

El resto de integraciones (Stripe, MP, PayPal, Gemini, Belvo, Twilio, WhatsApp, Resend) son opcionales y se activan al configurar sus variables. Ver `.env.example` para la lista completa.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── [locale]/           # Landing multi-idioma (6 idiomas)
│   ├── dashboard/          # Panel del arrendador (15 secciones)
│   ├── propiedades/        # Portal público con generación de leads
│   ├── contracts/          # Contratos y firma electrónica
│   ├── api/                # 50+ endpoints REST
│   └── developers/         # Documentación pública de API
├── components/             # Componentes UI reutilizables
├── modules/                # 20+ módulos funcionales desacoplados
│   ├── ai-contracts/       # Contratos con IA (Gemini)
│   ├── payments-mp/        # Mercado Pago
│   ├── stripe-payments/    # Stripe
│   ├── e-signature/        # Firma digital SHA-256
│   ├── kyc/                # Verificación de identidad
│   ├── open-banking/       # Belvo
│   ├── voice-agents/       # Vapi + Twilio
│   ├── whatsapp-automation/ # Baileys
│   ├── rbac/               # Roles y permisos
│   ├── sso/                # Single Sign-On
│   ├── gdpr/               # Compliance GDPR
│   ├── esg-sustainability/ # Reportes ESG
│   ├── dynamic-pricing/    # Precios dinámicos con ML
│   └── ...                 # Ver src/modules/README.md
├── lib/                    # Utilidades compartidas
├── i18n/                   # Config de internacionalización
└── messages/               # Traducciones (6 idiomas)
```

---

## 🧪 Testing y calidad

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript estricto (sin errores)
npm test              # Jest (57 tests en 18 suites)
npm run build         # Build producción
npm run verify        # Todo lo anterior en cadena
```

CI/CD con GitHub Actions: `lint → test → build → e2e → deploy` (ver `.github/workflows/ci.yml`).

Pre-commit hooks con Husky + lint-staged garantizan calidad en cada commit.

---

## 🐳 Docker

```bash
docker compose up -d   # Levanta app + PostgreSQL + Supabase local
```

---

## 📦 Planes SaaS integrados

| Plan | USD/mes | COP/mes | Características |
|---|---|---|---|
| Básico | Gratis | Gratis | Hasta 3 propiedades, funcionalidades básicas |
| Profesional | $12 | $49.900 | 10 propiedades, IA, reportes, API |
| Empresa | $24 | $99.900 | Ilimitado, multi-usuario, white-label |

Configurables en `src/config/payments.ts`.

---

## 🔌 API pública

50+ endpoints REST documentados en `/developers`. Autenticación Bearer Token.

Endpoints destacados:
- `POST /api/payments/create-preference` — Crear preferencia de pago MP
- `POST /api/payments/webhook-mp` — Webhook Mercado Pago (firma verificada)
- `POST /api/ai/predict-morosity` — Predicción de morosidad con IA
- `POST /api/contracts/[id]/sign` — Firma electrónica
- `GET /api/reports/financial` — Reportes financieros
- `POST /api/leads` — Captura de leads del portal público
- `GET /api/health` — Health check con estado de servicios

---

## 🔒 Seguridad

- **CSP con nonce por request** en middleware (sin `unsafe-eval` en producción).
- **Rate limiting** (10 req/min) en login, signup, AI y password reset (Upstash Redis o memoria local).
- **Row Level Security** en Supabase (ver `supabase/security-rls.sql`).
- **Webhooks firmados** con HMAC (Mercado Pago, Stripe, PayPal).
- **2FA TOTP** opcional por usuario (compatible Google Authenticator).
- **GDPR**: banner de consentimiento + endpoint de eliminación de datos.

---

## 🌍 Despliegue en producción

Ver [`docs/DEPLOY_PRODUCCION.md`](./docs/DEPLOY_PRODUCCION.md) para guía completa. Resumen:

1. Conectar repo a Vercel.
2. Configurar variables de entorno en el panel de Vercel.
3. Aplicar migraciones de Supabase (`supabase/migrations/*.sql` en orden).
4. Configurar webhook de Mercado Pago hacia `/api/payments/webhook-mp`.
5. (Opcional) Desplegar WhatsApp Bridge en VPS.

---

## 📄 Licencia

**Commercial Software License** — ver [`LICENSE`](./LICENSE).

El comprador recibe el código fuente completo para uso propio y modificación. No está permitida la reventa del código como producto competidor sin permiso explícito.

---

## 📞 Demo y contacto

- **Demo en vivo:** https://arriendos-kappa.vercel.app
- **Login demo:** `demo@rentnow.app` / `Demo123!`
- **Repositorio:** https://github.com/di3go04/Arriendos
