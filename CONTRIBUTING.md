# Contributing

## Requisitos
- Node.js 20+
- Docker Desktop (para Supabase local)
- Cuenta en Supabase (producción)

## Setup local
```bash
git clone <repo>
npm install
cp .env.example .env.local
docker compose up -d
npm run dev
```

## Commits
Usamos commits semánticos:
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `refactor:` cambio de código sin funcionalidad nueva
- `docs:` documentación
- `test:` tests
- `chore:` tooling, config

## Antes de hacer PR
```bash
npm run verify
```
Esto ejecuta lint, typecheck, tests y build.

## Estructura
- `src/app/` — páginas y API routes (Next.js App Router)
- `src/components/` — componentes React reutilizables
- `src/modules/` — módulos funcionales con contratos desacoplados
- `src/lib/` — utilidades compartidas
- `src/context/` — contextos de React
- `src/i18n/` — configuración de internacionalización
- `supabase/` — migraciones de base de datos
