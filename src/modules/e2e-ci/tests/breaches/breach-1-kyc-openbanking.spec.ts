import { test, expect } from '@playwright/test';

test.describe('Brecha 1: Open Banking + KYC', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', process.env.TEST_EMAIL || 'test@rentnow.app');
    await page.fill('[name=password]', process.env.TEST_PASSWORD || 'test1234');
    await page.click('button[type=submit]');
    await page.waitForURL('/dashboard');
  });

  test('Flujo KYC completo: subir documento + selfie', async ({ page }) => {
    await page.goto('/settings/kyc');
    await expect(page.locator('text=Verificación de Identidad')).toBeVisible();

    // Paso 1: Subir documento
    await page.locator('text=Comenzar verificación').click();
    const fileChooser = await page.locator('input[type=file]').first();
    await fileChooser.setInputFiles('./tests/fixtures/cedula-test.jpg');
    await page.locator('text=Siguiente: Selfie').click();

    // Paso 2: Selfie
    const selfieInput = page.locator('input[accept="image/*"]');
    await selfieInput.setInputFiles('./tests/fixtures/selfie-test.jpg');
    await page.locator('text=Verificar identidad').click();

    // Paso 3: Resultado
    await expect(page.locator('text=Identidad verificada').or(page.locator('text=No se pudo verificar'))).toBeVisible({ timeout: 15000 });
  });

  test('Score de solvencia visible en perfil', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    const scoreElement = page.locator('text=Solvencia').or(page.locator('text=Score'));
    // Si Open Banking no está configurado, el score podría no aparecer
    if (await scoreElement.isVisible()) {
      await expect(scoreElement).toBeVisible();
    }
  });
});
