import { test, expect } from '@playwright/test';
import { hobbsData }        from '@data/hobbs.data';
import { phaseEightData }   from '@data/phase-eight.data';
import { whistlesData }     from '@data/whistles.data';
import { insideStoryData }  from '@data/inside-story.data';

const PRODUCT_TILE  = '.product-tile, [class*="product-tile"]';
const SWATCH        = '[class*="swatch"], [class*="color-swatch"], [class*="colorSwatch"]';
const PRODUCT_NAME  = '[class*="product-name"], .pdpName, [class*="tile-body"] [class*="name"], .product-tile .product-name';
const PRODUCT_IMG   = '[class*="product-tile"] img, [class*="product-tile"] [class*="image"] img';

const brands = [
  { name: 'Phase Eight',  data: phaseEightData },
  { name: 'Whistles',     data: whistlesData },
  { name: 'Hobbs',        data: hobbsData },
  { name: 'Inside Story', data: insideStoryData },
];

for (const brand of brands) {
  const plpUrl = `${brand.data.baseUrl}/search/show?q=${brand.data.searchTerm}`;

  test.describe(`TFGTRS-4366 - PLP color swatch: ${brand.name}`, () => {

    test(`product title updates when a swatch is clicked on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      let tested = false;
      for (const tile of await tiles.all()) {
        const swatches   = tile.locator(SWATCH);
        const swatchCount = await swatches.count();
        if (swatchCount < 2) continue;

        const nameEl  = tile.locator(PRODUCT_NAME).first();
        const hasName = await nameEl.isVisible().catch(() => false);
        if (!hasName) continue;

        const nameBefore = (await nameEl.innerText()).trim();

        await swatches.nth(1).click();
        await page.waitForTimeout(800);

        const nameAfter = (await nameEl.innerText()).trim();
        expect(
          nameAfter,
          `Product title on ${brand.name} PLP did not update after swatch click (was: "${nameBefore}")`,
        ).not.toBe(nameBefore);

        tested = true;
        break;
      }
      if (!tested) test.skip();
    });

    test(`product image updates alongside the title after swatch click on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      let tested = false;
      for (const tile of await tiles.all()) {
        const swatches = tile.locator(SWATCH);
        if (await swatches.count() < 2) continue;

        const img    = tile.locator(PRODUCT_IMG).first();
        const hasImg = await img.isVisible().catch(() => false);
        if (!hasImg) continue;

        const srcBefore = (await img.getAttribute('src')) ?? (await img.getAttribute('srcset')) ?? '';

        await swatches.nth(1).click();
        await page.waitForTimeout(800);

        const srcAfter = (await img.getAttribute('src')) ?? (await img.getAttribute('srcset')) ?? '';

        expect(
          srcAfter,
          `Product image on ${brand.name} PLP did not change after swatch click`,
        ).not.toBe(srcBefore);

        tested = true;
        break;
      }
      if (!tested) test.skip();
    });

  });
}
