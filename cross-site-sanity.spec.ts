/**
 * Cross-Site Sanity Suite — Hobbs · Phase Eight · Inside Story
 *
 * Objetivo: confirmar que los sitios permanecen activos y accesibles
 * tras un release a producción. No es regresión funcional exhaustiva.
 *
 * Entorno:
 *   TARGET_ENV=staging      → sandbox SFCC (por defecto)
 *   TARGET_ENV=production   → producción real
 *
 * Ejecución:
 *   npm run test:sanity
 *   TARGET_ENV=production npm run test:sanity
 */

import { test, expect } from '@playwright/test';
import { sanitySiteData, targetEnv } from '@data/sanity.data';
import { HomePage } from '@pages/common/home.page';
import { SearchResultsPage } from '@pages/common/search-results.page';

test.beforeAll(() => {
  // Registra en el log qué entorno se está validando
  console.log(`[Sanity Suite] Target environment: ${targetEnv.toUpperCase()}`);
});

for (const brand of sanitySiteData) {
  test.describe(`[${brand.name}] Cross-Site Sanity`, () => {

    test('homepage is accessible and displays the correct brand title', async ({ page }) => {
      await page.goto(brand.baseUrl);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      await expect(page).toHaveTitle(brand.expectedTitlePattern);
    });

    test('site header and main navigation are visible', async ({ page }) => {
      await page.goto(brand.baseUrl);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('nav').first()).toBeVisible();
    });

    test('search returns product results for a known term', async ({ page }) => {
      await page.goto(brand.baseUrl);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      const results: SearchResultsPage = await home.search(brand.searchTerm);
      const productCount = await results.getProductCount();

      expect(productCount, `Expected products for "${brand.searchTerm}" on ${brand.name}`).toBeGreaterThan(0);
    });

    test('category (PLP) page loads and displays products', async ({ page }) => {
      await page.goto(brand.baseUrl + brand.categoryPath);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      const productTiles = page.locator('.product-tile');
      await expect(productTiles.first()).toBeVisible();

      const count = await productTiles.count();
      expect(count, `Expected products on ${brand.name} PLP (${brand.categoryPath})`).toBeGreaterThan(0);
    });

    test('page footer is visible', async ({ page }) => {
      await page.goto(brand.baseUrl);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      await expect(page.locator('footer').first()).toBeVisible();
    });

    test('cart page is accessible', async ({ page }) => {
      await page.goto(`${brand.baseUrl}/cart`);

      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      // Cart page loads without a server error — either an empty basket or items
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error|Service Unavailable/i);
      await expect(page.locator('header').first()).toBeVisible();
    });

  });
}
