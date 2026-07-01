import { test as base } from '@playwright/test';
import { HomePage } from '@pages/common/home.page';
import { SearchResultsPage } from '@pages/common/search-results.page';

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
};

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
});

export { expect } from '@playwright/test';
