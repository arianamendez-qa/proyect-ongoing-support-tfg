/**
 * Cross-Site E2E Suite — Hobbs · Phase Eight · Inside Story
 *
 * Flujo completo por marca:
 *   Home → búsqueda → PLP → PDP → añadir al carrito → checkout
 *
 * Entorno:
 *   TARGET_ENV=staging     → sandbox SFCC + pago con tarjeta Adyen de test
 *   TARGET_ENV=production  → producción real, para antes de confirmar el pago
 *
 * Ejecución:
 *   npm run test:sanity                          (staging)
 *   TARGET_ENV=production npm run test:sanity    (producción)
 */

import { test, expect } from '@playwright/test';
import { sanitySiteData, targetEnv } from '@data/sanity.data';
import { guestEmail, shippingAddress, adyenTestCard } from '@data/checkout.data';
import { HomePage } from '@pages/common/home.page';
import { SearchResultsPage } from '@pages/common/search-results.page';
import { ProductDetailPage } from '@pages/common/product-detail.page';
import { BasketPage } from '@pages/common/basket.page';
import { CheckoutPage } from '@pages/common/checkout.page';

const isProduction = targetEnv === 'production';

test.beforeAll(() => {
  console.log(`[E2E Suite] Target environment: ${targetEnv.toUpperCase()}`);
});

for (const brand of sanitySiteData) {
  test.describe(`[${brand.name}] E2E — Checkout flow`, () => {

    test('search → PDP → add to cart → basket has item', async ({ page }) => {
      // 1. Home
      await page.goto(brand.baseUrl);
      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      // 2. Búsqueda → PLP
      const results: SearchResultsPage = await home.search(brand.searchTerm);
      expect(await results.getProductCount()).toBeGreaterThan(0);

      // 3. Click en el primer producto → PDP
      await results.productTiles.first().locator('a').first().click();
      await page.waitForLoadState('domcontentloaded');

      // 4. Seleccionar talla y añadir al carrito
      const pdp = new ProductDetailPage(page);
      await pdp.acceptCookiesIfPresent();
      await pdp.selectFirstAvailableSize();
      const basket: BasketPage = await pdp.addToCartAndGoToBasket();

      // 5. Verificar que la cesta tiene el artículo
      expect(await basket.hasItems()).toBe(true);
    });

    test('checkout — guest details and shipping', async ({ page }) => {
      // 1. Home → búsqueda → PDP → carrito (flujo completo)
      await page.goto(brand.baseUrl);
      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      const results: SearchResultsPage = await home.search(brand.searchTerm);
      await results.productTiles.first().locator('a').first().click();
      await page.waitForLoadState('domcontentloaded');

      const pdp = new ProductDetailPage(page);
      await pdp.acceptCookiesIfPresent();
      await pdp.selectFirstAvailableSize();
      const basket: BasketPage = await pdp.addToCartAndGoToBasket();

      // 2. Ir al checkout
      const checkout: CheckoutPage = await basket.proceedToCheckout();
      await page.waitForLoadState('domcontentloaded');

      // 3. Continuar como guest
      await checkout.continueAsGuest(guestEmail);

      // 4. Rellenar dirección de envío
      await checkout.fillShippingAddress(shippingAddress);

      // 5. Confirmar método de envío (seleccionado por defecto)
      await checkout.submitShippingMethod();
    });

    test('checkout — payment step is reached', async ({ page }) => {
      // Flujo completo hasta el paso de pago
      await page.goto(brand.baseUrl);
      const home = new HomePage(page);
      await home.acceptCookiesIfPresent();

      const results: SearchResultsPage = await home.search(brand.searchTerm);
      await results.productTiles.first().locator('a').first().click();
      await page.waitForLoadState('domcontentloaded');

      const pdp = new ProductDetailPage(page);
      await pdp.acceptCookiesIfPresent();
      await pdp.selectFirstAvailableSize();
      const basket: BasketPage = await pdp.addToCartAndGoToBasket();

      const checkout: CheckoutPage = await basket.proceedToCheckout();
      await page.waitForLoadState('domcontentloaded');

      await checkout.continueAsGuest(guestEmail);
      await checkout.fillShippingAddress(shippingAddress);
      await checkout.submitShippingMethod();

      if (isProduction) {
        // En producción: verificamos que el paso de pago es visible y paramos
        const placeOrderVisible = await checkout.isPlaceOrderVisible();
        expect(
          placeOrderVisible,
          `[${brand.name}] El paso de pago debería ser accesible en producción`
        ).toBe(true);
        console.log(`[${brand.name}] PROD — Checkout alcanzado. Parado antes del pago.`);
      } else {
        // En staging: rellenamos la tarjeta de test Adyen y completamos el pedido
        await checkout.fillAdyenCard(adyenTestCard);
        await checkout.placeOrder();

        // Verificamos que llegamos a la página de confirmación
        await expect(page).toHaveURL(/order-confirmation|checkout\/receipt|thank-you/i, { timeout: 30000 });
        console.log(`[${brand.name}] STAGING — Pedido completado correctamente.`);
      }
    });

  });
}
