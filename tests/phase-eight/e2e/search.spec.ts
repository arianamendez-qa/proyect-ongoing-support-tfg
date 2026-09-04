import { test, expect } from '@fixtures/pages.fixture';
import { phaseEightData } from '@data/phase-eight.data';

/**
 * E2E — Búsqueda de producto en Phase Eight.
 * Reutiliza exactamente los mismos Page Objects que Hobbs (POM compartido).
 */
test.describe('Phase Eight - Búsqueda', () => {
  test(`buscar "${phaseEightData.searchTerm}" devuelve resultados`, async ({ homePage }) => {
    await homePage.open();

    const results = await homePage.search(phaseEightData.searchTerm);

    await expect(homePage.page).toHaveURL(/\/search\/?\?.*q=dress/i);

    expect(await results.getProductCount()).toBeGreaterThan(0);
  });
});
