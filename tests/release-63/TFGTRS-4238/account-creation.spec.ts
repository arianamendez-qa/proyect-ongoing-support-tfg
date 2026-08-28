import { test, expect } from '@playwright/test';
import { hobbsData } from '@data/hobbs.data';

// Update these selectors to match the actual SFCC checkout and account pages.
const SELECTORS = {
  productTile:       '.product-tile a',
  addToCart:         '.add-to-cart, [class*="add-to-cart"]',
  sizeOption:        '.size-btn:not(.unselectable):first-child, [class*="size"]:not([disabled]):first-child',
  checkoutBtn:       '.checkout-btn, [class*="checkout"], a[href*="checkout"]',
  guestEmail:        '[name="dwfrm_customer_email"], #email, [name="email"]',
  firstName:         '[name="dwfrm_shipping_shippingAddress_addressFields_firstName"], [name="firstName"]',
  lastName:          '[name="dwfrm_shipping_shippingAddress_addressFields_lastName"],  [name="lastName"]',
  address1:          '[name="dwfrm_shipping_shippingAddress_addressFields_address1"],  [name="address1"]',
  city:              '[name="dwfrm_shipping_shippingAddress_addressFields_city"],       [name="city"]',
  postcode:          '[name="dwfrm_shipping_shippingAddress_addressFields_postalCode"],[name="postalCode"]',
  submitShipping:    'button.submit-shipping, [class*="submit-shipping"]',
  cardNumber:        '[name="dwfrm_billing_paymentMethod_creditCard_number"], [id*="card-number"]',
  cardExpiry:        '[name="expiration"], [id*="expiry"]',
  cardCvv:           '[name="dwfrm_billing_paymentMethod_creditCard_cvn"], [id*="cvv"]',
  placeOrder:        '.place-order, [class*="place-order"]',
  createPwdField:    '[name="password"], [id*="password"]',
  confirmPwdField:   '[name="passwordConfirm"], [id*="password-confirm"]',
  createAccountBtn:  'button:has-text("Create Account"), [class*="create-account"]',
  addressBook:       '[class*="address-book"], .address-book, [class*="addressbook"]',
};

const SHIPPING = {
  firstName: 'Test',
  lastName:  'Automation',
  address1:  '1 London Wall',
  city:      'London',
  postcode:  'EC2Y 5AB',
};

// Visa test card — update with the sandbox-specific test card if different.
const TEST_CARD = { number: '4111111111111111', expiry: '12/30', cvv: '123' };

test.describe('TFGTRS-4238 - Account creation from order confirmation', () => {

  test('address saves correctly — no [object] Object in address book', async ({ page }) => {
    const email = `qa.auto+${Date.now()}@example.com`;

    // ── 1. Add a product to cart ─────────────────────────────────────────────
    await page.goto(`${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`);
    await page.locator(SELECTORS.productTile).first().click();
    await page.waitForLoadState('networkidle');

    const sizeBtn = page.locator(SELECTORS.sizeOption).first();
    if (await sizeBtn.isVisible()) await sizeBtn.click();

    await page.locator(SELECTORS.addToCart).first().click();
    await page.waitForTimeout(1_000);

    // ── 2. Proceed to checkout as guest ─────────────────────────────────────
    await page.goto(`${hobbsData.baseUrl}/cart`);
    await page.locator(SELECTORS.checkoutBtn).first().click();
    await page.waitForLoadState('networkidle');

    // Fill guest email if prompted before shipping form.
    const guestEmail = page.locator(SELECTORS.guestEmail).first();
    if (await guestEmail.isVisible()) {
      await guestEmail.fill(email);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // ── 3. Fill in shipping address ─────────────────────────────────────────
    await page.locator(SELECTORS.firstName).first().fill(SHIPPING.firstName);
    await page.locator(SELECTORS.lastName).first().fill(SHIPPING.lastName);
    await page.locator(SELECTORS.address1).first().fill(SHIPPING.address1);
    await page.locator(SELECTORS.city).first().fill(SHIPPING.city);
    await page.locator(SELECTORS.postcode).first().fill(SHIPPING.postcode);
    await page.locator(SELECTORS.submitShipping).first().click();
    await page.waitForLoadState('networkidle');

    // ── 4. Complete payment ──────────────────────────────────────────────────
    const cardInput = page.locator(SELECTORS.cardNumber).first();
    if (await cardInput.isVisible()) {
      await cardInput.fill(TEST_CARD.number);
      await page.locator(SELECTORS.cardExpiry).first().fill(TEST_CARD.expiry);
      await page.locator(SELECTORS.cardCvv).first().fill(TEST_CARD.cvv);
    }
    await page.locator(SELECTORS.placeOrder).first().click();
    await page.waitForLoadState('networkidle');

    // ── 5. Create account from order confirmation ────────────────────────────
    const pwdField = page.locator(SELECTORS.createPwdField).first();
    await pwdField.waitFor({ timeout: 15_000 });
    await pwdField.fill('QaTest123!');

    const confirmField = page.locator(SELECTORS.confirmPwdField).first();
    if (await confirmField.isVisible()) await confirmField.fill('QaTest123!');

    await page.locator(SELECTORS.createAccountBtn).first().click();
    await page.waitForLoadState('networkidle');

    // ── 6. Assert address book has no [object] Object ────────────────────────
    await page.goto(`${hobbsData.baseUrl}/account/addressbook`);

    const addressBook = page.locator(SELECTORS.addressBook);
    await addressBook.waitFor({ timeout: 10_000 });

    await expect(addressBook, 'Address book contains raw [object] Object').not.toContainText('[object]');
    await expect(addressBook, 'Address book contains raw Object').not.toContainText('[Object]');

    // The shipping postcode must appear correctly formatted.
    await expect(addressBook).toContainText(SHIPPING.postcode);
  });

  test('[object] Object does not appear in any address field', async ({ page }) => {
    // Companion test — navigates directly to address book after the account has been created.
    // Run this after the previous test in a re-run scenario.
    await page.goto(`${hobbsData.baseUrl}/account/addressbook`);

    const fields = page.locator(
      '[class*="address"] [class*="value"], [class*="address"] td, [class*="addressbook"] p',
    );
    const count = await fields.count();

    for (let i = 0; i < count; i++) {
      const text = await fields.nth(i).innerText();
      expect(text, `Field at index ${i} contains raw object string`).not.toContain('[object]');
    }
  });

});
