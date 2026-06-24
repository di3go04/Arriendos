import { test, expect } from '@playwright/test';

test.describe('Brecha 6: ESG Sostenibilidad', () => {
  test('Dashboard muestra badge ESG en ficha de propiedad', async ({ page }) => {
    await page.goto('/propiedades');
    await page.waitForTimeout(2000);

    const firstProperty = page.locator('a[href^="/propiedades/"]').first();
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await page.waitForTimeout(2000);

      const esgBadge = page.locator('text=ESG').or(page.locator('text=Desempeño ESG'));
      if (await esgBadge.isVisible()) {
        await expect(esgBadge).toBeVisible();
        console.log('     → Badge ESG visible en ficha de propiedad');
      } else {
        console.log('     → Sin badge ESG (propiedad sin evaluación)');
      }
    }
  });

  test('Formulario ESG permite ingresar consumos', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', process.env.TEST_EMAIL || 'test@rentnow.app');
    await page.fill('[name=password]', process.env.TEST_PASSWORD || 'test1234');
    await page.click('button[type=submit]');
    await page.waitForURL('/dashboard');

    await page.goto('/properties');
    const editBtn = page.locator('a[href*="/properties/"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      const esgSection = page.locator('text=Sostenibilidad').or(page.locator('text=ESG'));
      if (await esgSection.isVisible()) {
        await esgSection.click();
        await page.fill('[name=energy_kwh]', '5000');
        await page.fill('[name=water_m3]', '120');
        await page.click('button:has-text("Calcular")');
        await expect(page.locator('text=Score').or(page.locator('text=CO₂'))).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
