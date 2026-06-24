# RentNow — Listing para Microns.io

> **Plataforma SaaS PropTech completa para gestión de arrendamientos.** 53,000+ líneas de TypeScript, 20 módulos funcionales, multi-tenant, 6 idiomas, IA integrada, multi-pasarela de pagos. Listo para desplegar y escalar.

---

## 💰 Precio

**USD $1,200** (negociable dentro del rango $900–$1,500)

Razón del precio: proyecto pre-revenue con código completo y demo funcional. Stack moderno (Next.js 16 + React 19), arquitectura modular, 53k+ LOC, 20 módulos, integraciones reales con Stripe/MercadoPago/PayPal/Gemini/Belvo/Vapi/WhatsApp. Equivale a 4–6 meses de desarrollo freelance a $40/hora.

---

## 📋 Resumen

RentNow es un SaaS PropTech vertical para el mercado latinoamericano de gestión de propiedades en alquiler. Cubre el ciclo completo: captación de leads desde portal público, verificación KYC con Open Banking (Belvo), generación de contratos con IA (Google Gemini), firma electrónica con hash SHA-256, cobranza multi-pasarela (Stripe, MercadoPago, PayPal), agentes de voz con IA para morosidad (Vapi/Twilio), notificaciones por WhatsApp (Baileys), reportes financieros exportables y dashboard en tiempo real.

Ideal para:
- **Founders** que quieren entrar al nicho PropTech sin construir desde cero.
- **Agencias** que buscan un boilerplate multi-tenant robusto para personalizar.
- **Inmobiliarias** que quieren white-label para su marca.

---

## ✨ Lo que está incluido

- ✅ Código fuente completo (**53,298 líneas TS, 515 archivos, 20 módulos**)
- ✅ Demo en vivo funcionando (URL pública en Vercel)
- ✅ Repo GitHub transferido al comprador
- ✅ Base de datos Supabase con seed demo (3 propiedades, 2 inquilinos, contratos, pagos)
- ✅ Documentación técnica (README, DEPLOY_PRODUCCION.md, legal)
- ✅ Docker Compose para desarrollo local
- ✅ CI/CD pipeline con GitHub Actions (lint → test → build → e2e → deploy)
- ✅ Tests unitarios (Jest, 57 tests en 18 suites) + E2E (Playwright)
- ✅ Soporte post-venta de **14 días** por email/Discord
- ✅ Guía de despliegue paso a paso

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, RSC, streaming) | 16.2.6 |
| UI | React + Tailwind CSS v4 + Framer Motion | 19.2.4 / 4.x / 12.39 |
| Lenguaje | TypeScript estricto (sin errores de tipo) | 5.x |
| Backend | Next.js API Routes + NextAuth v5 | — |
| Base de datos | Supabase (PostgreSQL + Auth + Storage + Realtime) + Prisma ORM | 2.105.4 / 7.8.0 |
| Pagos | Stripe + MercadoPago + PayPal | 22.1.1 / 3.0 / 9.2 |
| IA | Google Gemini AI | 0.24.1 |
| Mensajería | WhatsApp Baileys + Twilio + Resend | 7.0.0-rc13 / 6.0 / 6.12 |
| Voz IA | Vapi.ai + Voiceflow | — |
| Mapas | Mapbox GL JS + Leaflet (fallback OSM) | 3.24 / 1.9.4 |
| i18n | next-intl (6 idiomas: ES, EN, FR, DE, PT, IT) | 4.12.0 |
| Testing | Jest + React Testing Library + Playwright | 30.4 / 16.3 / 1.60 |
| Calidad | ESLint 9 + Husky + lint-staged | — |

---

## 🚀 Características destacadas

### Dashboard ejecutivo
KPIs en tiempo real (propiedades activas, ingresos mensuales, ocupación, pagos pendientes), gráficos Recharts de ingresos vs ocupación, simulador de llamada de cobranza con IA, panel de riesgos con scoring de inquilinos.

### Gestión de propiedades
CRUD completo con galería, amenities, geolocalización y mapa interactivo. Portal público en `/propiedades` con captura de leads y notificación al arrendador.

### Contratos digitales
Plantillas personalizables con generación asistida por IA (Google Gemini). Firma electrónica con hash criptográfico SHA-256 y auditoría completa. Generación de PDF automática.

### Cobranza multi-pasarela
Stripe (USD internacional), Mercado Pago (LATAM), PayPal (suscripciones). Webhooks con verificación de firma HMAC. Multi-moneda: USD, COP, MXN, EUR, BRL, ARS, CLP, PEN, GBP.

### IA integrada
- Generación de contratos con Google Gemini
- Predicción de morosidad (score 0–100)
- Agente de voz IA para cobranza (Vapi.ai + Twilio) con transcripción en vivo
- Análisis inteligente de leads y marketing

### Verificación y seguridad
KYC con captura de selfie (react-webcam), Open Banking vía Belvo para verificar ingresos, 2FA TOTP, CSP con nonce por request, rate limiting, Row Level Security en Supabase.

