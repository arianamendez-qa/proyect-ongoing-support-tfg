import { test, expect } from '@fixtures/pages.fixture';
import { hobbsData } from '@data/hobbs.data';

/**
 * E2E — Búsqueda de producto en Hobbs.
 * Flujo: home → escribir término → ver resultados.
 */
test.describe('Hobbs - Búsqueda', () => {
  test(`buscar "${hobbsData.searchTerm}" devuelve resultados`, async ({ homePage }) => {
    await homePage.open();

    const results = await homePage.search(hobbsData.searchTerm);

    // La URL refleja la búsqueda
    await expect(homePage.page).toHaveURL(/\/search\/?\?.*q=dress/i);

    // Hay productos en la grilla
    expect(await results.getProductCount()).toBeGreaterThan(0);
  });
});
