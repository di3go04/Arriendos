# Plan de Pruebas de Pagos

## Objetivos
- Validar integraciones de Mercado Pago y Stripe
- Verificar flujo de pagos en todos los planes (Básico, Profesional, Empresa)
- Probar escenarios de éxito/fallo en diferentes monedas
- Validar webhooks de confirmación de pagos

## Casos de Prueba
1. **Mercado Pago - Checkout Pro**
   - Pago único con tarjeta
   - Suscripción recurrente
   - Validar webhook de éxito
   - Simular error de autenticación

2. **Stripe - Checkout Session**
   - Pago con tarjeta
   - Pago con PayPal (si configurado)
   - Validar redirección a success URL
   - Simular timeout de pago

3. **Monedas Internacionales**
   - Pago en USD, COP, EUR
   - Validar conversión de monedas
   - Verificar formato de precios en UI

4. **Webhooks**
   - Simular evento de pago exitoso
   - Simular evento de pago fallido
   - Validar actualización de estado en BD

## Entorno de Pruebas
- Usar sandbox de Mercado Pago y Stripe
- Configurar URLs de retorno en .env.local
- Verificar logs en console.log

## Herramientas
- Jest para pruebas unitarias
- Playwright para pruebas de UI
- Postman para pruebas de API

## Cobertura Esperada
- 100% de los componentes de pago
- 90% de los escenarios críticos

## Responsables
- Desarrollador: [Tu Nombre]
- QA: [Nombre del QA]

## Cronograma
- [Fecha] - Crear pruebas iniciales
- [Fecha] - Ejecutar pruebas completas
- [Fecha] - Corregir fallos