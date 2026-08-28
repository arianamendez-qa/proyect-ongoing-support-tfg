import { test, expect } from '@playwright/test';
import { hobbsData } from '@data/hobbs.data';

const GIFT_CARD_NUMBER          = process.env.GIFT_CARD_NUMBER          ?? '';
const GIFT_CARD_PIN             = process.env.GIFT_CARD_PIN             ?? '';
const INACTIVE_GIFT_CARD_NUMBER = process.env.INACTIVE_GIFT_CARD_NUMBER ?? '';
const INACTIVE_GIFT_CARD_PIN    = process.env.INACTIVE_GIFT_CARD_PIN    ?? '';
const CC_NUMBER                 = process.env.CC_NUMBER                 ?? '';
const CC_EXPIRY_MONTH           = process.env.CC_EXPIRY_MONTH           ?? '';
const CC_EXPIRY_YEAR            = process.env.CC_EXPIRY_YEAR            ?? '';
const CC_CVV                    = process.env.CC_CVV                    ?? '';

const PRODUCT_TILE    = '.product-tile a, [class*="product-tile"] a';
const SIZE_BTN        = '.size-btn:not(.unselectable), [class*="size"]:not([disabled])';
const ADD_TO_CART     = '.add-to-cart, [class*="add-to-cart"]';
const GIFT_CARD_TAB   = '[class*="gift"], [data-target*="gift"], .gift-certificate-block, button:has-text("Gift Card"), a:has-text("Gift Card")';
const GIFT_CARD_INPUT = 'input[id*="hbGiftCard"], input[id*="giftCard"], input[placeholder*="card" i], input[name*="giftCert"]';
const PIN_INPUT       = 'input[id*="pin" i], input[name*="pin" i], input[placeholder*="pin" i]';
const AMOUNT_INPUT    = 'input[id*="amount" i], input[name*="amount" i], input[placeholder*="amount" i]';
const CHECK_BAL_BTN   = 'button:has-text("Check Balance"), .check-balance, [class*="check-balance"]';
const APPLY_BTN       = 'button:has-text("Apply"), button:has-text("Redeem"), [class*="apply-gift"]';

// Use only 1 cent to avoid depleting the card balance during testing.
const APPLY_AMOUNT = '0.01';
const BALANCE_DISPLAY = '[class*="balance"], [class*="gift-card-amount"], [class*="applied-amount"], [class*="gift"][class*="applied"]';
const APPLIED_GIFT    = '[class*="payment-instrument"], [class*="gift-payment"], [class*="applied-gift"]';
const ERROR_MSG       = '.error-message, [class*="error-message"], .alert-danger, [class*="invalid-feedback"], [class*="form-error"]';
const ORDER_CONFIRM   = '.order-confirm, [class*="order-confirmation"], h1:has-text("Thank you"), h2:has-text("Thank you")';
const CC_NUMBER_INPUT = 'input[id*="cardNumber"], input[name*="cardNumber"], input[placeholder*="card number" i]';
const CC_EXPIRY_INPUT = 'input[id*="expiry"], input[name*="expiry"], input[placeholder*="MM" i]';
const CC_CVV_INPUT    = 'input[id*="securityCode"], input[id*="cvv" i], input[name*="securityCode"]';
const PLACE_ORDER_BTN = 'button:has-text("Place Order"), button:has-text("Pay Now"), [class*="place-order"]';

async function addProductToCart(page: import('@playwright/test').Page) {
  const plpUrl = `${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`;
  await page.goto(plpUrl);
  await page.waitForLoadState('networkidle');

  const tile = page.locator(PRODUCT_TILE).first();
  await tile.waitFor({ timeout: 10_000 });
  await tile.click();
  await page.waitForLoadState('networkidle');

  const sizeBtn = page.locator(SIZE_BTN).first();
  if (await sizeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await sizeBtn.click();

  await page.locator(ADD_TO_CART).first().click();
  await page.waitForTimeout(800);
}

async function goToPaymentStep(page: import('@playwright/test').Page) {
  await page.goto(`${hobbsData.baseUrl}/checkout`);
  await page.waitForLoadState('networkidle');
  // Advance through shipping step if present.
  const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), .submit-shipping');
  if (await continueBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await continueBtn.first().click();
    await page.waitForLoadState('networkidle');
  }
}

async function openGiftCardSection(page: import('@playwright/test').Page) {
  const tab = page.locator(GIFT_CARD_TAB).first();
  if (await tab.isVisible({ timeout: 3_000 }).catch(() => false)) await tab.click();
  await page.locator(GIFT_CARD_INPUT).first().waitFor({ timeout: 5_000 });
}

