/**
 * =============================================================================
 *  QA CONSOLE SNIPPET — Verificacion manual en navegador
 * =============================================================================
 *
 *  Instrucciones:
 *    1. Abre la aplicacion en el navegador (localhost:3000 o la URL de preview)
 *    2. Abre DevTools (F12) y ve a la pestana "Console"
 *    3. Copia y pega TODO este codigo en la consola
 *    4. Presiona Enter
 *    5. Revisa la tabla de resultados en la consola
 *
 *  Que verifica:
 *    - Elementos vacios (body, headings, buttons sin texto)
 *    - Imagenes rotas (con src pero que no cargan)
 *    - Errores de recursos (peticiones 4xx/5xx)
 *    - Estado de carga inicial
 *    - Rendimiento (DOM size, memoria)
 *    - Meta tags esenciales
 * =============================================================================
 */

(async function qaConsoleCheck() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function check(name, condition, detail) {
    if (condition) {
      passed++;
      results.push({ Verificacion: name, Estado: 'PASS', Detalle: detail || '' });
    } else {
      failed++;
      results.push({ Verificacion: name, Estado: 'FAIL', Detalle: detail || '' });
    }
  }

  function checkWarn(name, condition, detail) {
    if (!condition) {
      results.push({ Verificacion: name, Estado: 'WARN', Detalle: detail || '' });
    }
  }

  console.log('%c🔍 QA Verification — Rentnow', 'font-size: 18px; font-weight: bold;');
  console.log('%cEjecutando verificaciones en:', 'font-weight: bold;', window.location.href);
  console.log('');

  // ── 1. Renderizado basico ──
  check('body no vacio', document.body && document.body.innerHTML.trim().length > 0, 'body tiene contenido');

  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  checkWarn('headings presentes', headings.length > 0, `${headings.length} heading(s) encontrado(s)`);

  let emptyHeadings = 0;
  headings.forEach((h) => {
    if (!h.textContent?.trim()) emptyHeadings++;
  });
  check('sin headings vacios', emptyHeadings === 0, `${emptyHeadings} heading(s) vacio(s)`);

  // ── 2. Botones y enlaces ──
  const buttons = document.querySelectorAll('button');
  let emptyButtons = 0;
  buttons.forEach((b) => {
    const text = b.textContent?.trim() || '';
    if (!text && !b.querySelector('svg') && !b.querySelector('img')) emptyButtons++;
  });
  checkWarn('botones con contenido', emptyButtons === 0, `${emptyButtons} boton(es) sin texto ni icono`);

  // ── 3. Imagenes ──
  const images = Array.from(document.querySelectorAll('img'));
  let brokenImages = 0;
  const brokenImageList: string[] = [];

  for (const img of images) {
    if (img.src) {
      try {
        await fetch(img.src, { method: 'HEAD', mode: 'no-cors' });
        // no-cors no da status, asi que verificamos por dataset manual
      } catch {
        brokenImages++;
        brokenImageList.push(img.src);
      }
      if (img.complete && img.naturalWidth === 0 && img.naturalHeight === 0) {
        brokenImages++;
        brokenImageList.push(img.src);
      }
    }
  }
  check('imagenes sin errores de carga', brokenImages === 0, brokenImageList.join(', ') || 'todas OK');

  // ── 4. Imagenes con alt text ──
  const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt'));
  checkWarn('imagenes con atributo alt', imagesWithoutAlt.length === 0, `${imagesWithoutAlt.length} img sin alt`);

  // ── 5. Meta tags ──
  const metaDescription = document.querySelector('meta[name="description"]');
  const metaViewport = document.querySelector('meta[name="viewport"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');

  check('meta description existe', !!metaDescription, metaDescription?.getAttribute('content') || 'ausente');
  check('meta viewport existe', !!metaViewport, metaViewport?.getAttribute('content') || 'ausente');
  checkWarn('og:title existe', !!ogTitle, ogTitle?.getAttribute('content') || 'ausente');

  // ── 6. Titulo de pagina ──
  checkWarn('title no vacio', document.title.trim().length > 0, `Title: "${document.title}"`);

  // ── 7. Loading states (spinners, skeletons) ──
  const loadingElements = document.querySelectorAll(
    '[role="status"], .animate-pulse, [class*="skeleton"], [class*="loading"], [class*="spinner"], svg[class*="animate-spin"]',
  );
  const visibleLoaders = Array.from(loadingElements).filter(
    (el) => (el as HTMLElement).offsetParent !== null,
  );
  checkWarn(
    'sin loaders visibles (deberian desaparecer tras carga)',
    visibleLoaders.length === 0,
    `${visibleLoaders.length} loader(es) visibles`,
  );

  // ── 8. Performance ──
  const performanceEntries = performance.getEntriesByType('resource');
  const slowResources = performanceEntries.filter((e) => e.duration > 3000);
  checkWarn(
    'recursos rapidos (<3s)',
    slowResources.length === 0,
    `${slowResources.length} recurso(s) lento(s): ${slowResources.map((r) => r.name).join(', ')}`,
  );

  const domElements = document.querySelectorAll('*').length;
  checkWarn(
    'DOM no excesivo',
    domElements < 2000,
    `${domElements} elementos en el DOM`,
  );

  // ── 9. Console errors (si PerformanceObserver esta disponible) ──
  const failedResources = performanceEntries.filter(
    (e) => (e as PerformanceResourceTiming).responseStatus >= 400,
  ) as PerformanceResourceTiming[];
  check(
    'peticiones sin error 4xx/5xx',
    failedResources.length === 0,
    failedResources.map((r) => `${r.name} (status ${r.responseStatus})`).join(', ') || 'todas OK',
  );

  // ── 10. Variables CSS / Tailwind ──
  const hasTailwind = document.querySelector('[class*="flex"], [class*="grid"], [class*="text-"]');
  checkWarn('Tailwind CSS activo', !!hasTailwind, hasTailwind ? 'clases Tailwind detectadas' : 'no se detectaron clases');

  // ── 11. Errores globales capturados ──
  const jsErrors = window.__qaErrors || [];
  check('sin errores JS no capturados', jsErrors.length === 0, `${jsErrors.length} error(es)`);

  // ── 12. Responsive viewport ──
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  checkWarn('viewport razonable (>320px)', vw > 320, `${vw}x${vh}`);

  // ── Resultados ──
  console.log('');
  console.log('%c📊 RESULTADOS', 'font-size: 16px; font-weight: bold;');
  console.table(results);
  console.log('');
  console.log(`%c✅ PASS: ${passed}  |  ❌ FAIL: ${failed}  |  ⚠️  WARN: ${results.length - passed - failed}`, 'font-size: 14px;');

  if (failed > 0) {
    console.log('%c⚠️  Hay fallos que requieren atencion. Revisa la tabla arriba.', 'color: orange; font-size: 14px;');
  } else {
    console.log('%c✅ Todos los checks pasaron o son advertencias.', 'color: green; font-size: 14px;');
  }

  return { passed, failed, total: results.length };
})().catch((err) => console.error('[QA] Error en verificacion:', err));
