# Arquitectura modular RentNow (20 módulos)

Cada módulo vive en `src/modules/<id>/` con contrato TypeScript, implementación aislada y rutas API delgadas en `src/app/api/modules/<id>/`.

```
src/modules/
├── _kernel/                 # Contratos compartidos, Supabase admin, event bus
├── auth-enterprise/         # 1 MFA, lockout, dispositivos, recuperación
├── payments-mp/             # 2 Mercado Pago Checkout API + webhooks
├── stripe-payments/         # 2b Stripe Checkout USD + webhooks white-label
├── subscriptions-saas/      # 3 Planes, trials, cancelación recurrente
├── superadmin-tenant/       # 4 Orgs, límites, impersonación, métricas
├── e2e-ci/                  # 5 Playwright + CI browsers
├── tests-api/               # 6 Jest APIs críticas (≥70% objetivo)
├── docs-dev/                # 7 README, diagramas, env por entorno
├── openapi-devportal/       # 8 Swagger UI + Postman export
├── seo-advanced/            # 9 CWV, schema, hreflang, blog SEO
├── pwa-prod/                # 10 Offline, push VAPID, install metrics
├── design-system/           # 11 Storybook + tokens
├── performance/             # 12 Lazy, AVIF, cache, bundle budget
├── cicd-platform/           # 13 Preview, migraciones, rollback
├── docker-deploy/           # 14 Compose + WhatsApp bridge
├── e-signature/               # 15 Firma legal + audit trail + PDF
├── ai-contracts/            # 16 Gemini plantillas por país + cost logs
├── whatsapp-automation/     # 17 Colas + plantillas cobro + VPS doc
├── finance-export/          # 18 Excel/PDF morosidad y proyección
├── security-compliance/     # 19 OWASP, RLS audit, política datos
└── commercial-kit/          # 20 Landing reventa + soporte 30d

src/app/api/modules/<id>/   # Adapters HTTP (sin lógica de negocio)
```

## Reglas de desacoplamiento

1. Los módulos **solo** importan desde `@/modules/_kernel` o su propia carpeta.
2. El código legacy en `src/app` y `src/lib` delega en `createXService()` del módulo.
3. Comunicación cross-módulo vía contratos en `_kernel/contracts/`, nunca imports directos entre módulos hermanos.
