# 🏠 RentNow — Gestión Inteligente de Arrendamientos

Plataforma SaaS profesional para la administración de propiedades de alquiler, construida con **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4** y **Supabase**.

## Arquitectura modular (20 módulos)

Todo el producto avanzado vive en **`src/modules/`** con contratos desacoplados. Guía completa:

- [`src/modules/README.md`](src/modules/README.md) — árbol y reglas
- [`src/modules/docs-dev/ARCHITECTURE.md`](src/modules/docs-dev/ARCHITECTURE.md) — diagramas
- [`src/modules/docs-dev/ENVIRONMENTS.md`](src/modules/docs-dev/ENVIRONMENTS.md) — variables por entorno
- [`docs/INTEGRACION_MP_WHATSAPP.md`](docs/INTEGRACION_MP_WHATSAPP.md) — pagos + WhatsApp Baileys

### Activación rápida

```bash
npm install
# Aplicar migraciones 07–12 en Supabase
npm run dev
npm run whatsapp:bridge   # terminal 2 — WhatsApp
```

Variables críticas: `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `WHATSAPP_BRIDGE_URL`.

## 🚀 Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 16.2.6 | Framework React full-stack |
| React | 19.2.4 | UI library |
| TypeScript | 5.9.3 | Tipado estático |
| Tailwind CSS | 4.3.0 | Estilos utilitarios |
| Supabase | 2.105.4 | Backend: Auth, DB, Realtime, Storage |
| PayPal SDK | 9.2.0 | Pagos y suscripciones |
| Google Gemini AI | 0.24.1 | Generación de contratos y predicción IA |
| Stripe SDK | 22.1.1 | Backup de pagos |
| Recharts | 3.8.1 | Gráficos del dashboard |
| Framer Motion | 12.39.0 | Animaciones |
| Resend | 6.12.3 | Emails transaccionales |
| Lucide React | 1.16.0 | Iconos |
| Zod | 4.4.3 | Validación de esquemas |
| date-fns | 4.1.0 | Fechas en español |
| React Quill | 3.8.3 | Editor de contratos |
| html2pdf.js | 0.14.0 | Generación de PDFs |
| Tailwind Merge | 3.6.0 | Utilidades de clases |

## ✨ 9 Nuevas Funcionalidades Implementadas

### 1. 💳 Pagos con PayPal
- Suscripciones recurrentes vía PayPal Subscriptions
- API: `POST /api/subscriptions/create-paypal`
- Webhook: `POST /api/payments/webhook-paypal`
- Soporte para planes: Básico (gratis), Profesional ($12/mes), Empresa ($24/mes)
- Componente: `PayPalSubscriptionButton.tsx`

### 2. 🏪 Portal Público de Propiedades
- Página: `/propiedades` — grid con filtros por tipo
- Detalle: `/propiedades/[id]` — galería, características, precio
- Leads: Formulario de contacto que notifica al arrendador
- API: `POST /api/leads`

### 3. 📱 PWA Offline-First & Push Notifications
- Service Worker con estrategia Network First + cache offline
- Push notifications nativas
- Instalación como app (Android/iOS)
- API: `POST /api/notifications/push`

### 4. 🤖 Asistente IA Predictivo de Morosidad
- Score de riesgo 0-100 basado en historial de pagos
- Niveles: low, medium, high, critical
- Análisis con Google Gemini (opcional)
- API: `POST /api/ai/predict-morosity`

### 5. 📄 Documentos Fiscales y Legales
- Recibo de Pago, Certificado de Arrendamiento
- Inventario de Inmueble, Paz y Salvo
- Todos con diseño profesional y firmas
- API: `POST /api/documents/generate`

### 6. 🛠️ Marketplace de Proveedores
- Directorio de técnicos, plomeros, electricistas, abogados
- Solicitudes de servicio con notificaciones
- API: `GET/POST /api/services`

### 7. 📊 Reportes Financieros Avanzados
- Reporte anual con desglose mensual y por propiedad
- Métricas: colección efficiency, proyección anual
- API: `GET /api/reports/financial`

### 8. 🔗 API Pública Documentada
- Página: `/developers` con 10 secciones documentadas
- Métodos: GET, POST, PUT, DELETE
- Autenticación: Bearer Token

### 9. 🏢 Multi-Tenant + White-Label
- Organizaciones con logo, colores y dominio personalizado
- Roles: admin de organización, miembros
- API: `GET/POST/PUT /api/admin/organizations`

## 🔧 Correcciones de Limitaciones

### Tests Automatizados
```bash
npm test                    # Ejecutar tests
npx jest --coverage        # Tests con cobertura
```

### CI/CD Pipeline (GitHub Actions)
- `.github/workflows/ci.yml`
- Jobs: Lint → Test → Build → Deploy a Vercel

### Onboarding Guiado
- Componente: `OnboardingFlow.tsx` (5 pasos)
- Crea propiedad + inquilino + contrato + pagos en 1 flujo
- API: `POST /api/onboarding/complete`

## 📦 Instalación

```bash
# Clonar
git clone https://github.com/di3go04/Arriendos.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
npm run dev
```

## 🛠️ Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# PayPal (para pagos)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
PAYPAL_PROFESIONAL_PLAN_ID=
PAYPAL_EMPRESA_PLAN_ID=
PAYPAL_WEBHOOK_ID=

# Google Gemini AI (para contratos y predicción)
GEMINI_API_KEY=

# Stripe (backup de pagos)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (emails)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── subscriptions/   # Suscripciones PayPal
│   │   ├── payments/        # Pagos y webhooks
│   │   ├── leads/           # Leads del portal
│   │   ├── ai/              # IA predictiva
│   │   ├── documents/       # Documentos fiscales
│   │   ├── services/        # Marketplace
│   │   ├── reports/         # Reportes avanzados
│   │   └── admin/           # Multi-tenant
│   ├── propiedades/         # Portal público
│   ├── developers/          # Documentación API
│   └── dashboard/           # Panel de control
├── components/
│   ├── payments/            # PayPal buttons
│   ├── onboarding/          # Flujo de onboarding
│   └── ui/                  # Componentes reutilizables
└── config/                  # Configuraciones
```

## 📄 Licencia

Privado — Todos los derechos reservados.