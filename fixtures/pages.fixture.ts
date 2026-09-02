import { test as base } from '@playwright/test';
import { HomePage } from '@pages/common/home.page';
import { SearchResultsPage } from '@pages/common/search-results.page';
import { ProductListPage } from '@pages/common/product-list.page';
import { ProductDetailPage } from '@pages/common/product-detail.page';
import { BasketPage } from '@pages/common/basket.page';
import { CheckoutPage } from '@pages/common/checkout.page';

/**
 * Fixtures personalizados.
 *
 * En vez de hacer `new HomePage(page)` en cada test, importas `test` desde
 * aquí y recibes los Page Objects ya construidos:
 *
 *   import { test, expect } from '@fixtures/pages.fixture';
 *   test('...', async ({ homePage }) => { ... });
 *
 * A medida que crees más páginas, las añades a este objeto.
 */
type Pages = {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  productListPage: ProductListPage;
  productDetailPage: ProductDetailPage;
  basketPage: BasketPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  basketPage: async ({ page }, use) => {
    await use(new BasketPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
