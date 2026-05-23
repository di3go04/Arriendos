# Checklist QA

## Automatizado

- `npm run lint`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build`

## Manual critico

- Registro e inicio de sesion.
- Crear propiedad.
- Crear contrato.
- Firmar contrato.
- Crear preferencia de pago Mercado Pago.
- Recibir webhook sandbox.
- Crear lead desde portal publico.
- Exportar reporte financiero.
- Descargar documento de inquilino.
- Revisar `/status`.

## Externo

- Mercado Pago requiere credenciales reales o sandbox.
- WhatsApp: `npm run whatsapp:bridge` activo y QR vinculado; probar `POST /api/notifications/whatsapp`.
- Email requiere Resend.
- Push requiere VAPID.
