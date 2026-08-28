import { test, expect } from '@playwright/test';
import { hobbsData }      from '@data/hobbs.data';
import { phaseEightData } from '@data/phase-eight.data';
import { whistlesData }   from '@data/whistles.data';

const PRODUCT_TILE  = '.product-tile a, [class*="product-tile"] a';
const SIZE_BTN      = '.size-btn:not(.unselectable), [class*="size"]:not([disabled])';
const ADD_TO_CART   = '.add-to-cart, [class*="add-to-cart"]';
const CHECKOUT_BTN  = '.checkout-btn, a[href*="checkout"], [class*="checkout-btn"]';
const CART_ITEM     = '.cart-item, .product-line-item, [class*="cart-item"]';
const REMOVE_BTN    = '.remove-product, .remove-line-item, [class*="remove"] button, button[data-pid]';
const ERROR_MSG     = '.error-message, [class*="error-message"], .alert-danger, [class*="alert"]';

const TARGET_ITEMS = 7;

const brands = [
  { name: 'Phase Eight', data: phaseEightData },
  { name: 'Hobbs',       data: hobbsData },
  { name: 'Whistles',    data: whistlesData },
];

async function addItemToCart(page: import('@playwright/test').Page, plpUrl: string, nth: number) {
  await page.goto(plpUrl);
  const tiles = page.locator(PRODUCT_TILE);
  await tiles.first().waitFor({ timeout: 10_000 });
  await tiles.nth(nth % (await tiles.count())).click();
  await page.waitForLoadState('networkidle');

  const sizeBtn = page.locator(SIZE_BTN).first();
  if (await sizeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await sizeBtn.click();

  await page.locator(ADD_TO_CART).first().click();
  await page.waitForTimeout(600);
}

for (const brand of brands) {
  test.describe(`TFGTRS-4294 - Basket rapid removal: ${brand.name}`, () => {

    test(`no error when removing ${TARGET_ITEMS}+ items quickly on ${brand.name}`, async ({ page }) => {
      const plpUrl = `${brand.data.baseUrl}/search/show?q=${brand.data.searchTerm}`;

      // ── Add TARGET_ITEMS products to cart ────────────────────────────────
      for (let i = 0; i < TARGET_ITEMS; i++) {
        await addItemToCart(page, plpUrl, i);
      }

      // ── Go to basket ──────────────────────────────────────────────────────
      await page.goto(`${brand.data.baseUrl}/cart`);
      const items = page.locator(CART_ITEM);
      await items.first().waitFor({ timeout: 10_000 });
      const count = await items.count();
      expect(count, `Expected at least ${TARGET_ITEMS} items in cart`).toBeGreaterThanOrEqual(TARGET_ITEMS);

      // ── Rapidly click remove on all items ────────────────────────────────
      const removeBtns = page.locator(REMOVE_BTN);
      const total = await removeBtns.count();
      // Fire all removes in quick succession without waiting between clicks.
      for (let i = 0; i < total; i++) {
        const btn = removeBtns.nth(i);
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ force: true });
        }
      }
      await page.waitForTimeout(1_500);

      // ── Assert no error message appeared ────────────────────────────────
      const errorMsg = page.locator(ERROR_MSG);
      await expect(errorMsg, 'An error message appeared after rapid removal').toHaveCount(0);
    });

  });
}
