/**
 * Cross-Site Sanity Suite — Hobbs · Phase Eight · Inside Story
 *
 * 5 checks por marca/región:
 *   1. Homepage responde con 200
 *   2. Búsqueda devuelve resultados
 *   3. PLP carga con productos
 *   4. PDP carga correctamente
 *   5. Footer visible
 *
 * Entorno:
 *   TARGET_ENV=staging     → staging SFCC (por defecto)
 *   TARGET_ENV=production  → producción real
 *
 * Ejecución:
 *   npm run test:sanity
 *   $env:TARGET_ENV="production"; npm run test:sanity   (PowerShell)
 */

import { test, expect } from '@playwright/test';
import { sanitySiteData, allRegions, targetEnv } from '@data/sanity.data';
import { HomePage } from '@pages/common/home.page';

test.beforeAll(() => {
  console.log(`[Sanity Suite] Target environment: ${targetEnv.toUpperCase()}`);
});

for (const brand of sanitySiteData) {
  for (const region of allRegions) {
    const baseUrl = (targetEnv === 'production' ? brand.prodUrl : brand.stagingUrl)
      + (region.path === '/' ? '' : region.path.replace(/\/$/, ''));

    const searchTerm = region.searchTerm ?? brand.searchTerm;

    test.describe(`[${brand.name}] [${region.name}]`, () => {

      test('homepage responds with 200', async ({ page }) => {
        const response = await page.goto(baseUrl);
        expect(response?.status(), `${brand.name} [${region.name}] homepage should return 200`).toBe(200);
      });

      test('search returns product results', async ({ page }) => {
        await page.goto(baseUrl);
        const home = new HomePage(page);
        await home.acceptCookiesIfPresent();
        const results = await home.search(searchTerm);
        expect(
          await results.getProductCount(),
          `Expected products for "${searchTerm}" on ${brand.name} [${region.name}]`
        ).toBeGreaterThan(0);
      });

      test('PLP loads with products', async ({ page }) => {
        const response = await page.goto(baseUrl + brand.categoryPath);
        expect(response?.status()).toBe(200);
        const home = new HomePage(page);
        await home.acceptCookiesIfPresent();
        const tiles = page.locator('.product-tile');
        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThan(0);
      });

      test('PDP loads correctly', async ({ page }) => {
        await page.goto(baseUrl + brand.categoryPath);
        const home = new HomePage(page);
        await home.acceptCookiesIfPresent();
        // Clic en el primer producto de la PLP
        await page.locator('.product-tile a').first().click();
        await page.waitForLoadState('domcontentloaded');
        // La PDP carga sin error de servidor y tiene header visible
        await expect(page.locator('body')).not.toContainText(/500|Internal Server Error|Service Unavailable/i);
        await expect(page.locator('header').first()).toBeVisible();
      });

      test('footer is visible', async ({ page }) => {
        await page.goto(baseUrl);
        const home = new HomePage(page);
        await home.acceptCookiesIfPresent();
        await expect(page.locator('footer').first()).toBeVisible();
      });

    });
  }
}
