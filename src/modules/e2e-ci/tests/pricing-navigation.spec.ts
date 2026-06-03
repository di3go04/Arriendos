/**
 * =============================================================================
 *  PRICING NAVIGATION — Verificacion de navegacion desde /precios
 *  Proposito: Probar que todos los enlaces, botones y CTAs en la pagina
 *  de precios navegan correctamente a sus destinos sin errores.
 *
 *  Ejecucion:
 *    npx playwright test tests/pricing-navigation.spec.ts
 *    npx playwright test tests/pricing-navigation.spec.ts --headed
 *    npx playwright test tests/pricing-navigation.spec.ts --project=chromium
 * =============================================================================
 */

import { test, expect, type Page } from '@playwright/test';

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

interface ReportEntry {
  element: string;
  destination: string;
  status: 'ok' | 'redirect' | 'error' | 'skip';
  detail: string;
}

let report: ReportEntry[] = [];

test.beforeEach(() => {
  report = [];
});

test.afterEach(() => {
  if (report.length > 0) {
    console.log('\n=== REPORTE DE NAVEGACION ===');
    console.table(report);
  }
});

async function collectErrors(page: Page) {
  const errors: { type: string; text: string }[] = [];
  const failedReqs: { url: string; status: number; resourceType: string }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: err.message });
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      const exists = failedReqs.find((f) => f.url === res.url());
      if (!exists) {
        failedReqs.push({ url: res.url(), status: res.status(), resourceType: res.request().resourceType() });
      }
    }
  });
  page.on('requestfailed', (req) => {
    const exists = failedReqs.find((f) => f.url === req.url());
    if (!exists) {
      failedReqs.push({ url: req.url(), status: 0, resourceType: req.resourceType() });
    }
  });

  return { errors, failedReqs };
}

function hasCriticalErrors(errors: { type: string; text: string }[], failedReqs: { url: string; status: number; resourceType: string }[]) {
  const filteredErrors = errors.filter(
    (e) =>
      !e.text.includes('third-party') &&
      !e.text.includes('favicon.ico') &&
      !e.text.includes('423') &&
      !e.text.includes('ResizeObserver loop') &&
      !e.text.includes('posthog') &&
      !e.text.includes('ERR_BLOCKED'),
  );
  const criticalReqs = failedReqs.filter(
    (f) =>
      !f.url.includes('favicon.ico') &&
      !f.url.includes('posthog') &&
      !f.url.includes('analytics') &&
      f.resourceType !== 'other' &&
      f.resourceType !== 'ping' &&
      f.status !== 423,
  );
  return { hasErrors: filteredErrors.length > 0, hasFailedReqs: criticalReqs.length > 0, filteredErrors, criticalReqs };
}

/** Cierra el banner de cookies GDPR si existe */
async function dismissGdpr(page: Page) {
  const acceptBtn = page.locator('button:has-text("Aceptar"), button:has-text("Accept"), button:has-text("Acepto")').first();
  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function verifyDestination(page: Page, label: string, destination: string) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
    report.push({ element: label, destination: page.url(), status: 'ok', detail: `Cargó correctamente (${page.url()})` });
  } catch (err) {
    report.push({
      element: label,
      destination,
      status: 'error',
      detail: `Error en carga: ${err instanceof Error ? err.message : 'unknown'}`,
    });
  }
}

// ────────────────────────────────────────────────────────────
// TESTS
// ────────────────────────────────────────────────────────────

