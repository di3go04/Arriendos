# 🏠 RentNow — SaaS de Gestión de Arrendamientos

> **Documentación para el comprador** — instrucciones completas para desplegar, configurar y usar el sistema.

---

## 📋 Resumen

| Concepto | Detalle |
|---|---|
| **Producto** | SaaS multi-tenant para gestión de propiedades de alquiler |
| **Stack** | Next.js 16 + React 19 + TypeScript + Tailwind v4 + Supabase |
| **Pagos** | Mercado Pago (principal) + Stripe (internacional) + PayPal |
| **IA** | Google Gemini — generación de contratos y predicción de morosidad |
| **Idiomas** | ES, EN, PT, FR, DE, IT |
| **Licencia** | Privada — todos los derechos reservados |

---

## 🚀 Requisitos mínimos

- Node.js 20+
- Cuenta Supabase (gratuita para empezar)
- Cuenta Mercado Pago (para cobros)
- Vercel / Railway / cualquier host Node.js

---

## 🔧 Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus propias API keys

# 3. Aplicar migraciones de base de datos
# Ejecutar los archivos SQL en orden:
# supabase/migrations/01_migration_schema.sql
# supabase/migrations/02_add_tipo_column.sql
# supabase/migrations/03_payment_tables.sql
# ... resto en orden numérico

# 4. (Opcional) Cargar datos demo
# Ejecutar supabase/seed.demo.sql

# 5. Iniciar en desarrollo
npm run dev

# 6. Verificar que funciona
# Abrir http://localhost:3000
# Ir a /status para ver health check
```

---

## 🌐 Despliegue en producción (Vercel)

```bash
# 1. Conectar repo a Vercel
# 2. Configurar variables de entorno en el panel de Vercel
# 3. Desplegar (build automático)
# 4. Configurar webhook de Mercado Pago:
#    URL: https//tudominio.com/api/payments/webhook-mp
#    Eventos payment
# 5. Configurar webhook de Stripe (opcional):
#    URL: https//tudominio.com/api/webhooks/stripe
```

### Variables mínimas para producción

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://tudominio.com
MP_ACCESS_TOKEN=
NEXT_PUBLIC_MP_PUBLIC_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
```

---

## 📁 Estructura del proyecto

```
src/
├── app/                    # Páginas y API routes (Next.js App Router)
│   ├── [locale]/           # Landing page multi-idioma
│   ├── dashboard/          # Panel de control (arrendador)
│   ├── propiedades/        # Portal público de propiedades
│   ├── precios/            # Planes y precios
│   ├── contracts/          # Contratos y firmas
│   ├── api/                # Endpoints REST
│   └── developers/         # Documentación de API pública
├── components/             # Componentes UI reutilizables
├── config/                 # Configuraciones (pagos, env, i18n)
├── modules/                # 33 módulos funcionales
│   ├── ai-contracts/       # Generación de contratos con IA
│   ├── payments-mp/        # Mercado Pago
│   ├── stripe-payments/    # Stripe
│   ├── e-signature/        # Firma digital
│   ├── pwa-prod/           # PWA offline
│   └── ...                 # Ver src/modules/README.md
├── lib/                    # Utilidades compartidas
├── i18n/                   # Config de internacionalización
└── messages/               # Traducciones (6 idiomas)
```

---

## 🔑 Funcionalidades incluidas

### Core
- ✅ CRUD de propiedades, contratos, inquilinos, pagos
- ✅ Dashboard con métricas financieras
- ✅ Portal público de propiedades con generación de leads
- ✅ Sistema multi-tenant (organizaciones + white-label)
- ✅ Roles: arrendador, arrendatario, admin

### Pagos
- ✅ Mercado Pago Checkout PRO (principal)
- ✅ Stripe (pagos internacionales USD)
- ✅ PayPal (suscripciones)
- ✅ Multi-moneda: USD, COP, MXN, EUR, BRL, ARS, CLP, PEN, GBP

### IA
- ✅ Generación de contratos con Google Gemini
- ✅ Predicción de morosidad (score 0-100)
- ✅ Análisis inteligente de leads

### Legal
- ✅ Plantillas de contrato personalizables
- ✅ Firma digital (arrendador + arrendatario)
- ✅ Documentos fiscales: Recibo, Paz y Salvo, Certificado, Inventario
- ✅ PDF generation con html2pdf

### UX
- ✅ 6 idiomas (ES, EN, PT, FR, DE, IT)
- ✅ PWA offline-first + push notifications
- ✅ Modo oscuro / claro
- ✅ Responsive (mobile-first)
- ✅ Onboarding guiado en 5 pasos

### Técnico
- ✅ 20+ APIs REST documentadas (`/developers`)
- ✅ 33 módulos independientes (`src/modules/`)
- ✅ CI/CD pipeline (GitHub Actions → Vercel)
- ✅ Docker Compose
- ✅ Row Level Security (Supabase RLS)
- ✅ GDPR compliance (banner de consentimiento)
- ✅ SEO (sitemap, robots, Schema.org, Open Graph)
- ✅ Tests unitarios (Jest + React Testing Library)
- ✅ WhatsApp Baileys (recordatorios automáticos)

---

## 🔌 APIs incluidas

| Endpoint | Descripción |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/stats` | Estadísticas del dashboard |
| `POST /api/payments/create-subscription` | Crear suscripción MP |
| `POST /api/payments/webhook-mp` | Webhook Mercado Pago |
| `POST /api/webhooks/stripe` | Webhook Stripe |
| `POST /api/payments/webhook-paypal` | Webhook PayPal |
| `POST /api/ai/generate-contract` | Generar contrato con IA |
| `POST /api/ai/predict-morosity` | Predecir morosidad |
| `POST /api/leads` | Recibir lead del portal |
| `POST /api/documents/generate` | Generar documento fiscal |
| `GET /api/reports/financial` | Reportes financieros |
| `GET /api/admin/organizations` | Multi-tenant |
| `POST /api/onboarding/complete` | Completar onboarding |
| `POST /api/notifications/push` | Push notifications |
| `GET /api/subscriptions` | Listar suscripciones |
| `POST /api/services` | Marketplace de servicios |
| `GET /api/export/*` | Exportar datos (Excel, CSV) |

---

## 💳 Planes de suscripción

| Plan | USD | COP | MXN | EUR | BRL |
|---|---|---|---|---|---|
| Básico | Gratis | Gratis | Gratis | Gratis | Gratis |
| Profesional | $12/mes | $49.900 | $200 | €11 | R$60 |
| Empresa | $24/mes | $99.900 | $400 | €22 | R$120 |

Los precios se configuran en `src/config/payments.ts`.

---

## 🤖 Comandos útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servir build
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # Tests unitarios
npm run test:watch   # Tests en modo watch
npm run verify       # Lint + typecheck + tests + build
```

---

## 🐳 Docker

```bash
docker compose up -d
```

Incluye: app Next.js, Supabase local, y servicios auxiliares.

---

## 📞 Contacto del vendedor

[Incluir tu información de contacto aquí]

---

## 📄 Licencia

Este software se vende con licencia privada. Todos los derechos reservados.
El comprador recibe el código fuente completo para su uso y modificación.
No está permitida la reventa del código como producto propio.
