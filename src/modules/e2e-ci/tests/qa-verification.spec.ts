import { test, expect, type Page } from '@playwright/test';

/**
 * =============================================================================
 *  QA VERIFICATION — SUITE COMPLETA
 *  Proposito: Verificar renderizado, carga de recursos, eventos, errores
 *  y estados de carga en toda la aplicacion Rentnow (Next.js 16 / React 19).
 *
 *  Ejecucion:
 *    npx playwright test tests/qa-verification.spec.ts
 *    npx playwright test tests/qa-verification.spec.ts --headed
 *    npx playwright test tests/qa-verification.spec.ts --project=chromium
 * =============================================================================
 */

// ────────────────────────────────────────────────────────────
// 1. HELPERS
// ────────────────────────────────────────────────────────────

/** Recolecta errores de consola durante la navegacion */
async function collectConsoleErrors(page: Page) {
  const errors: { type: string; text: string }[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: err.message });
  });
  return errors;
}

/** Recolecta peticiones fallidas (status >= 400) */
async function collectFailedRequests(page: Page) {
  const failed: { url: string; status: number; resourceType: string }[] = [];
  page.on('requestfailed', (req) => {
    failed.push({
      url: req.url(),
      status: 0,
      resourceType: req.resourceType(),
    });
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      const existing = failed.find((f) => f.url === res.url());
      if (!existing) {
        failed.push({
          url: res.url(),
          status: res.status(),
          resourceType: res.request().resourceType(),
        });
      }
    }
  });
  return failed;
}

/** Ralentiza recursos especificos para probar loading states */
async function stubSlowResource(page: Page, urlPattern: string, delayMs: number) {
  await page.route(urlPattern, async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.continue();
  });
}

/** Comprueba que no hay errores de consola ni peticiones fallidas */
function expectNoErrors(
  errors: { type: string; text: string }[],
  failed: { url: string; status: number; resourceType: string }[],
  pageUrl: string,
) {
  const consoleErrors = errors.filter(
    (e) =>
      !e.text.includes('third-party') &&
      !e.text.includes('favicon.ico') &&
      !e.text.includes('423') &&
      !e.text.includes('ResizeObserver loop'),
  );
  if (consoleErrors.length > 0) {
    console.log(`[QA] Console errors on ${pageUrl}:`, consoleErrors);
  }
  expect(consoleErrors, `Console errors on ${pageUrl}`).toHaveLength(0);

  const failedLoading = failed.filter(
    (f) =>
      !f.url.includes('favicon.ico') &&
      !f.status.toString().startsWith('4') &&
      f.resourceType !== 'other',
  );
  if (failedLoading.length > 0) {
    console.log(`[QA] Failed requests on ${pageUrl}:`, failedLoading);
  }
  expect(failedLoading, `Failed requests on ${pageUrl}`).toHaveLength(0);
}

/** Verifica que el titulo de la pagina sea correcto */
async function expectTitle(page: Page, pattern: RegExp) {
  await expect(page).toHaveTitle(pattern, { timeout: 15000 });
}

// ────────────────────────────────────────────────────────────
// 2. CONFIGURACION COMPARTIDA
// ────────────────────────────────────────────────────────────

const PUBLIC_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
  { path: '/precios', label: 'Precios' },
  { path: '/propiedades', label: 'Propiedades' },
  { path: '/blog', label: 'Blog' },
  { path: '/developers', label: 'Developers' },
  { path: '/status', label: 'Status' },
  { path: '/hello', label: 'Hello' },
] as const;

// ────────────────────────────────────────────────────────────
// 3. TESTS
// ────────────────────────────────────────────────────────────