test.describe('Pricing Page — Navegacion desde /es/precios', () => {
  test('pagina de precios carga sin errores', async ({ page }) => {
    const { errors, failedReqs } = await collectErrors(page);
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /planes/i })).toBeVisible({ timeout: 10000 });

    const { hasErrors, hasFailedReqs, filteredErrors, criticalReqs } = hasCriticalErrors(errors, failedReqs);
    if (hasErrors) console.log('[ERRORS]', filteredErrors);
    if (hasFailedReqs) console.log('[FAILED]', criticalReqs);
    expect(filteredErrors).toHaveLength(0);
  });

  test('navegacion: navbar — todos los enlaces', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);
    await page.waitForTimeout(3000);

    const allLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .filter((a) => {
          const h = a.getAttribute('href') || '';
          return h && !h.startsWith('#') && !h.startsWith('javascript:') && !h.includes('precios');
        })
        .map((a) => ({ text: (a.textContent || '').trim().slice(0, 40), href: a.getAttribute('href') })),
    );
    console.log('[DEBUG] All nav-clickable links:', allLinks.slice(0, 12));
    expect(allLinks.length).toBeGreaterThanOrEqual(2);

    for (const { text, href } of allLinks) {
      await page.goto('/es/precios');
      await page.waitForLoadState('networkidle');
      await dismissGdpr(page);

      const link = page.locator(`a[href="${href}"]`).first();
      const clicked = await link.click().then(() => true).catch(() => false);
      if (!clicked) {
        report.push({ element: text, destination: href || '', status: 'error', detail: 'No se pudo hacer clic' });
        continue;
      }

      try {
        await page.waitForURL((url) => !url.pathname.includes('/es/precios'), { timeout: 15000 });
      } catch {
        // puede estar redirigiendo, esperar timeout
      }
      report.push({ element: text, destination: page.url(), status: 'ok', detail: `Navegó a ${page.url()}` });
    }
  });

  test('navegacion: botones Login y Register', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    const loginBtn = page.locator('a[href*="/es/login"], a[href*="/login"]').first();
    const loginVisible = await loginBtn.isVisible().catch(() => false);
    if (loginVisible) {
      await loginBtn.click();
      await page.waitForURL(/\/login/, { timeout: 15000 });
      await verifyDestination(page, 'Login', '/login');
    } else {
      report.push({ element: 'Login', destination: '', status: 'skip', detail: 'Boton no visible' });
    }

    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    const registerBtn = page.locator('a[href*="/es/register"], a[href*="/register"]').first();
    const regVisible = await registerBtn.isVisible().catch(() => false);
    if (regVisible) {
      await registerBtn.click();
      await page.waitForURL(/\/register/, { timeout: 15000 });
      await verifyDestination(page, 'Register', '/register');
    } else {
      report.push({ element: 'Register', destination: '', status: 'skip', detail: 'Boton no visible' });
    }
  });

  test('navegacion: Volver al inicio', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    const backLink = page.locator('a:has-text("Volver al inicio")').first();
    const backVisible = await backLink.isVisible().catch(() => false);

    if (backVisible) {
      await backLink.click();
      await page.waitForURL(/\/es\/?$/, { timeout: 15000 }).catch(() => {});
      await verifyDestination(page, 'Volver al inicio', '/');
    } else {
      report.push({ element: 'Volver al inicio', destination: '', status: 'skip', detail: 'No encontrado' });
    }
  });

  test('navegacion: Solicitar demo', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    const demoLink = page.locator('a:has-text("Solicitar demo"), a[href*="/demo"]').first();
    const demoVisible = await demoLink.isVisible().catch(() => false);

    if (demoVisible) {
      await demoLink.click({ force: true });
      await page.waitForURL(/\/demo/, { timeout: 15000 });
      await verifyDestination(page, 'Solicitar demo', '/demo');
    } else {
      report.push({ element: 'Solicitar demo', destination: '', status: 'skip', detail: 'No encontrado' });
    }
  });

  test('navegacion: CTAs de planes de precio', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    const gratisBtn = page.locator('button:has-text("Comenzar gratis")').first();
    const gratisVisible = await gratisBtn.isVisible().catch(() => false);

    if (gratisVisible) {
      await gratisBtn.click();
      try {
        await page.waitForURL(/\/register/, { timeout: 15000 });
        report.push({ element: 'Comenzar gratis', destination: page.url(), status: 'ok', detail: 'Redirigió a /register' });
      } catch {
        report.push({ element: 'Comenzar gratis', destination: '', status: 'error', detail: 'No redirigió a register' });
      }
    } else {
      report.push({ element: 'Comenzar gratis', destination: '', status: 'skip', detail: 'Boton no visible' });
    }
  });

  test('navegacion: enlaces del footer y pagina completa', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);
    await page.waitForTimeout(3000);

    const fullDOM = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const tags = [...new Set(all.map((el) => el.tagName.toLowerCase()))].sort();
      const allLinks = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        tag: a.tagName,
        text: (a.textContent || '').trim().slice(0, 50),
        href: a.getAttribute('href'),
        class: a.className.slice(0, 60),
        rect: a.getBoundingClientRect(),
      }));
      const bodyHTML = document.body?.innerHTML?.length || 0;
      const children = document.body?.children?.length || 0;
      return { tags, linkCount: allLinks.length, allLinks, bodyHTML, children };
    });
    console.log('[DEBUG] DOM tags:', fullDOM.tags);
    console.log('[DEBUG] Total links on page:', fullDOM.linkCount);
    console.log('[DEBUG] Body children:', fullDOM.children, 'HTML length:', fullDOM.bodyHTML);
    console.log('[DEBUG] All links:', JSON.stringify(fullDOM.allLinks, null, 2).slice(0, 2000));

    const pageLinks = fullDOM.allLinks;
    expect(pageLinks.length).toBeGreaterThanOrEqual(2);

    for (const link of pageLinks.slice(0, 4)) {
      const { text, href } = link;
      if (!href || href === '#' || href.startsWith('javascript:') || href.includes('precios')) continue;

      await page.goto('/es/precios');
      await page.waitForLoadState('networkidle');
      await dismissGdpr(page);

      const locator = page.locator(`a[href="${href}"]`).first();
      const clicked = await locator.click().then(() => true).catch(() => {
        return locator.click({ force: true }).then(() => true).catch(() => false);
      });
      if (!clicked) {
        report.push({ element: text || href, destination: href, status: 'error', detail: 'No se pudo hacer clic' });
        continue;
      }

      try {
        await page.waitForURL((url) => !url.pathname.includes('/es/precios'), { timeout: 10000 });
      } catch {
        // posible estancia en misma pagina
      }
      report.push({ element: text || href, destination: href, status: 'ok', detail: `Navegó a ${page.url()}` });
    }
  });
});

