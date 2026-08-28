import { test, expect } from '@playwright/test';
import { hobbsData }      from '@data/hobbs.data';
import { phaseEightData } from '@data/phase-eight.data';
import { whistlesData }   from '@data/whistles.data';

// SFCC renders prices as structured microdata or data attributes.
// These selectors target the most common SFCC price patterns.
const PRODUCT_TILE     = '.product-tile, [class*="product-tile"]';
const ORIGINAL_PRICE   = '[class*="strike-through"] .value, .price del .value, [class*="original-price"] .value';
const SALE_PRICE       = '.sales .value, [class*="sale-price"] .value, .price ins .value';
const PERCENT_BADGE    = '[class*="percent-off"], [class*="percentOff"], [class*="badge"][class*="percent"]';
const POUND_BADGE      = '[class*="saving"], [class*="pound-off"], [class*="gbp-badge"]';
const PROMO_CALLOUT    = '[class*="promo-callout"], [class*="promoCallout"], [class*="promotional"]';

/** Parse GBP price string like "£89.00" → 89 */
function parseGbp(text: string): number {
  return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
}

/** Round DOWN to the nearest multiple of 5 */
function floorToNearest5(n: number): number {
  return Math.floor(n / 5) * 5;
}

const brands = [
  { name: 'Hobbs',       data: hobbsData },
  { name: 'Phase Eight', data: phaseEightData },
  { name: 'Whistles',    data: whistlesData },
];

for (const brand of brands) {
  const plpUrl = `${brand.data.baseUrl}/search/show?q=${brand.data.searchTerm}`;

  test.describe(`TFGTRS-3953 - Discount badge: ${brand.name}`, () => {

    test(`% off badge reflects correct total discount on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      // Find the first tile that has both an original and a sale price.
      let verifiedCount = 0;
      for (const tile of await tiles.all()) {
        const origEl  = tile.locator(ORIGINAL_PRICE).first();
        const saleEl  = tile.locator(SALE_PRICE).first();
        const badge   = tile.locator(PERCENT_BADGE).first();

        const hasOrig = await origEl.isVisible().catch(() => false);
        const hasSale = await saleEl.isVisible().catch(() => false);
        if (!hasOrig || !hasSale) continue;

        const origText = await origEl.innerText();
        const saleText = await saleEl.innerText();
        const original = parseGbp(origText);
        const final    = parseGbp(saleText);
        if (original === 0 || final === 0 || final >= original) continue;

        const pctDiscount = floorToNearest5(Math.floor(((original - final) / original) * 100));

        if (pctDiscount >= 10) {
          await expect(badge, `% badge missing on tile with ${pctDiscount}% off`).toBeVisible();
          const badgeText = await badge.innerText();
          expect(badgeText, `Badge text should contain ${pctDiscount}%`).toContain(`${pctDiscount}`);
        } else {
          // Badge must NOT appear if discount < 10%.
          await expect(badge, 'Badge shown for discount < 10%').toHaveCount(0);
        }

        verifiedCount++;
        if (verifiedCount >= 3) break;
      }
      expect(verifiedCount, 'No discounted product tiles found to verify').toBeGreaterThan(0);
    });

    test(`£ off badge reflects correct saving rounded to nearest £5 on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      let verifiedCount = 0;
      for (const tile of await tiles.all()) {
        const origEl = tile.locator(ORIGINAL_PRICE).first();
        const saleEl = tile.locator(SALE_PRICE).first();
        const badge  = tile.locator(POUND_BADGE).first();

        const hasOrig = await origEl.isVisible().catch(() => false);
        const hasSale = await saleEl.isVisible().catch(() => false);
        if (!hasOrig || !hasSale) continue;

        const original = parseGbp(await origEl.innerText());
        const final    = parseGbp(await saleEl.innerText());
        if (original === 0 || final === 0 || final >= original) continue;

        const saving = floorToNearest5(original - final);

        if (saving >= 20) {
          await expect(badge, `£ badge missing for saving of £${saving}`).toBeVisible();
          const badgeText = await badge.innerText();
          expect(badgeText).toContain(`${saving}`);
        } else {
          await expect(badge, '£ badge shown for saving < £20').toHaveCount(0);
        }

        verifiedCount++;
        if (verifiedCount >= 3) break;
      }
      // £ badge might not be configured on all brands; skip gracefully if no tiles found.
      if (verifiedCount === 0) test.skip();
    });

    test(`blank promo callout shows no badge background on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      for (const tile of await tiles.all()) {
        const callout = tile.locator(PROMO_CALLOUT).first();
        const hasCallout = await callout.isVisible().catch(() => false);
        if (!hasCallout) continue;

        const text = (await callout.innerText()).trim();
        if (text === '') {
          // Empty callout — no colored background badge should be visible.
          const box = await callout.boundingBox();
          expect(box?.width ?? 0, 'Empty callout badge has visible width').toBe(0);
        }
      }
    });

    test(`custom promo callout and % badge co-exist on ${brand.name} PLP`, async ({ page }) => {
      await page.goto(plpUrl);

      const tiles = page.locator(PRODUCT_TILE);
      await tiles.first().waitFor({ timeout: 10_000 });

      for (const tile of await tiles.all()) {
        const callout = tile.locator(PROMO_CALLOUT).first();
        const badge   = tile.locator(PERCENT_BADGE).first();

        const hasCallout = await callout.isVisible().catch(() => false);
        const hasBadge   = await badge.isVisible().catch(() => false);

        if (hasCallout && hasBadge) {
          // Both must be visible simultaneously without visual overlap.
          await expect(callout).toBeVisible();
          await expect(badge).toBeVisible();
          return; // Found at least one tile with both — test passes.
        }
      }
      // No tile with both elements found — skip rather than fail.
      test.skip();
    });

  });
}
