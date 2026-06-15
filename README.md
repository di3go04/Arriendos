# 🏠 RentNow — Plataforma de Gestión de Arriendos con IA

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://rentnow-demo.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-Commercial-blue)](#licencia)

RentNow es una plataforma SaaS profesional para la administración de propiedades de alquiler. Construida con **Next.js 15**, **React 19**, **TypeScript** y **Tailwind CSS**, incluye IA predictiva, pagos integrados y un portal público optimizado.

---

## ✨ ¿Qué incluye?

| Funcionalidad | Detalle |
|---|---|
| **Landing page premium** | Hero, impacto, contacto, dark mode, multi-idioma (ES/EN) |
| **Dashboard financiero** | Métricas, gráficos, ingresos vs gastos |
| **Gestión de propiedades** | CRUD completo con galería, mapa, filtros |
| **Contratos inteligentes** | Generación por IA con Gemini, firma digital |
| **Pagos integrados** | Mercado Pago + Stripe + PayPal |
| **Portal público** | Escaparate de propiedades con generación de leads |
| **Multi-tenant** | Organizaciones con branding personalizable |
| **PWA offline-first** | Notificaciones push, instalable |
| **6 idiomas** | ES, EN, PT, FR, DE, IT |
| **WhatsApp automation** | Recordatorios de pago automatizados |

---

## 💰 Costos operativos mensuales

| Servicio | Free tier | Costo mínimo |
|---|---|---|
| Supabase (PostgreSQL + Auth) | ✅ 500 MB, 50k usuarios | **$0** |
| Vercel (hosting) | ✅ 100 GB ancho de banda | **$0** |
| Mercado Pago | Sin costo fijo | **$0** |
| Stripe | Sin costo fijo | **$0** |
| Google Gemini AI | ✅ Gratuito (60 req/min) | **$0** |
| Resend (emails) | ✅ 100 emails/día | **$0** |
| **Total** | | **$0/mes** |

---

## 🚀 Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 + Tailwind CSS v3
- **Backend:** Supabase (Auth, DB, Realtime, Storage)
- **Pagos:** Mercado Pago, Stripe, PayPal
- **IA:** Google Gemini
- **Idiomas:** next-intl (ES, EN, PT, FR, DE, IT)
- **Testing:** Jest + Playwright

---

## ⚡ Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/rentnow.git
cd rentnow

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Setup completo (instala, migra, seed e inicia)
npm run setup:demo
```

El servidor iniciará en **http://localhost:3000**.

**Credenciales demo:** `demo@rentnow.com` / `RentNowDemo2026!`

---

## 💵 Para compradores

**Precio sugerido:** **$8,000 – $15,000 USD** (código fuente completo, licencia comercial)

¿Preguntas? Revisa [`LISTING_FAQ.md`](./LISTING_FAQ.md) o abre un issue.

---

## 📄 Documentación adicional

| Documento | Descripción |
|---|---|
| [`GETTING_STARTED.md`](./GETTING_STARTED.md) | Guía de inicio paso a paso |
| [`BUYER_CHECKLIST.md`](./BUYER_CHECKLIST.md) | Checklist para compradores |
| [`ROADMAP.md`](./ROADMAP.md) | Funcionalidades planeadas |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Guía para contribuir |
| [`LISTING_FAQ.md`](./LISTING_FAQ.md) | Preguntas frecuentes de compra |

---

## 📝 Licencia

Código fuente vendido bajo licencia comercial privada. Todos los derechos reservados.
El comprador recibe el código completo para su uso y modificación.
No está permitida la reventa del código como producto propio.
