# Rotación de Supabase Service Role Key — Procedimiento

## ⚠️ Contexto
Tu repo es público en GitHub. Aunque el código actual usa `process.env.SUPABASE_SERVICE_ROLE_KEY` correctamente (no hay leaks detectados en el historial), es buena práctica rotar la key después de una auditoría de seguridad, especialmente antes de transferir ownership a un buyer.

## Pasos (15 minutos)

### 1. Generar nueva key
1. Ve a https://supabase.com/dashboard/project/dinrxquxyyrygfkotqja/settings/api
2. En la sección "Project API keys", busca "service_role"
3. Click en "Reset" → confirma
4. **Copia el nuevo valor** (no lo podrás ver de nuevo después de cerrar)

### 2. Actualizar Vercel (producción)
1. Ve a https://vercel.com/ → tu proyecto "arriendos"
2. Settings → Environment Variables
3. Busca `SUPABASE_SERVICE_ROLE_KEY`
4. Click en "Edit" → pega el nuevo valor → Save
5. **Redeploy**: Deployments → último deploy → "Redeploy"

### 3. Actualizar local (si desarrollas)
1. Edita tu `.env.local` localmente
2. Cambia `SUPABASE_SERVICE_ROLE_KEY=` por el nuevo valor
3. Reinicia el dev server: `Ctrl+C` → `npm run dev`

### 4. Verificar
- Login en la demo: https://arriendos-kappa.vercel.app/login-direct
- Click botón ⚡ → debe llegar al dashboard
- Si falla, revisar logs en Vercel: Deployments → Functions → /api/auth/demo

### 5. Verificar rotación
Vuelve a Supabase Dashboard → Settings → API
- La "Created date" de la service_role key debe ser hoy
- La key antigua ya no debe funcionar (test: intentar login con la vieja debe fallar)

---

## 🚨 Otras claves a rotar (orden de criticidad)

Si quieres ser exhaustivo (recomendado antes de vender):

| Clave | Criticidad | Razón |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 CRÍTICA | Bypass de RLS, acceso total a DB |
| `STRIPE_SECRET_KEY` | 🔴 CRÍTICA | Acceso a cobros, refunds, customers |
| `MP_ACCESS_TOKEN` | 🔴 CRÍTICA | Acceso a cobros MercadoPago |
| `BELVO_SECRET_PASSWORD` | 🔴 CRÍTICA | Acceso a Open Banking de usuarios |
| `TWILIO_AUTH_TOKEN` | 🟠 ALTA | Enviar SMS/llamadas fraudulentas |
| `GEMINI_API_KEY` | 🟠 ALTA | Uso facturable de AI |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | 🟠 ALTA | Firmar/forjar sesiones JWT |
| `RESEND_API_KEY` | 🟡 MEDIA | Enviar emails desde tu dominio |
| `VAPID_PRIVATE_KEY` | 🟡 MEDIA | Firmar push notifications |
| `VOICEFLOW_API_KEY` | 🟢 BAJA | Solo IA conversacional |
| `PAYPAL_SECRET` | 🟡 MEDIA | Acceso a PayPal |
| `WHATSAPP_BRIDGE_SECRET` | 🟡 MEDIA | Acceso al bridge de WhatsApp |

### Cómo rotar cada una (links directos):
- **Stripe**: https://dashboard.stripe.com/apikeys → "Roll key"
- **MercadoPago**: https://www.mercadopago.com.co/developers/panel/app → "Reintegrar credenciales"
- **Belvo**: https://dashboard.belvo.com → Settings → API Keys → "Rotate"
- **Twilio**: https://console.twilio.com → Account → API Keys → "Regenerate Auth Token"
- **Gemini**: https://aistudio.google.com/app/apikey → borrar y crear nueva
- **Resend**: https://resend.com/api-keys → borrar y crear nueva
- **PayPal**: https://developer.paypal.com/dashboard/applications/sandbox → "Manage Apps"
- **VAPID**: generar nuevas con `npx web-push generate-vapid-keys`
- **AUTH_SECRET**: `openssl rand -base64 32`

---

## ✅ Checklist final post-rotación

- [ ] Nueva `SUPABASE_SERVICE_ROLE_KEY` en Vercel + local
- [ ] Redeploy exitoso
- [ ] Login demo funciona
- [ ] Webhook MP recibe pago de prueba (si tienes sandbox MP)
- [ ] Logs de Vercel sin errores 503 en `/api/auth/demo`
- [ ] Logs de Vercel sin errores 401 en `/api/payments/webhook-mp`
- [ ] Commit de los cambios de seguridad (RLS migration + DEMO_PASSWORD + webhook fail-closed)
- [ ] Push a GitHub → CI/CD verde
- [ ] (Opcional) Rotar otras 11 claves de la tabla de arriba

---

## 📝 Para reportar al buyer

Cuando vendas el boilerplate, incluye este mensaje al buyer:

```
Security audit completed 2026-06-29:
- ✅ RLS enabled on all 62 tables (was 43/62 before)
- ✅ Hardcoded demo password moved to env var with stronger default
- ✅ Webhook verification is now fail-closed (was fail-open)
- ✅ All real secrets (Stripe, MP, Belvo, Twilio, etc.) come from process.env
- ✅ No leaked secrets in git history (verified via git log + semgrep-style scan)
- ✅ Recommended post-purchase: rotate SUPABASE_SERVICE_ROLE_KEY + AUTH_SECRET
  (10 min, instructions in /docs/KEY_ROTATION.md)
```
