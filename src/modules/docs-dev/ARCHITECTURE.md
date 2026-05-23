# Arquitectura RentNow (módulo docs-dev)

## Capas

```mermaid
flowchart TB
  UI[App Router pages] --> API[src/app/api/modules]
  API --> MOD[src/modules]
  MOD --> KERNEL[_kernel]
  MOD --> SB[(Supabase)]
  MOD --> MP[Mercado Pago]
  MOD --> WA[WhatsApp Bridge]
```

## Módulos y contratos

| ID | Carpeta | Contrato |
|----|---------|----------|
| 1 | auth-enterprise | `IAuthEnterpriseService` |
| 2 | payments-mp | `IPaymentsMpService` |
| 3 | subscriptions-saas | `ISubscriptionsSaasService` |

## Variables por entorno

Ver `ENVIRONMENTS.md` en este mismo directorio.
