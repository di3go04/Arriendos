# Changelog

Todos los cambios notables de RentNow se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

---

## [1.0.0] — 2026-06-23 — Versión inicial para venta

### Agregado
- Plataforma SaaS PropTech completa para gestión de arrendamientos.
- Arquitectura modular con 20 módulos funcionales desacoplados bajo `src/modules/`.
- Dashboard ejecutivo con KPIs en tiempo real, gráficos Recharts y simulador de cobranza IA.
- CRUD completo de propiedades con galería, amenities, geolocalización y mapa interactivo (Mapbox + Leaflet).
- Portal público de propiedades en `/propiedades` con captura de leads.
- Contratos digitales con plantillas IA (Google Gemini) y firma electrónica SHA-256.
- Cobranza multi-pasarela: Stripe (internacional), Mercado Pago (LATAM), PayPal (suscripciones).
- Webhooks firmados con HMAC para MP, Stripe y PayPal (upserts idempotentes).
- Multi-moneda: USD, COP, MXN, EUR, BRL, ARS, CLP, PEN, GBP.
- KYC con captura de selfie (react-webcam) y carga de documentos.
- Open Banking vía Belvo para verificación de ingresos del inquilino.
- Predicción de morosidad con IA (score 0–100, niveles low/medium/high/critical).
- Agente de voz IA para cobranza (Vapi.ai + Twilio) con transcripción en vivo.
- Notificaciones WhatsApp vía Baileys para recordatorios de pago.
- Documentos fiscales automáticos: Recibo de Pago, Paz y Salvo, Certificado, Inventario.
- Reportes financieros con exportación a Excel, CSV y PDF.
- Multi-tenant con white-label: organizaciones, roles, branding personalizable.
- Roles: arrendador, arrendatario, admin, superadmin (con impersonation).
- Planes SaaS: Básico (gratis), Profesional ($12/mes), Empresa ($24/mes).
- Internacionalización completa en 6 idiomas (ES, EN, FR, DE, PT, IT) con next-intl.
- Modo claro/oscuro con next-themes.
- PWA offline-first con push notifications nativas.
- Onboarding guiado en 5 pasos.
- API pública documentada en `/developers` con 50+ endpoints REST.
- Programa de afiliados con tracking de referidos.
- 2FA TOTP (compatible con Google Authenticator / Authy).
- GDPR compliance: banner de consentimiento + endpoint de eliminación.
- CSP con nonce por request, rate limiting (Upstash Redis o memoria local).
- Row Level Security en Supabase.
- CI/CD con GitHub Actions: lint → test → build → e2e → deploy.
- Pre-commit hooks con Husky + lint-staged.
- Tests unitarios (Jest, 57 tests en 18 suites) + E2E (Playwright).
- Storybook para diseño de componentes aislados.
- Docker Compose para desarrollo local.
- 16 modelos Prisma con enums tipados y relaciones claras.
- 20 migraciones SQL de Supabase.

### Stack tecnológico
- Next.js 16.2.6 (App Router, RSC, streaming)
- React 19.2.4
- TypeScript 5.x estricto (sin errores de tipo)
- Tailwind CSS v4 + Framer Motion 12.39
- Supabase 2.105.4 (PostgreSQL + Auth + Storage + Realtime)
- Prisma ORM 7.8.0
- NextAuth v5 (email + OAuth + 2FA TOTP)
- Stripe 22.1.1 + Mercado Pago 3.0 + PayPal 9.2
- Google Gemini AI 0.24.1
- WhatsApp Baileys 7.0.0-rc13 + Twilio 6.0 + Resend 6.12
- Vapi.ai + Voiceflow (voz IA)
- Mapbox GL JS 3.24 + Leaflet 1.9.4 (fallback OSM)
- next-intl 4.12.0 (6 idiomas)
- Jest 30.4 + React Testing Library 16.3 + Playwright 1.60

### Métricas del código
- **53,298** líneas de TypeScript
- **515** archivos en `src/`
- **20** módulos funcionales en `src/modules/`
- **50+** endpoints API REST
- **16** modelos Prisma
- **20** migraciones SQL
- **6** idiomas completos
- **57** tests unitarios en **18** suites

### Documentación
- README.md con instrucciones de instalación y uso.
- LISTING.md con descripción completa para venta en marketplaces.
- docs/DEPLOY_PRODUCCION.md con guía paso a paso de despliegue.
- docs/SECURITY_RLS.md con políticas de Row Level Security.
- docs/legal/ con aviso de privacidad OpenBanking/KYC y contrato de suscripción REaaS.
- .env.example con documentación de 30+ variables de entorno.

---

## Tipos de cambios futuros

- `Agregado` para nuevas características.
- `Cambiado` para cambios en funcionalidad existente.
- `Obsoleto` para características que se eliminarán.
- `Removido` para características eliminadas.
- `Corregido` para correcciones de bugs.
- `Seguridad` para vulnerabilidades parcheadas.