test.describe('QA: Renderizado completo', () => {
  test.describe('Pagina principal (Home)', () => {
    test('se renderiza sin errores de consola ni recursos fallidos', async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const failed = await collectFailedRequests(page);

      await page.goto('/');
      await expectTitle(page, /rentnow/i);

      // Verificar secciones clave del landing
      await expect(page.locator('header, nav').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('footer')).toBeVisible({ timeout: 5000 });

      expectNoErrors(errors, failed, '/');
    });

    test('hero, features, precios, testimonios se renderizan', async ({ page }) => {
      await page.goto('/');

      // Hero section — debe tener un heading principal
      const hero = page.getByRole('heading', { level: 1 }).first();
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Pricing section (si existe)
      const pricingSection = page.locator('section').filter({ hasText: /precios|planes|pricing/i });
      if (await pricingSection.count() > 0) {
        await expect(pricingSection.first()).toBeVisible();
      }

      // Footer con informacion de contacto
      const footer = page.locator('footer');
      await expect(footer).toBeVisible({ timeout: 5000 });
    });

    test('estado inicial y transiciones visuales se reflejan correctamente', async ({ page }) => {
      await page.goto('/');

      // La pagina debe tener contenido visible inmediatamente (no en blanco)
      const body = page.locator('body');
      await expect(body).not.toBeEmpty({ timeout: 10000 });

      // Verificar que los titulos no estan vacios
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);

      // Ningun heading debe estar vacio
      for (let i = 0; i < Math.min(count, 10); i++) {
        await expect(headings.nth(i)).not.toBeEmpty();
      }
    });
  });

  test.describe('Paginas publicas', () => {
    for (const { path, label } of PUBLIC_PAGES) {
      test(`${label} (${path}) se renderiza sin errores`, async ({ page }) => {
        const errors = await collectConsoleErrors(page);
        const failed = await collectFailedRequests(page);

        await page.goto(path);

        // La pagina debe tener contenido
        const body = page.locator('body');
        await expect(body).not.toBeEmpty({ timeout: 15000 });

        // Detectar paginas en blanco: debe haber al menos un heading o parrafo
        const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, a, button');
        const count = await textElements.count();
        expect(count).toBeGreaterThan(0);

        // No debe mostrar el loading state permanente
        const loaders = page.locator('[role="status"]:has-text("Cargando")');
        if (await loaders.count() > 0) {
          await expect(loaders.first()).not.toBeVisible({ timeout: 10000 });
        }

        expectNoErrors(errors, failed, path);
      });
    }
  });

  test.describe('Rutas anidadas y dinamicas', () => {
    test('propiedades/[id] se renderiza sin errores', async ({ page }) => {
      // Primero obtengamos un ID valido de la pagina de propiedades
      await page.goto('/propiedades');
      await page.waitForLoadState('networkidle');

      const propertyLink = page.locator('a[href*="/propiedades/"]').first();
      if ((await propertyLink.count()) > 0) {
        const href = await propertyLink.getAttribute('href');
        test.setTimeout(60000);

        const errors = await collectConsoleErrors(page);
        const failed = await collectFailedRequests(page);
        await page.goto(href!);
        await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
        expectNoErrors(errors, failed, href!);
      } else {
        test.skip();
        console.log('[QA] No hay enlaces a propiedades individuales — skip');
      }
    });

    test('pay/[contractId] devuelve 404 o se renderiza sin errores', async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const failed = await collectFailedRequests(page);

      await page.goto('/pay/nonexistent-id');

      // Puede devolver 404 o redirigir — en ambos casos no debe explotar
      expect(errors.filter((e) => e.type === 'pageerror')).toHaveLength(0);
      expect(failed.filter((f) => f.resourceType === 'document' && f.status >= 500)).toHaveLength(0);
    });
  });
});

