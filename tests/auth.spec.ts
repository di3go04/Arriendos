import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Rentnow/);
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');
  
  // Verify login form exists
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
});

test('guest can view public properties portal', async ({ page }) => {
  await page.goto('/propiedades');
  
  // Verify properties grid exists by checking the main header
  await expect(page.getByRole('heading', { level: 1, name: /propiedades/i })).toBeVisible();
});