### Multi-tenant y white-label
Organizaciones con logo, colores y dominio personalizable. Roles: arrendador, arrendatario, admin, superadmin (con impersonation). Planes SaaS: Básico (gratis), Profesional ($12/mes), Empresa ($24/mes).

### Internacionalización
6 idiomas completos: Español, Inglés, Portugués, Francés, Alemán, Italiano. Formato localizado de moneda y fechas.

### PWA
Offline-first con push notifications nativas e instalación como app móvil en Android/iOS.

---

## 💼 Potencial de monetización

| Modelo | Descripción |
|---|---|
| **SaaS mensual** | $12–$24/mes por arrendador (planes Profesional/Empresa) |
| **Por transacción** | 1–3% por cobro exitoso (configurable) |
| **White label** | Licenciamiento a inmobiliarias ($99–$299/mes) |
| **Marketplace** | Conexión arrendador-inquilino (lead fees) |

### TAM estimado
- Mercado LATAM: ~50M propiedades en alquiler
- USA: ~44M propiedades de alquiler
- ARPU estimado: $12–$24/mes → $144–$288 ARR por usuario
- Con 100 usuarios pagando plan Profesional = $14,400 ARR
- Con 1,000 usuarios = $144,000 ARR

Sin competidor directo en LATAM con IA predictiva de morosidad + multi-idioma + KYC Open Banking integrado.

---

## 🏆 Diferenciadores clave

1. **Multi-idioma nativo** — 6 idiomas con next-intl, no hay competidor directo con este nivel de i18n.
2. **IA integrada** — Generación de contratos, predicción de morosidad, agentes de voz para cobranza.
3. **Multi-pasarela** — Stripe + Mercado Pago + PayPal (LatAm + Global).
4. **KYC + Open Banking** — Verificación completa de identidad e ingresos (Belvo).
5. **Stack moderno** — Next.js 16 App Router, React 19, Tailwind v4.
6. **PWA offline** — Funciona sin internet en visitas a propiedades.
7. **Multi-tenant / White-label** — Listo para inmobiliarias y agencias.
8. **Documentos fiscales** — Recibo, Paz y Salvo, Certificado, Inventario generados automáticamente.
9. **WhatsApp automation** — Recordatorios de pago y notificaciones vía Baileys.
10. **Seguridad robusta** — CSP nonce, RLS, 2FA, webhooks firmados, GDPR.

---

## 📊 Estado del proyecto

- ✅ Build de producción compila correctamente
- ✅ TypeCheck pasa limpio (sin errores de tipo)
- ✅ 57/57 tests unitarios pasan
- ✅ Demo en vivo funcionando
- ✅ Documentación completa
- ✅ CI/CD pipeline operativo
- ✅ Docker-ready
- ✅ 20 módulos funcionales completos
- ✅ 6 idiomas completos
- ✅ PWA con offline-first

**Pre-revenue** — producto 100% funcional pero sin tracción comercial todavía.

---

## 🔄 Razón de la venta

Construí RentNow como side project para validar el nicho PropTech LATAM. El código está completo y el producto funciona, pero mi foco profesional cambió a otro proyecto. Prefiero transferirlo a alguien que lo lleve a producción en lugar de dejarlo archivado.

---

## 📦 Transferencia

1. **Pago** vía Microns.io escrow (Stripe Connect).
2. **Transferencia del repo** GitHub a la cuenta del comprador.
3. **Entrega de credenciales** Supabase demo (opcional, el comprador puede crear la suya).
4. **Soporte post-venta 14 días** por email o Discord para cualquier duda de despliegue o configuración.
5. **Guía de despliegue** paso a paso incluida en `docs/DEPLOY_PRODUCCION.md`.

---

## ❓ FAQ

**¿El producto tiene usuarios pagando?**
No. Es pre-revenue. El producto está 100% funcional pero no se ha lanzado comercialmente.

**¿Por qué el precio es $1,200 y no $5,000?**
Es un boilerplate completo, no una startup con MRR. El precio refleja el valor del código + demo + soporte, no un múltiplo de ARR. Si tuviera 100 usuarios pagando, el precio sería $5,000–$10,000 (3-5x ARR).

**¿Puedo ejecutarlo en mi propia cuenta de Vercel/Supabase?**
Sí, totalmente. La guía `docs/DEPLOY_PRODUCCION.md` explica cómo desplegar desde cero en 30 minutos.

**¿Incluye las integraciones de pago funcionando?**
El código de integración está completo y probado. Las claves API reales deben configurarse con tus propias cuentas (Stripe, MercadoPago, PayPal). Modo sandbox disponible para pruebas.

**¿Ofreces soporte post-venta?**
Sí, 14 días de soporte por email/Discord para dudas de despliegue y configuración. No incluye desarrollo de nuevas features.

**¿Puedo revender el código?**
No. La licencia comercial prohíbe la reventa como producto competidor. Puedes usarlo para tus propios clientes (white-label) y modificarlo libremente.

---

## 🔗 Links

- **Demo:** https://arriendos-kappa.vercel.app
- **Login demo:** `demo@rentnow.app` / `Demo123!`
- **Repositorio (privado hasta la venta):** https://github.com/di3go04/Arriendos

---

*Publicado en Microns.io — Junio 2026*
