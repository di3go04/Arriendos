# CONTRATO DE SUSCRIPCIÓN DE VIVIENDA FLEXIBLE (REaaS)

**Entre:** RentNow S.A.S. ("Proveedor") y el suscriptor identificado al final ("Suscriptor")

---

## CLÁUSULA 1 — OBJETO

El Proveedor otorga al Suscriptor el derecho de uso de la propiedad identificada en el Anexo 1 bajo el modelo de suscripción mensual flexible (Real Estate as a Service), de conformidad con los términos del presente contrato.

## CLÁUSULA 2 — MODALIDADES DE SUSCRIPCIÓN

| Tipo | Descripción | Plazo mínimo | Pausas máximas |
|------|-------------|-------------|----------------|
| Coliving | Habitación individual en espacio compartido | 1 mes | 3 meses/año |
| Flex Lease | Propiedad completa con contratos flexibles | 3 meses | 2 meses/año |
| Senior Living | Vivienda con servicios de asistencia | 6 meses | 1 mes/año |
| Full Property | Suscripción anual con beneficios premium | 12 meses | 1 mes/año |

## CLÁUSULA 3 — PAGOS

3.1. El Suscriptor pagará una tarifa mensual anticipada según el plan seleccionado.
3.2. El pago se realizará mediante domiciliación automática a través de la pasarela de pagos Stripe/Wompi.
3.3. En caso de impago, el Proveedor aplicará un interés de mora del 1.5% mensual.
3.4. El Suscriptor puede pausar la suscripción hasta el máximo indicado en la Cláusula 2, sin costo adicional.

## CLÁUSULA 4 — PAUSA Y SUSPENSIÓN

4.1. El Suscriptor puede pausar su suscripción vía PUT /api/modules/reas/pause con body { subscriptionId, action: "pause" }.
4.2. Durante la pausa no se generan cargos ni se exige ocupación.
4.3. Para reanudar, usar { action: "resume" } en el mismo endpoint.

## CLÁUSULA 5 — TERMINACIÓN

5.1. Cualquiera de las partes puede terminar la suscripción con 30 días de aviso.
5.2. El Proveedor puede terminar inmediatamente por: (a) impago superior a 60 días, (b) uso indebido de la propiedad, (c) fraude en verificación KYC.
5.3. En caso de terminación anticipada por el Suscriptor antes del plazo mínimo, se cobrará el equivalente a 1 mes de penalidad.

## CLÁUSULA 6 — VERIFICACIÓN DE IDENTIDAD (KYC)

El Suscriptor acepta someterse al proceso de verificación de identidad digital (KYC) según los términos del Aviso de Privacidad adjunto, que incluye: (a) escaneo de documento de identidad, (b) verificación biométrica facial, (c) validación de solvencia económica mediante Open Banking.

## CLÁUSULA 7 — LEY APLICABLE

Este contrato se rige por la Ley 527 de 1999 (Comercio Electrónico), la Ley 1581 de 2012 (Protección de Datos) y el Código Civil Colombiano. La firma electrónica tendrá plena validez jurídica según el Decreto 2364 de 2012.

---

**ANEXO 1 — DATOS DE LA SUSCRIPCIÓN**

| Campo | Valor |
|-------|-------|
| Suscriptor ID | _________________ |
| Propiedad ID | _________________ |
| Tipo de plan | _________________ |
| Precio mensual | $ _________________ |
| Fecha de inicio | _________________ |
| Plazo mínimo | _________________ meses |
| Pausas máximas | _________________ |
