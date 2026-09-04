import { test, expect } from '@fixtures/pages.fixture';
import { hobbsData } from '@data/hobbs.data';

/**
 * Test de ejemplo (UI) para Hobbs.
 * El acceso a staging va por HTTP Basic Auth (httpCredentials en la config),
 * así que las requests ya van autenticadas sin login por formulario.
 *
 * ⚠️ Es solo un esqueleto: ajusta las aserciones al sitio real.
 */
test.describe('Hobbs - Home', () => {
  test('la home carga con el título correcto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(hobbsData.expectedHomeTitle);
  });
});
