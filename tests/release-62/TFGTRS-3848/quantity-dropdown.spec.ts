import { test, expect } from '@playwright/test';
import { insideStoryData } from '@data/inside-story.data';

const PRODUCT_TILE  = '.product-tile a, [class*="product-tile"] a';
const SIZE_BTN      = '.size-btn:not(.unselectable), [class*="size"]:not([disabled])';
const ADD_TO_CART   = '.add-to-cart, [class*="add-to-cart"]';
const CART_ITEM     = '.cart-item, .product-line-item, [class*="cart-item"]';
const QTY_SELECT    = 'select[class*="quantity"], select[name*="quantity"], select[id*="quantity"], [class*="quantity"] select';
const QTY_INPUT     = 'input[class*="quantity"], input[name*="quantity"], input[id*="quantity"]';
const CART_TOTAL    = '.cart-total, [class*="cart-total"], .sub-total, [class*="sub-total"], [class*="subtotal"]';
const CHECKOUT_BTN  = '.checkout-btn, a[href*="checkout"], button[class*="checkout"], [class*="checkout-btn"]';
const CART_QTY_LINE = '[class*="quantity-form"], [class*="qty"]';

async function addProductToCart(page: import('@playwright/test').Page) {
  const plpUrl = `${insideStoryData.baseUrl}/search/show?q=${insideStoryData.searchTerm}`;
  await page.goto(plpUrl);
  const tile = page.locator(PRODUCT_TILE).first();
  await tile.waitFor({ timeout: 15_000 });
  await tile.click();
  await page.waitForLoadState('networkidle');

  const sizeBtn = page.locator(SIZE_BTN).first();
  if (await sizeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await sizeBtn.click();

  await page.locator(ADD_TO_CART).first().click();
  await page.waitForTimeout(800);
}

test.describe('TFGTRS-3848 - Quantity dropdown up to 30 units on Inside Story', () => {

  test('TC-130794: quantity dropdown shows options up to 30 and updates cart', async ({ page }) => {
    await addProductToCart(page);
    await page.goto(`${insideStoryData.baseUrl}/cart`);

    const cartItem = page.locator(CART_ITEM).first();
    await cartItem.waitFor({ timeout: 10_000 });

    // Prefer a <select> dropdown; fall back to a text input.
    const qtySelect = page.locator(QTY_SELECT).first();
    const hasSelect = await qtySelect.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasSelect) {
      // Collect all <option> values and assert maximum is at least 30.
      const options = await qtySelect.locator('option').all();
      const values  = await Promise.all(options.map(o => o.getAttribute('value')));
      const maxQty  = Math.max(...values.map(v => parseInt(v ?? '0', 10)).filter(n => !isNaN(n)));
      expect(maxQty, 'Quantity dropdown max is less than 30').toBeGreaterThanOrEqual(30);

      // Select a quantity of 15.
      await qtySelect.selectOption('15');
    } else {
      // Input-based quantity control.
      const qtyInput = page.locator(QTY_INPUT).first();
      await qtyInput.fill('15');
      await qtyInput.press('Enter');
    }

    await page.waitForTimeout(1_000);

    // Cart must still be visible and not show errors.
    await expect(page.locator(CART_ITEM).first()).toBeVisible();
  });

  test('TC-130795: quantity 20 updates subtotal and is maintained through checkout', async ({ page }) => {
    await addProductToCart(page);
    await page.goto(`${insideStoryData.baseUrl}/cart`);

    const cartItem = page.locator(CART_ITEM).first();
    await cartItem.waitFor({ timeout: 10_000 });

    const totalBefore = await page.locator(CART_TOTAL).first().innerText().catch(() => '');

    const qtySelect = page.locator(QTY_SELECT).first();
    const hasSelect = await qtySelect.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasSelect) {
      await qtySelect.selectOption('20');
    } else {
      const qtyInput = page.locator(QTY_INPUT).first();
      await qtyInput.fill('20');
      await qtyInput.press('Enter');
    }

    await page.waitForTimeout(1_500);

    // Subtotal must have changed.
    const totalAfter = await page.locator(CART_TOTAL).first().innerText().catch(() => '');
    expect(totalAfter, 'Subtotal did not update after changing quantity to 20').not.toBe(totalBefore);

    // Proceed to checkout — quantity must be preserved.
    await page.locator(CHECKOUT_BTN).first().click();
    await page.waitForLoadState('networkidle');

    const qtyInCheckout = page.locator(CART_QTY_LINE).first();
    if (await qtyInCheckout.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(qtyInCheckout).toContainText('20');
    }
  });

});
