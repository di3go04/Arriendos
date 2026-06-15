# Buyer Checklist — RentNow

Usa esta lista para asegurarte de que todo está en orden antes y después de la compra.

---

## 📋 Pre-compra

- [ ] He visto la **demo en vivo** (solicitar enlace al vendedor)
- [ ] He revisado el **LISTING_FAQ.md** con las preguntas frecuentes
- [ ] Comprendo el **stack tecnológico** (Next.js, React, Supabase)
- [ ] Sé que necesito **crear cuentas gratuitas** en los servicios externos
- [ ] He verificado que el **precio incluye el código fuente completo**

## 🗝️ Cuentas necesarias (gratuitas)

| Servicio | Para qué | Link | Tiempo de setup |
|---|---|---|---|
| Supabase | Base de datos + Auth | [supabase.com](https://supabase.com) | 5 min |
| Vercel | Hosting | [vercel.com](https://vercel.com) | 5 min |
| Mercado Pago | Pagos LATAM | [mercadopago.com](https://mercadopago.com) | 10 min |
| Stripe | Pagos internacionales | [stripe.com](https://stripe.com) | 10 min |
| Google AI | Gemini API | [aistudio.google.com](https://aistudio.google.com) | 5 min |
| Resend | Emails transaccionales | [resend.com](https://resend.com) | 5 min |

## ✅ Post-compra

- [ ] Recibí el **repositorio Git** con historial completo
- [ ] Ejecuté `cp .env.example .env.local`
- [ ] Completé todas las variables de entorno
- [ ] Ejecuté `npm install` sin errores
- [ ] Ejecuté `npm run seed:demo` y vi ✅ en consola
- [ ] Ejecuté `npm run dev` y abrí http://localhost:3000
- [ ] Inicié sesión con `demo@rentnow.com` / `RentNowDemo2026!`
- [ ] Verifiqué el dashboard con datos demo
- [ ] Ejecuté `npm run build` sin errores
- [ ] Desplegué en Vercel

## 🎨 Personalización

- [ ] Cambié el logo y nombre en la Navbar
- [ ] Actualicé colores en `tailwind.config.js`
- [ ] Configuré mi dominio personalizado
- [ ] Agregué mi información de contacto en el footer
- [ ] Configuré al menos un gateway de pago
- [ ] Desactivé el modo demo (`NEXT_PUBLIC_DEMO_MODE=false`)

## 🔐 Producción

- [ ] Configuré webhooks de pago en producción
- [ ] Habilité RLS en todas las tablas de Supabase
- [ ] Configuré backups automáticos de base de datos
- [ ] Agregué monitoring (PostHog, Sentry, etc.)
- [ ] Ejecuté `npm run verify` sin errores