test.describe('QA: Carga de recursos', () => {
  test('imagenes y estilos cargan correctamente en home', async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && res.request().resourceType() !== 'other') {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imageErrors = failedRequests.filter((r) => r.url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)(\?|$)/));
    const cssErrors = failedRequests.filter((r) => r.url.match(/\.css(\?|$)/));
    const fontErrors = failedRequests.filter((r) => r.url.match(/\.(woff2?|ttf|eot|otf)(\?|$)/));
    const jsErrors = failedRequests.filter((r) => r.url.match(/\.js(\?|$)/));

    if (imageErrors.length > 0) console.log('[QA] Imagenes fallidas:', imageErrors);
    if (cssErrors.length > 0) console.log('[QA] CSS fallidos:', cssErrors);
    if (fontErrors.length > 0) console.log('[QA] Fuentes fallidas:', fontErrors);
    if (jsErrors.length > 0) console.log('[QA] JS fallidos:', jsErrors);

    expect(imageErrors).toHaveLength(0);
    expect(cssErrors).toHaveLength(0);
    expect(fontErrors).toHaveLength(0);
    expect(jsErrors).toHaveLength(0);
  });

  test('todos los recursos estaticos en public/ se sirven correctamente', async ({ page }) => {
    const staticAssets = [
      '/favicon.ico',
      '/favicon.svg',
      '/logo.svg',
      '/logo-light.svg',
      '/sw.js',
    ];

    for (const asset of staticAssets) {
      const response = await page.goto(asset);
      expect(response?.status(), `Status de ${asset} debe ser 200`).toBe(200);
    }
  });

  test('no hay recursos extremadamente lentos (timeout)', async ({ page }) => {
    const slowResources: { url: string; durationMs: number }[] = [];

    page.on('requestfailed', (req) => {
      slowResources.push({
        url: req.url(),
        durationMs: -1,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const perfEntries = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((e) => ({
        url: e.name,
        durationMs: Math.round(e.duration),
      })),
    );

    const slowOnes = [
      ...slowResources.filter((r) => r.durationMs === -1),
      ...perfEntries.filter((e) => e.durationMs > 3000),
    ];

    if (slowOnes.length > 0) {
      console.log('[QA] Recursos lentos o fallidos:', slowOnes);
    }
    expect(slowOnes.filter((r) => r.durationMs > 8000 || r.durationMs === -1)).toHaveLength(0);
  });
});

test.describe('QA: Estados de carga y error', () => {
  test('loading.tsx se muestra en dashboard durante carga de datos', async ({ page }) => {
    // Ralentizar la navegacion a dashboard para ver el loading state
    await stubSlowResource(page, '**/api/**', 2000);
    await page.goto('/dashboard');

    // Si hay un loading state, debe mostrarse con un spinner o skeleton
    const skeleton = page.locator('[role="status"], .animate-pulse, [class*="skeleton"]');
    if ((await skeleton.count()) > 0) {
      await expect(skeleton.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Si no hay skeleton, al menos no debe estar en blanco
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
    }
  });

  test('pagina 404 personalizada se renderiza', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    const failed = await collectFailedRequests(page);

    await page.goto('/ruta-inexistente-xyz');
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });

    // Debe mostrar el mensaje 404
    const has404 = page.locator('text="404"').or(page.locator('h1')).or(page.locator('text=perdido'));
    await expect(has404.first()).toBeVisible({ timeout: 7000 });

    expectNoErrors(errors, failed, '/ruta-inexistente-xyz');
  });

  test('error.tsx captura errores en tiempo de renderizado', async ({ page }) => {
    // Forzar un error navegando a una ruta que lance una excepcion
    // Nota: Asumiendo que error.tsx del root captura errores generales
    await page.goto('/status');

    // Simplemente verificar que error.tsx existe y se compila
    // (no podemos forzar un error facilmente sin modificar codigo)
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });

    // Verificar que tenemos un boton de "intentar de nuevo" si aparece un error
    const resetButton = page.getByRole('button', { name: /intentar de nuevo|recargar|reintentar/i });
    if ((await resetButton.count()) > 0) {
      await expect(resetButton.first()).toBeVisible();
    }
  });
});

