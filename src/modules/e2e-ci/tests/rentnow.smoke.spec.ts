import { test, expect } from '@playwright/test';

/** Módulo 5 — Suite E2E (smoke) para CI */
test.describe('RentNow smoke @module-e2e-ci', () => {
  test('home carga', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rentnow/i);
  });

  test('login muestra formulario', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });

  test('portal público propiedades', async ({ page }) => {
    await page.goto('/propiedades');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('developers documentación', async ({ page }) => {
    await page.goto('/developers');
    await expect(page.getByText(/API/i).first()).toBeVisible();
  });
});
