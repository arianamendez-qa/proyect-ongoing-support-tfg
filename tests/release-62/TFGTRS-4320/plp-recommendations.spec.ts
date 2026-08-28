import { test, expect } from '@playwright/test';
import { hobbsData }      from '@data/hobbs.data';
import { phaseEightData } from '@data/phase-eight.data';
import { whistlesData }   from '@data/whistles.data';

// Broad selector — covers Einstein, Constructor and custom recommendation components.
const RECO_SECTION = [
  '[class*="recommendation"]',
  '[class*="einstein"]',
  '[data-cq-component*="recommendation"]',
  '.product-recommendations',
].join(', ');

const PRODUCT_TILE = '.product-tile a, [class*="product-tile"] a, [class*="productTile"] a';

const brands = [
  { name: 'Hobbs',       data: hobbsData },
  { name: 'Phase Eight', data: phaseEightData },
  { name: 'Whistles',    data: whistlesData },
];

for (const brand of brands) {
  const plpUrl = `${brand.data.baseUrl}/search/show?q=${brand.data.searchTerm}`;

  test.describe(`TFGTRS-4320 - Recommendation slot on ${brand.name} PLP`, () => {

    // Build minimal browsing history so the recommendation engine has signals.
    test.beforeEach(async ({ page }) => {
      await page.goto(plpUrl);
      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 15_000 });

      for (let i = 0; i < Math.min(2, await tiles.count()); i++) {
        await page.locator(PRODUCT_TILE).nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    });

    test(`TC: recommendation slot is visible at the bottom of ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);
      await page.waitForLoadState('networkidle');

      // Scroll to the bottom to trigger lazy-loaded recommendations.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1_000);

      const section = page.locator(RECO_SECTION);
      await section.first().waitFor({ timeout: 15_000 });
      await expect(section.first()).toBeVisible();
    });

    test(`TC: recommendation slot does not break ${brand.name} PLP layout`, async ({ page }) => {
      await page.goto(plpUrl);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForLoadState('networkidle');

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow, 'Page has unexpected horizontal overflow').toBe(false);
    });

  });
}
