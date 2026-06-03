<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:qa-verification -->
# QA Verification — Rentnow

## Playwright (automatizado)
```bash
# Ejecutar suite completa (64 tests: 32 por navegador)
npx playwright test src/modules/e2e-ci/tests/qa-verification.spec.ts

# Con interfaz grafica
npx playwright test src/modules/e2e-ci/tests/qa-verification.spec.ts --headed

# Solo Chromium
npx playwright test src/modules/e2e-ci/tests/qa-verification.spec.ts --project=chromium

# Modo UI interactivo
npx playwright test --ui
```

## Consola del navegador (manual)
Abrir `scripts/qa-console-snippet.js`, copiar el contenido y pegarlo en la consola del navegador (F12 > Console).

## Check rapido pre-deploy
```bash
npm run verify && npx playwright test src/modules/e2e-ci/tests/qa-verification.spec.ts
```
<!-- END:qa-verification -->
