# Guía de Inicio Rápido — RentNow

Sigue estos 10 pasos para tener RentNo funcionando en tu propio servidor.

---

## Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/rentnow.git
cd rentnow
```

## Paso 2: Instalar dependencias

```bash
npm install
```

## Paso 3: Crear proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis).
2. Crea un nuevo proyecto (elige la región más cercana a tu audiencia).
3. Guarda las credenciales de la página **Project Settings > API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Paso 4: Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_DEMO_MODE=true
```

## Paso 5: Aplicar migraciones de base de datos

Ve al SQL Editor de Supabase y ejecuta los archivos en orden:
```
supabase/migrations/
```

O usa la CLI de Supabase:

```bash
npx supabase db push
```

## Paso 6: Poblar datos demo

```bash
npm run seed:demo
```

Esto creará:
- Usuario: `demo@rentnow.com` / `RentNowDemo2026!`
- 3 propiedades de ejemplo
- 3 inquilinos
- 3 contratos activos
- Pagos de demostración

## Paso 7: Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

## Paso 8: Verificar que todo funciona

Visita:

- **Landing page:** http://localhost:3000
- **Health check:** http://localhost:3000/api/health
- **Dashboard:** Inicia sesión con `demo@rentnow.com`

## Paso 9: Desplegar en Vercel

```bash
# Conecta tu repositorio a Vercel
# O despliega desde la CLI:
npx vercel --prod
```

Configura las variables de entorno en el dashboard de Vercel (las mismas de `.env.local`).

## Paso 10: Personalizar

- **Branding:** Reemplaza logos y colores en `tailwind.config.js`
- **Dominio:** Configura tu dominio en Vercel
- **Pagos:** Configura Stripe, Mercado Pago o PayPal en el panel de administración
- **Idiomas:** Agrega o modifica traducciones en `lib/i18n.js`

---

## Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar desarrollo |
| `npm run build` | Build producción |
| `npm start` | Servir build producción |
| `npm run seed:demo` | Poblar datos demo |
| `npm run setup:demo` | Instalar + seed + dev (todo en uno) |
| `npm run lint` | Verificar código |
| `npm test` | Ejecutar tests |
