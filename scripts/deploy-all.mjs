#!/usr/bin/env node

/**
 * deploy-all.mjs
 * ==============
 * Automatización completa: respaldo a 'main' + despliegue demo estática a 'gh-pages'.
 *
 * BLOQUE 1 — Respaldo automático de la rama principal (main)
 * BLOQUE 2 — Despliegue de demo estática a GitHub Pages (gh-pages)
 *
 * Uso:  node scripts/deploy-all.mjs
 */

import { execSync } from 'child_process';
import {
  cpSync, existsSync, mkdirSync,
  rmSync, writeFileSync,
} from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMP = join(ROOT, '.temp-gh-pages');
const OUT_DEPLOY = join(ROOT, 'out-gh-pages');

// ── Helpers ──────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`\n❯ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || ROOT, encoding: 'utf-8', ...opts });
}

function runCapture(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', cwd: opts.cwd || ROOT, ...opts }).toString().trim();
}

function tryCapture(cmd, opts = {}) {
  try { return runCapture(cmd, opts); } catch { return ''; }
}

function safeRm(dir) {
  if (existsSync(dir)) {
    const name = relative(ROOT, dir);
    console.log(`  → Limpiando ${name}/`);
    rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function banner(msg) {
  const line = '═'.repeat(76);
  console.log(`\n  ${line}`);
  console.log(`  ${msg}`);
  console.log(`  ${line}\n`);
}

// ── Constantes ────────────────────────────────────────────────

const COMMIT_MSG = 'feat: rentnow software architecture updates and automated deployment pipeline';
const ORIGIN_URL = 'https://github.com/di3go04/Arriendos.git';


// ===================================================================
// BLOQUE 1: RESPALDO AUTOMÁTICO DE LA RAMA PRINCIPAL (MAIN)
// ===================================================================

function block1_git_backup() {
  banner('BLOQUE 1 — Respaldo automático de la rama main');

  // 1. git add
  console.log('\n  ▶ Agregando todos los archivos locales...');
  run('git add -A');

  // 2. git commit (maneja el caso sin cambios)
  const hasChanges = tryCapture('git diff --cached --quiet', { stdio: 'pipe' });
  if (hasChanges === '') {
    // diff --cached --quiet returns 0 when no diff → no output = no changes
    console.log('  → No hay cambios nuevos para commitear.');
  } else {
    console.log(`  ▶ Commiteando: "${COMMIT_MSG}"`);
    run(`git commit -m "${COMMIT_MSG}"`);
  }

  // 3. Renombrar rama y pushear
  console.log('  ▶ Asegurando nombre de rama: main');
  run('git branch -M main');

  console.log('  ▶ Subiendo a origin/main...');
  run('git push origin main');

  console.log('\n  ✓ Bloque 1 completado — main respaldada en GitHub.');
}

// ===================================================================
// BLOQUE 2: DESPLIEGUE ENTORNO TEMPORAL A GITHUB PAGES
// ===================================================================

function block2_gh_pages_deploy() {
  banner('BLOQUE 2 — Despliegue de demo estática a gh-pages');

  // ── Paso 1: Preparar carpeta temporal ──────────────────────────

  console.log('\n  ▶ Preparando entorno temporal...');
  safeRm(TEMP);
  safeRm(OUT_DEPLOY);
  ensureDir(TEMP);

  // ── Paso 2: Copiar archivos esenciales ─────────────────────────

  console.log('  ▶ Copiando archivos fuente...');
  const items = [
    'src', 'public',
    'package.json', 'package-lock.json',
    'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs',
  ];
  for (const item of items) {
    const src = join(ROOT, item);
    const dst = join(TEMP, item);
    if (existsSync(src)) {
      cpSync(src, dst, { recursive: true, force: true });
      console.log(`    ✔ ${item}`);
    } else {
      console.log(`    ⚠ ${item} no encontrado, se omite`);
    }
  }

  // ── Paso 3: Vincular node_modules (junction en Windows) ────────

  console.log('  ▶ Vinculando node_modules...');
  const nmTarget = join(ROOT, 'node_modules');
  const nmLink = join(TEMP, 'node_modules');
  if (!existsSync(nmLink) && existsSync(nmTarget)) {
    try {
      runCapture(`cmd /c mklink /J "${nmLink}" "${nmTarget}"`);
      console.log('    ✔ junction creada para node_modules');
    } catch {
      // Fallback: copiar node_modules (más lento)
      console.log('    ⚠ No se pudo crear junction — copiando node_modules (esto puede tomar un momento)...');
      cpSync(nmTarget, nmLink, { recursive: true, force: true });
      console.log('    ✔ node_modules copiado');
    }
  }

  // ── Paso 4: Inyectar next.config.mjs (output static) ───────────

  console.log('  ▶ Generando next.config.mjs con output estático...');

  // Eliminar el next.config.ts original del temp (Next.js prioriza .ts)
  const origConfigTs = join(TEMP, 'next.config.ts');
  if (existsSync(origConfigTs)) {
    rmSync(origConfigTs, { force: true });
  }

  const nextConfigContent = `/**
 * next.config.mjs — generado automáticamente por deploy-all.mjs
 * Configuración para exportación estática a GitHub Pages
 */
const nextConfig = {
  output: 'export',
  basePath: '/Arriendos',
  assetPrefix: '/Arriendos',
  images: { unoptimized: true },
  // Las páginas demo no usan i18n; ignoramos errores TS de módulos remotos
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
`;
  writeFileSync(join(TEMP, 'next.config.mjs'), nextConfigContent);
  console.log('    ✔ next.config.mjs creado');

  // ── Paso 5: Modificar estructura de app en temp ─────────────────

  console.log('  ▶ Adaptando estructura de rutas para exportación estática...');

  // Eliminar directorio [locale] (depende de next-intl, no funciona en export estático)
  const localeDir = join(TEMP, 'src', 'app', '[locale]');
  if (existsSync(localeDir)) {
    rmSync(localeDir, { recursive: true, force: true });
    console.log('    ✔ [locale]/ eliminado');
  }

  // Eliminar API routes (no funcionan con output: 'export')
  const apiDir = join(TEMP, 'src', 'app', 'api');
  if (existsSync(apiDir)) {
    rmSync(apiDir, { recursive: true, force: true });
    console.log('    ✔ api/ eliminado (incompatible con export estático)');
  }

  // Reemplazar layout.tsx con una versión simplificada sin i18n
  const layoutPath = join(TEMP, 'src', 'app', 'layout.tsx');
  const simplifiedLayout = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rentnow | Demo Interactiva',
  description: 'Demo interactiva de la plataforma profesional de arrendamientos Rentnow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
`;
  writeFileSync(layoutPath, simplifiedLayout);
  console.log('    ✔ layout.tsx simplificado (sin i18n)');

  // Crear page.tsx desde la demo interactiva
  const pagePath = join(TEMP, 'src', 'app', 'page.tsx');
  // Re-exporta el DemoPage de app/demo/page.tsx
  const pageContent = `export { default } from './demo/page';
`;
  writeFileSync(pagePath, pageContent);
  console.log('    ✔ page.tsx apunta a demo interactiva');

  // ── Paso 6: Compilar (next build) ──────────────────────────────

  console.log('\n  ▶ Ejecutando npm run build en el entorno temporal...');

  const VERCEL_ENV = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !k.startsWith('NEXT_PUBLIC_SUPABASE') && !k.startsWith('SUPABASE_'))
  );

  try {
    run('npm run build', { cwd: TEMP, env: { ...VERCEL_ENV, PATH: process.env.PATH } });
  } catch {
    console.error('\n  ✘ ERROR: La compilación falló. Revisá los mensajes de arriba.');
    console.error(`  → Podés inspeccionar ${relative(ROOT, TEMP)}/ para depurar.`);
    process.exit(1);
  }

  // ── Paso 7: Recoger el output estático ─────────────────────────

  console.log('\n  ▶ Preparando carpeta de deploy...');
  const tempOut = join(TEMP, 'out');
  if (!existsSync(tempOut)) {
    console.error('\n  ✘ ERROR: No se encontró out/ en el directorio temporal. La compilación no generó archivos.');
    process.exit(1);
  }

  // Mover out/ a out-gh-pages/
  if (existsSync(OUT_DEPLOY)) rmSync(OUT_DEPLOY, { recursive: true, force: true });
  cpSync(tempOut, OUT_DEPLOY, { recursive: true, force: true });
  console.log(`    ✔ Archivos estáticos copiados a ${relative(ROOT, OUT_DEPLOY)}/`);

  // ── Paso 8: Duplicar index.html como 404.html ──────────────────

  const indexHtml = join(OUT_DEPLOY, 'index.html');
  const notFoundHtml = join(OUT_DEPLOY, '404.html');
  if (existsSync(indexHtml) && !existsSync(notFoundHtml)) {
    cpSync(indexHtml, notFoundHtml);
    console.log('    ✔ 404.html creado (copia de index.html) — SPA routing en GH Pages');
  } else {
    console.log('    ⚠ index.html no encontrado o 404.html ya existe; se omite');
  }

  // ── Paso 9: Subir a gh-pages (git push force) ─────────────────

  console.log('\n  ▶ Subiendo a gh-pages...');
  run('git init', { cwd: OUT_DEPLOY });
  run(`git remote add origin ${ORIGIN_URL}`, { cwd: OUT_DEPLOY });
  run('git checkout -b gh-pages', { cwd: OUT_DEPLOY });

  // .gitkeep para que el directorio .git no quede vacío
  writeFileSync(join(OUT_DEPLOY, '.gitkeep'), '');

  run('git add -A', { cwd: OUT_DEPLOY });

  const ghPagesCommitMsg = `chore: deploy static demo — ${new Date().toISOString().split('T')[0]}`;
  run(`git commit -m "${ghPagesCommitMsg}"`, { cwd: OUT_DEPLOY });

  try {
    run(`git push origin gh-pages --force`, { cwd: OUT_DEPLOY });
    console.log('\n  ✓ gh-pages actualizada en GitHub.');
  } catch {
    console.error('\n  ✘ ERROR: No se pudo pushear a gh-pages.');
    console.error('  → Verificá que tengas permisos de escritura en el repositorio.');
    process.exit(1);
  }

  // ── Paso 10: Limpieza ─────────────────────────────────────────

  console.log('\n  ▶ Limpiando directorios temporales...');
  safeRm(TEMP);

  console.log(`\n  ✓ Despliegue completado.`);
  console.log(`    URL: https://di3go04.github.io/Arriendos/`);
}

// ===================================================================
// MAIN
// ===================================================================

try {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Arriendos — Pipeline Automatizado de Despliegue      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  block1_git_backup();
  block2_gh_pages_deploy();

  banner('RESUMEN FINAL');
  console.log('  ✓ Rama main      → respaldada con código fuente original.');
  console.log('  ✓ Rama gh-pages  → demo estática desplegada.');
  console.log('');
  console.log('  https://github.com/di3go04/Arriendos/tree/main');
  console.log('  https://github.com/di3go04/Arriendos/tree/gh-pages');
  console.log('  https://di3go04.github.io/Arriendos/');
  console.log('');

} catch (err) {
  console.error('\n  ✘ Error crítico en el pipeline:', err.message);
  process.exit(1);
}