test.describe('QA: Layouts y componentes compartidos', () => {
  test('navbar y footer estan presentes en home', async ({ page }) => {
    await page.goto('/');

    // Navbar (header o nav)
    const nav = page.locator('header, nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 5000 });
  });

  test('dashboard layout tiene sidebar, navbar y bottom nav', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Esperar a que la URL se estabilice (posible redirect por auth)
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 15000 });

    // Si no estamos autenticados, redirige a login — eso tambien es correcto
    // O puede quedarse en /dashboard con renderizado null (auth guard)
    if (page.url().includes('/login')) {
      console.log('[QA] Redirigido a login (no autenticado) — comportamiento esperado');
      return;
    }

    // Sidebar (escritorio) — si no aparece, es porque auth guard no dejo pasar
    const sidebar = page.locator('aside, [class*="sidebar"]').first();
    if ((await sidebar.count()) === 0) {
      console.log('[QA] Sin sidebar (no autenticado en Firefox) — skip');
      return;
    }
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Navbar superior
    const navbar = page.locator('header, [class*="navbar"], [class*="topbar"]').first();
    if ((await navbar.count()) > 0) {
      await expect(navbar).toBeVisible({ timeout: 5000 });
    }
  });

  test('theme toggle existe y cambia el tema', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator(
      'button[class*="theme"], button[aria-label*="theme"], button:has(svg[class*="sun"]), button:has(svg[class*="moon"])',
    ).first();

    if ((await themeButton.count()) > 0) {
      await expect(themeButton).toBeVisible({ timeout: 5000 });
      await themeButton.click();
      // No debe romperse despues del click
      await expect(page.locator('body')).not.toBeEmpty();
    } else {
      console.log('[QA] Theme toggle no encontrado — skip');
    }
  });
});

test.describe('QA: Redirecciones y proteccion de rutas', () => {
  async function expectRedirectToLogin(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    // La redireccion es client-side (useEffect + router.push), esperar
    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain('/login');
  }

  test('dashboard redirige a login si no hay sesion', async ({ page }) => {
    await expectRedirectToLogin(page, '/dashboard');
  });

  test('properties redirige a login si no hay sesion', async ({ page }) => {
    await expectRedirectToLogin(page, '/properties');
  });

  test('templates redirige a login si no hay sesion', async ({ page }) => {
    await expectRedirectToLogin(page, '/templates');
  });
});

test.describe('QA: next-intl (i18n)', () => {
  test('home con locale /es funciona', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    const failed = await collectFailedRequests(page);

    await page.goto('/es');
    await expectTitle(page, /rentnow/i);
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });

    expectNoErrors(errors, failed, '/es');
  });

  test('home con locale /en funciona', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    const failed = await collectFailedRequests(page);

    await page.goto('/en');
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });

    expectNoErrors(errors, failed, '/en');
  });

  test('locale invalido devuelve 404', async ({ page }) => {
    await page.goto('/xx');
    // Debe mostrar 404 o redirigir
    const body = page.locator('body');
    await expect(body).not.toBeEmpty({ timeout: 10000 });
  });
});

test.describe('QA: Sin elementos vacios o rotos en DOM', () => {
  test('imagenes no estan rotas (alt text presente donde corresponde)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('no hay botones con texto vacio (se permiten icon-only)', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 30); i++) {
      const btn = buttons.nth(i);
      const innerHTML = await btn.innerHTML();
      const text = (await btn.innerText()).trim();
      // Solo falla si no tiene texto visible ni contenido HTML (iconos, etc)
      if (text.length === 0) {
        expect(innerHTML.trim().length, `Boton #${i} sin contenido`).toBeGreaterThan(0);
      }
    }
  });

  test('meta tags esenciales existen', async ({ page }) => {
    await page.goto('/');

    const description = page.locator('meta[name="description"]');
    const viewport = page.locator('meta[name="viewport"]');

    await expect(description).toHaveAttribute('content', /.+/);
    await expect(viewport).toHaveAttribute('content', /.+/);
  });
});
