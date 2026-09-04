import { test, expect } from '@fixtures/pages.fixture';
import { phaseEightData } from '@data/phase-eight.data';

/**
 * Test de ejemplo (UI) para Phase Eight.
 * El acceso a staging va por HTTP Basic Auth (httpCredentials en la config),
 * así que las requests ya van autenticadas sin login por formulario.
 *
 * ⚠️ Es solo un esqueleto: ajusta las aserciones al sitio real.
 */
test.describe('Phase Eight - Home', () => {
  test('la home carga con el título correcto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(phaseEightData.expectedHomeTitle);
  });
});