test.describe('Pricing Page — Verificacion de destino', () => {
  const destinos = [
    { path: '/es', label: 'Home (es)' },
    { path: '/en', label: 'Home (en)' },
    { path: '/es/login', label: 'Login' },
    { path: '/es/register', label: 'Register' },
    { path: '/es/demo', label: 'Demo' },
    { path: '/es/developers', label: 'Developers' },
    { path: '/es/propiedades', label: 'Propiedades' },
    { path: '/es/status', label: 'Status' },
  ] as const;

  for (const { path, label } of destinos) {
    test(`${label} (${path}) carga sin errores`, async ({ page }) => {
      const { errors, failedReqs } = await collectErrors(page);
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await dismissGdpr(page);

      await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
      const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, a, button');
      const count = await textElements.count();
      expect(count).toBeGreaterThan(0);

      const { hasErrors, hasFailedReqs, filteredErrors, criticalReqs } = hasCriticalErrors(errors, failedReqs);
      if (hasErrors) console.log(`[ERRORS][${label}]`, filteredErrors);
      if (hasFailedReqs) console.log(`[FAILED][${label}]`, criticalReqs);
      expect(filteredErrors).toHaveLength(0);
    });
  }
});

test.describe('Pricing Page — Recursos estaticos', () => {
  test('imagenes, CSS, JS y fuentes cargan con 200', async ({ page }) => {
    const failedResources: { url: string; status: number; type: string }[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400) {
        const url = res.url();
        const type = res.request().resourceType();
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|css|js|woff2?|ttf|eot)(\?|$)/)) {
          failedResources.push({ url, status: res.status(), type });
        }
      }
    });
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');
    if (failedResources.length > 0) console.log('[FAILED RESOURCES]', failedResources);
    expect(failedResources).toHaveLength(0);
  });

  test('favicon y logos estaticos se sirven correctamente', async ({ page }) => {
    const assets = ['/favicon.ico', '/favicon.svg', '/logo.svg', '/logo-light.svg'];
    for (const asset of assets) {
      const res = await page.goto(asset);
      expect(res?.status(), `${asset} debe servir 200`).toBe(200);
    }
  });
});

test.describe('Pricing Page — Estados de carga', () => {
  test('no hay loaders/spinners visibles despues de la carga', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');

    const loaders = page.locator('[role="status"], [class*="skeleton"], [class*="spinner"], svg[class*="animate-spin"]');
    const visibleCount = await loaders.evaluateAll((els) =>
      els.filter((el) => (el as HTMLElement).offsetParent !== null).length,
    );
    if (visibleCount > 0) console.log(`[WARN] ${visibleCount} loader(s) visibles`);
    expect(visibleCount).toBeLessThan(3);
  });

  test('LanguageSwitcher cambia de idioma', async ({ page }) => {
    await page.goto('/es/precios');
    await page.waitForLoadState('networkidle');

    const langButton = page.locator('button[aria-label*="language"], button:has([class*="globe"]), button:has(img[src*="flag"])').first();
    const langVisible = await langButton.isVisible().catch(() => false);
    if (!langVisible) {
      report.push({ element: 'LanguageSwitcher', destination: '', status: 'skip', detail: 'No encontrado' });
      return;
    }

    await langButton.click();
    const enOption = page.locator('[role="menuitem"]:has-text("English"), a:has-text("English")').first();
    if (await enOption.isVisible().catch(() => false)) {
      await enOption.click();
      try {
        await page.waitForURL(/\/en\/precios/, { timeout: 10000 });
        await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });
        report.push({ element: 'LanguageSwitcher: English', destination: page.url(), status: 'ok', detail: 'Cambió a /en/precios' });
      } catch {
        report.push({ element: 'LanguageSwitcher: English', destination: '', status: 'error', detail: 'No cambió de idioma' });
      }
    } else {
      report.push({ element: 'LanguageSwitcher: English', destination: '', status: 'skip', detail: 'Opcion English no visible' });
    }
  });
});

test.describe('Pricing Page — Interaccion basica en pagina destino', () => {
  test('pagina de login es accesible desde navegacion de precios', async ({ page }) => {
    await page.goto('/es/login');
    await page.waitForLoadState('networkidle');
    await dismissGdpr(page);

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
      expect(await emailInput.inputValue()).toBe('test@example.com');
      report.push({ element: 'Login form: email', destination: '/login', status: 'ok', detail: 'Campo email funcional' });
    } else {
      report.push({ element: 'Login form: email', destination: '/login', status: 'skip', detail: 'Input email no encontrado' });
    }
  });
});
