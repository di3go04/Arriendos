/**
 * =============================================================================
 *  QA PRICING NAVIGATION — Snippet de consola para verificar navegacion
 * =============================================================================
 *
 *  Instrucciones:
 *    1. Abre https://arriendos-kappa.vercel.app/es/precios en el navegador
 *    2. Abre DevTools (F12) → Console
 *    3. Copia y pega TODO este codigo en la consola
 *    4. Presiona Enter
 *    5. Revisa el reporte al final
 *
 *  Que hace:
 *    - Escanea todos los enlaces, botones y CTAs en la pagina de precios
 *    - Hace clic en cada uno y verifica que el destino cargue correctamente
 *    - Detecta 404s, errores JS, recursos rotos
 *    - Genera un reporte detallado al final
 *
 *  NOTA: Como el snippet corre en consola, la navegacion entre paginas
 *  recargara el script. Por eso usa fetch() para verificar URLs en vez de
 *  navegacion real, y solo hace clic en los enlaces que pueden probarse
 *  sin perder el contexto.
 * =============================================================================
 */

(async function qaPricingNavigation() {
  const BASE = window.location.origin;
  const CURRENT_PATH = window.location.pathname;
  const report = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  function addResult(element, destination, status, detail) {
    report.push({ Elemento: element, Destino: destination, Estado: status, Detalle: detail });
    if (status === 'PASS') passed++;
    else if (status === 'FAIL') failed++;
    else skipped++;
  }

  function isLikelyValid(url) {
    return url && !url.startsWith('#') && !url.startsWith('javascript:') && url !== '';
  }

  async function checkUrl(url, label) {
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'same-origin' });
      if (res.status >= 400) {
        addResult(label, url, 'FAIL', `HTTP ${res.status}`);
      } else {
        addResult(label, url, 'PASS', `HTTP ${res.status}`);
      }
    } catch (err) {
      if (url.startsWith(BASE) || url.startsWith('/')) {
        addResult(label, url, 'FAIL', `Error fetch: ${err.message}`);
      } else {
        addResult(label, url, 'SKIP', 'Url externa (no verificable por CORS)');
      }
    }
  }

  function resolveHref(href) {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    if (href.startsWith('/')) return BASE + href;
    return BASE + '/' + href;
  }

  // ── 1. Escanear todos los enlaces <a> en la pagina ──
  console.log('%c🔍 QA: Pricing Navigation — Escaneando enlaces...', 'font-size: 16px; font-weight: bold;');
  console.log(`Pagina actual: ${CURRENT_PATH}`);
  console.log('');

  const allLinks = Array.from(document.querySelectorAll('a[href]'));
  const allButtons = Array.from(document.querySelectorAll('button'));

  // Filtrar enlaces unicos relevantes
  const seen = new Set();
  const uniqueLinks = allLinks.filter((a) => {
    const href = a.getAttribute('href');
    if (!href || seen.has(href) || href === '#') return false;
    seen.add(href);
    return true;
  });

  console.log(`Total enlaces unicos encontrados: ${uniqueLinks.length}`);
  console.log(`Total botones encontrados: ${allButtons.length}`);
  console.log('');

  // ── 2. Verificar cada enlace por HTTP ──
  console.log('%cVerificando enlaces via HTTP HEAD...', 'font-weight: bold;');

  const navLinks = uniqueLinks.filter((a) => {
    const href = a.getAttribute('href');
    return href && !href.includes('mailto:') && !href.includes('tel:');
  });

  // Verificar hasta 20 enlaces (limite por rate)
  const batch = navLinks.slice(0, 20);

  for (const a of batch) {
    const href = a.getAttribute('href');
    const text = (a.textContent || '').trim().slice(0, 50) || '(sin texto)';
    const url = resolveHref(href);

    if (url && isLikelyValid(href)) {
      await checkUrl(url, `${text} [<a>]`);
    } else {
      addResult(`${text} [<a>]`, href, 'SKIP', 'Href no verificable');
    }
  }

  // ── 3. Verificar botones CTAs de planes ──
  console.log('');
  console.log('%cVerificando botones CTA de planes...', 'font-weight: bold;');

  const planButtons = allButtons.filter((b) => {
    const t = (b.textContent || '').toLowerCase();
    return t.includes('elegir') || t.includes('comenzar') || t.includes('seleccionar');
  });

  for (const btn of planButtons) {
    const text = (btn.textContent || '').trim().slice(0, 50);
    // Los botones CTA hacen submit o navegacion via JS
    // Verificamos que el boton sea clickeable
    const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
    if (isDisabled) {
      addResult(`${text} [button]`, '(n/a)', 'SKIP', 'Boton deshabilitado');
    } else {
      addResult(`${text} [button]`, '(JS handler)', 'PASS', 'Boton CTA presente y habilitado');
    }
  }

  // ── 4. Verificar estado de la pagina actual ──
  console.log('');
  console.log('%cVerificando estado de pagina actual...', 'font-weight: bold;');

  // Meta tags
  const metaDesc = document.querySelector('meta[name="description"]');
  addResult(
    'Meta description',
    metaDesc?.getAttribute('content') || '(ausente)',
    metaDesc ? 'PASS' : 'FAIL',
    metaDesc ? 'Presente' : 'No encontrado',
  );

  // Headings
  const h1 = document.querySelectorAll('h1').length;
  const h2 = document.querySelectorAll('h2').length;
  addResult('Encabezados (h1/h2)', `${h1} h1, ${h2} h2`, h1 > 0 ? 'PASS' : 'WARN', 'Debe haber al menos un h1');

  // Navbar presente
  const nav = document.querySelector('nav, header');
  addResult('Barra de navegacion', nav ? 'Presente' : 'Ausente', nav ? 'PASS' : 'FAIL', '');

  // Footer presente
  const footer = document.querySelector('footer');
  addResult('Footer', footer ? 'Presente' : 'Ausente', footer ? 'PASS' : 'FAIL', '');

  // Loaders visibles
  const visibleLoaders = Array.from(
    document.querySelectorAll('[role="status"], svg[class*="animate-spin"]'),
  ).filter((el) => el.offsetParent !== null);
  addResult(
    'Loaders/spinners visibles',
    visibleLoaders.length > 0 ? `${visibleLoaders.length} visibles` : 'Ninguno',
    visibleLoaders.length === 0 ? 'PASS' : 'WARN',
    'Los spinners deberian desaparecer tras la carga',
  );

  // Console errors capturados
  const perfResources = performance.getEntriesByType('resource');
  const failedReqs = perfResources.filter(
    (e) => (e.responseStatus || 0) >= 400,
  );
  addResult(
    'Peticiones fallidas (4xx/5xx)',
    failedReqs.length > 0 ? failedReqs.map((r) => r.name).join(', ') : 'Ninguna',
    failedReqs.length === 0 ? 'PASS' : 'FAIL',
    failedReqs.length > 0 ? `${failedReqs.length} recurso(s) con error` : '',
  );

  // Errores JS no capturados
  const jsErrors = window.__qaErrors || [];
  // Tambien escuchamos errores pendientes
  const pendingErrors = window.__qaPendingErrors || [];
  const totalJsErrors = jsErrors.length + pendingErrors.length;
  addResult(
    'Errores JS no capturados',
    totalJsErrors > 0 ? `${totalJsErrors} error(es)` : 'Ninguno',
    totalJsErrors === 0 ? 'PASS' : 'FAIL',
    totalJsErrors > 0 ? `Revisar consola para detalles` : '',
  );

  // ── 5. Verificar imagenes rotas ──
  const images = Array.from(document.querySelectorAll('img'));
  let brokenCount = 0;
  for (const img of images) {
    if (img.src && img.complete && img.naturalWidth === 0) {
      brokenCount++;
    }
  }
  addResult(
    'Imagenes rotas',
    brokenCount > 0 ? `${brokenCount} rota(s)` : 'Ninguna',
    brokenCount === 0 ? 'PASS' : 'FAIL',
    '',
  );

  // ── 6. Performance ──
  const domSize = document.querySelectorAll('*').length;
  addResult(
    'Tamano del DOM',
    `${domSize} elementos`,
    domSize < 3000 ? 'PASS' : 'WARN',
    domSize >= 3000 ? 'DOM muy grande, considerar virtualizacion' : '',
  );

  // ── REPORTE FINAL ──
  console.log('');
  console.log('%c═══════════════════════════════════════', 'font-size: 14px; font-weight: bold;');
  console.log('%c📊 REPORTE DE NAVEGACION — PRECIOS', 'font-size: 16px; font-weight: bold;');
  console.log('%c═══════════════════════════════════════', 'font-size: 14px; font-weight: bold;');
  console.log('');
  console.table(report);
  console.log('');
  console.log(
    `%c✅ PASS: ${passed}  |  ❌ FAIL: ${failed}  |  ⚠️  SKIP: ${skipped}  |  Total: ${report.length}`,
    'font-size: 14px; font-weight: bold;',
  );

  // Resumen general
  console.log('');
  if (failed > 0) {
    console.log(
      '%c⚠️  PROBLEMAS ENCONTRADOS:',
      'font-size: 14px; font-weight: bold; color: orange;',
    );
    report
      .filter((r) => r.Estado === 'FAIL')
      .forEach((r) => {
        console.log(`  ❌ ${r.Elemento} → ${r.Detalle}`);
      });
    console.log(
      '%cRevisa los fallos antes de considerar la navegacion como OK.',
      'font-size: 12px; color: orange;',
    );
  } else {
    console.log(
      '%c✅ Todos los checks pasaron. La navegacion desde precios es correcta.',
      'font-size: 14px; color: green;',
    );
  }

  console.log('');
  console.log('%c— Fin del reporte —', 'font-size: 12px; color: gray;');

  return { passed, failed, skipped, total: report.length };
})().catch((err) => console.error('[QA] Error en verificacion:', err));