async function enterGiftCard(page: import('@playwright/test').Page, cardNumber: string, pin: string) {
  await page.locator(GIFT_CARD_INPUT).first().fill(cardNumber);
  await page.locator(PIN_INPUT).first().fill(pin);
  await page.locator(CHECK_BAL_BTN).first().click();

  // Fill amount with 1 cent to avoid depleting the card during tests.
  const amountInput = page.locator(AMOUNT_INPUT).first();
  if (await amountInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await amountInput.fill(APPLY_AMOUNT);
    const applyBtn = page.locator(APPLY_BTN).first();
    if (await applyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await applyBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Gift Cards - HB Digital BIN routing (Hobbs UK Staging)', () => {

  test('new HB Digital BIN accepted at checkout', async ({ page }) => {
    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);

    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);

    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator(BALANCE_DISPLAY).first()).toBeVisible();
    await expect(page.locator(ERROR_MSG).first()).not.toBeVisible();
  });

  test('new HB Digital BIN routes to correct Hobbs account - network validation', async ({ page }) => {
    const prepayRequests: { url: string; body: string }[] = [];
    const prepayResponses: { url: string; body: string }[] = [];

    page.on('request', req => {
      if (/PrePay|GiftCard|gift/i.test(req.url())) {
        prepayRequests.push({ url: req.url(), body: req.postData() ?? '' });
      }
    });
    page.on('response', async res => {
      if (/PrePay|GiftCard|gift/i.test(res.url())) {
        const body = await res.text().catch(() => '');
        prepayResponses.push({ url: res.url(), body });
      }
    });

    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);
    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);

    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });

    const routedToSalesforce = prepayRequests.some(r =>
      r.url.includes('SALESFORCE') || r.body.includes('SALESFORCE') || r.body.includes('982602221'),
    );
    expect(routedToSalesforce, 'Request did not route to SALESFORCE client').toBe(true);

    const responseOk = prepayResponses.some(r => r.body.includes('00') || r.body.includes('code>00'));
    expect(responseOk, 'Response did not return success code 00').toBe(true);
  });

  test('gift card redeem reduces balance correctly', async ({ page }) => {
    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);
    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);

    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });

    const balanceBefore = await page.locator(BALANCE_DISPLAY).first().innerText().catch(() => '');

    // Complete the order with a CC for the remainder.
    await page.locator(CC_NUMBER_INPUT).first().fill(CC_NUMBER).catch(() => null);
    await page.locator(CC_EXPIRY_INPUT).first().fill(`${CC_EXPIRY_MONTH}/${CC_EXPIRY_YEAR}`).catch(() => null);
    await page.locator(CC_CVV_INPUT).first().fill(CC_CVV).catch(() => null);
    await page.locator(PLACE_ORDER_BTN).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(ORDER_CONFIRM).first()).toBeVisible({ timeout: 30_000 });

    // Re-enter the same gift card on a fresh checkout to verify balance reduced.
    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);
    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);
    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });

    const balanceAfter = await page.locator(BALANCE_DISPLAY).first().innerText().catch(() => '');
    expect(balanceAfter, 'Balance did not decrease after redemption').not.toBe(balanceBefore);
  });

  test('inactive HB Digital BIN card is rejected with error message', async ({ page }) => {
    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);

    await enterGiftCard(page, INACTIVE_GIFT_CARD_NUMBER, INACTIVE_GIFT_CARD_PIN);

    await expect(page.locator(ERROR_MSG).first()).toBeVisible({ timeout: 8_000 });
    const errorText = await page.locator(ERROR_MSG).first().innerText();
    expect(errorText.toLowerCase()).toMatch(/not active|inactive|invalid|error/);
    await expect(page.locator(APPLIED_GIFT).first()).not.toBeVisible();
  });

  test('partial payment: gift card + Credit Card completes order', async ({ page }) => {
    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);
    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);

    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator(BALANCE_DISPLAY).first()).toBeVisible();

    await page.locator(CC_NUMBER_INPUT).first().fill(CC_NUMBER).catch(() => null);
    await page.locator(CC_EXPIRY_INPUT).first().fill(`${CC_EXPIRY_MONTH}/${CC_EXPIRY_YEAR}`).catch(() => null);
    await page.locator(CC_CVV_INPUT).first().fill(CC_CVV).catch(() => null);
    await page.locator(PLACE_ORDER_BTN).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(ORDER_CONFIRM).first()).toBeVisible({ timeout: 30_000 });
  });

  test('BIN routing uses SALESFORCE client per Hobbs brand credentials', async ({ page }) => {
    const requestLog: { url: string; body: string }[] = [];
    const responseLog: { url: string; body: string }[] = [];

    page.on('request', req => {
      if (/PrePay|GiftCard|gift/i.test(req.url())) {
        requestLog.push({ url: req.url(), body: req.postData() ?? '' });
      }
    });
    page.on('response', async res => {
      if (/PrePay|GiftCard|gift/i.test(res.url())) {
        const body = await res.text().catch(() => '');
        responseLog.push({ url: res.url(), body });
      }
    });

    await addProductToCart(page);
    await goToPaymentStep(page);
    await openGiftCardSection(page);
    await enterGiftCard(page, GIFT_CARD_NUMBER, GIFT_CARD_PIN);
    await expect(page.locator(APPLIED_GIFT).first()).toBeVisible({ timeout: 8_000 });

    const salesforceClient = requestLog.some(r =>
      r.url.includes('SALESFORCE') || r.body.includes('SALESFORCE'),
    );
    expect(salesforceClient, 'Hobbs gift card request is not using SALESFORCE client').toBe(true);

    const successResponse = responseLog.some(r => r.body.includes('00'));
    expect(successResponse, 'PrePay response did not return code 00').toBe(true);
  });

});
