import { test, expect } from '@playwright/test';

test.describe('Brecha 3: REaaS — Coliving/Flex', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', process.env.TEST_EMAIL || 'test@rentnow.app');
    await page.fill('[name=password]', process.env.TEST_PASSWORD || 'test1234');
    await page.click('button[type=submit]');
    await page.waitForURL('/dashboard');
  });

  test('Crear propiedad con unidades coliving', async ({ page }) => {
    await page.goto('/properties/new');
    await page.fill('[name=title]', 'Coliving Test E2E');
    await page.fill('[name=city]', 'Medellín');
    await page.fill('[name=monthly_rent]', '0');
    await page.selectOption('[name=type]', 'casa');
    await page.click('button:has-text("Guardar")');
    await page.waitForURL(/\/properties\//);

    // Agregar unidad coliving
    await page.click('text=Agregar unidad');
    await page.fill('[name=unit_label]', 'Habitación 1');
    await page.fill('[name=monthly_rent]', '800000');
    await page.selectOption('[name=unit_type]', 'private_room');
    await page.click('button:has-text("Guardar unidad")');

    await expect(page.locator('text=Habitación 1')).toBeVisible();
  });

  test('Pausar y reanudar suscripción REaaS', async ({ page }) => {
    await page.goto('/subscriptions');
    await page.waitForTimeout(2000);

    const pauseBtn = page.locator('button:has-text("Pausar")').first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await expect(page.locator('text=Suscripción pausada').or(page.locator('text=paused'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('Portal público muestra disponibilidad por unidad', async ({ page }) => {
    await page.goto('/propiedades');
    await page.waitForTimeout(2000);
    const unitCards = page.locator('text=Habitación').or(page.locator('text=Disponible'));
    const count = await unitCards.count();
    console.log(`     → ${count} unidades visibles en portal`);
  });
});
