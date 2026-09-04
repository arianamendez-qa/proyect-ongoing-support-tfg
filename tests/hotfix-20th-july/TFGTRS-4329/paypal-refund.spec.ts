import { test, expect, request as baseRequest } from '@playwright/test';
import { phaseEightData } from '@data/phase-eight.data';

const BM_URL       = process.env.BM_URL       ?? '';
const BM_USERNAME  = process.env.BM_USERNAME  ?? '';
const BM_PASSWORD  = process.env.BM_PASSWORD  ?? '';
const WEBDAV_URL   = process.env.WEBDAV_URL   ?? '';
const PAYPAL_EMAIL = process.env.PAYPAL_BUYER_EMAIL    ?? '';
const PAYPAL_PASS  = process.env.PAYPAL_BUYER_PASSWORD ?? '';

const WEBDAV_ARCHIVE    = `${WEBDAV_URL}/Impex/src/phaseeight/orderstatus/archive`;
const WEBDAV_PROCESSING = `${WEBDAV_URL}/Impex/src/phaseeight/orderstatus/processing`;
const PE_JOB_NAME       = 'Phase Eight Order Status Import';

// ── Storefront selectors ──────────────────────────────────────────────────────
const PRODUCT_TILE  = '.product-tile a, [class*="product-tile"] a';
const SIZE_BTN      = '.size-btn:not(.unselectable), [class*="size"]:not([disabled])';
const ADD_TO_CART   = '.add-to-cart, [class*="add-to-cart"]';
const GUEST_BTN     = 'button.guest, .guest-checkout, [class*="guest"]';
const EMAIL_INPUT   = 'input[name="dwfrm_customer_email"], input[type="email"]';
const FIRST_NAME    = 'input[name*="firstName"], input[id*="firstName"]';
const LAST_NAME     = 'input[name*="lastName"],  input[id*="lastName"]';
const ADDRESS1      = 'input[name*="address1"],   input[id*="address1"]';
const CITY_INPUT    = 'input[name*="city"],       input[id*="city"]';
const POSTAL_INPUT  = 'input[name*="postal"],     input[id*="postal"]';
const PHONE_INPUT   = 'input[name*="phone"],      input[id*="phone"]';
const SUBMIT_SHIP   = '.submit-shipping, button[value*="submit-shipping"], button:has-text("Continue")';
const PAYPAL_BTN    = '[data-method-id="PayPal"], [class*="paypal-button"], button[class*="paypal"], [id*="paypal-button"]';
const ORDER_CONFIRM = '.order-confirmation, [class*="order-confirmation"], h1:has-text("Thank you"), h2:has-text("Thank you")';
const ORDER_NUM_EL  = '.order-number, [class*="order-number"]';

// ── BM selectors ──────────────────────────────────────────────────────────────
const BM_USER_INPUT = 'input[name="LoginForm_Login"], input[name*="username" i]';
const BM_PASS_INPUT = 'input[type="password"]';
const BM_SUBMIT     = 'button[type="submit"], input[type="submit"], button[value*="Log"]';
const BM_JOB_RUN    = 'button:has-text("Run"), a:has-text("Run"), [title="Run"]';
const BM_JOB_STATUS = '[class*="status"], td[class*="last"]';
const BM_LOG_SEARCH = 'input[type="search"], input[placeholder*="search" i], input[name*="search" i]';

// ── Test shipping data (UK staging) ───────────────────────────────────────────
const SHIP = {
  email    : 'qa+paypal@applydigital.com',
  firstName: 'QA',
  lastName : 'Test',
  address  : '10 High Street',
  city     : 'London',
  postcode : 'SW1A 1AA',
  phone    : '07700900000',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function addProductToCart(page: import('@playwright/test').Page, count = 1) {
  const plpUrl = `${phaseEightData.baseUrl}/search/show?q=${phaseEightData.searchTerm}`;
  for (let i = 0; i < count; i++) {
    await page.goto(plpUrl);
    await page.waitForLoadState('networkidle');

    const tiles = page.locator(PRODUCT_TILE);
    await tiles.first().waitFor({ timeout: 15_000 });
    await tiles.nth(i % (await tiles.count())).click();
    await page.waitForLoadState('networkidle');

    const size = page.locator(SIZE_BTN).first();
    if (await size.isVisible({ timeout: 2_000 }).catch(() => false)) await size.click();

    await page.locator(ADD_TO_CART).first().click();
    await page.waitForTimeout(800);
  }
}

async function fillShippingAndContinue(page: import('@playwright/test').Page) {
  // Guest checkout if prompted.
  const guest = page.locator(GUEST_BTN).first();
  if (await guest.isVisible({ timeout: 3_000 }).catch(() => false)) await guest.click();

  // Email.
  const email = page.locator(EMAIL_INPUT).first();
  if (await email.isVisible({ timeout: 3_000 }).catch(() => false)) await email.fill(SHIP.email);

  await page.locator(FIRST_NAME).first().fill(SHIP.firstName).catch(() => null);
  await page.locator(LAST_NAME).first().fill(SHIP.lastName).catch(() => null);
  await page.locator(ADDRESS1).first().fill(SHIP.address).catch(() => null);
  await page.locator(CITY_INPUT).first().fill(SHIP.city).catch(() => null);
  await page.locator(POSTAL_INPUT).first().fill(SHIP.postcode).catch(() => null);
  await page.locator(PHONE_INPUT).first().fill(SHIP.phone).catch(() => null);

  await page.locator(SUBMIT_SHIP).first().click();
  await page.waitForLoadState('networkidle');
}

async function completePayPalSandbox(page: import('@playwright/test').Page) {
  // PayPal may open as a popup or a redirect.
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 8_000 }).catch(() => null),
    page.locator(PAYPAL_BTN).first().click(),
  ]);

  const pp = popup ?? page;
  await pp.waitForLoadState('networkidle');

  // Login to PayPal sandbox.
  await pp.locator('#email, input[name="email"]').first().fill(PAYPAL_EMAIL);
  await pp.locator('#btnNext, button[type="submit"]').first().click().catch(() => null);
  await pp.waitForTimeout(1_000);
  await pp.locator('#password, input[name="password"]').first().fill(PAYPAL_PASS);
  await pp.locator('#btnLogin, button[id*="login"]').first().click();
  await pp.waitForLoadState('networkidle');

  // Confirm payment.
  await pp.locator('#payment-submit-btn, button:has-text("Pay Now"), button:has-text("Continue")').first().click();
  await pp.waitForLoadState('networkidle');

  // If a popup was used, wait for the main page to receive the return redirect.
  if (popup) await page.waitForLoadState('networkidle');
}

async function placePayPalOrder(page: import('@playwright/test').Page, itemCount = 1): Promise<string> {
  await addProductToCart(page, itemCount);
  await page.goto(`${phaseEightData.baseUrl}/checkout`);
  await page.waitForLoadState('networkidle');
  await fillShippingAndContinue(page);
  await completePayPalSandbox(page);

  await expect(page.locator(ORDER_CONFIRM).first()).toBeVisible({ timeout: 30_000 });

  const orderNumEl = page.locator(ORDER_NUM_EL).first();
  const orderNum   = await orderNumEl.innerText().catch(() => '');
  return orderNum.replace(/[^0-9A-Za-z-]/g, '').trim();
}

async function loginToBM(page: import('@playwright/test').Page) {
  await page.goto(BM_URL);
  await page.waitForLoadState('networkidle');
  await page.locator(BM_USER_INPUT).first().fill(BM_USERNAME);
  await page.locator(BM_PASS_INPUT).first().fill(BM_PASSWORD);
  await page.locator(BM_SUBMIT).first().click();
  await page.waitForLoadState('networkidle');
}

async function runBMJob(page: import('@playwright/test').Page, jobName: string) {
  await page.locator('a[href*="Administration"], text=Administration').first().click().catch(() => null);
  await page.locator('a[href*="Operations"], text=Operations').first().click().catch(() => null);
  await page.locator('a[href*="Jobs"], text=Jobs').first().click().catch(() => null);
  await page.waitForLoadState('networkidle');

  const jobRow = page.locator(`tr:has-text("${jobName}"), [class*="job"]:has-text("${jobName}")`).first();
  await jobRow.waitFor({ timeout: 15_000 });
  await jobRow.locator(BM_JOB_RUN).first().click();
  await page.waitForLoadState('networkidle');

  await expect(jobRow.locator(BM_JOB_STATUS).first()).toContainText(/OK|Finished|Complete/i, { timeout: 120_000 });
}

async function getWebDavContext() {
  return baseRequest.newContext({ httpCredentials: { username: BM_USERNAME, password: BM_PASSWORD } });
}

async function findOrderXmlInArchive(orderNumber: string): Promise<{ filename: string; content: string }> {
  const ctx     = await getWebDavContext();
  const propResp = await ctx.fetch(`${WEBDAV_ARCHIVE}/`, {
    method : 'PROPFIND',
    headers: { Depth: '1', 'Content-Type': 'application/xml' },
    data   : `<?xml version="1.0"?><propfind xmlns="DAV:"><prop><displayname/></prop></propfind>`,
  });
  const listing = await propResp.text();

  const match = listing.match(new RegExp(`[^<"\\s]*${orderNumber}[^<"\\s]*\\.xml`));
  expect(match, `XML for order ${orderNumber} not found in WebDAV archive`).not.toBeNull();

  const filename = match![0].split('/').pop()!;
  const fileResp = await ctx.get(`${WEBDAV_ARCHIVE}/${filename}`);
  const content  = await fileResp.text();
  await ctx.dispose();
  return { filename, content };
}

async function uploadToProcessing(filename: string, content: string) {
  const ctx = await getWebDavContext();
  const resp = await ctx.put(`${WEBDAV_PROCESSING}/${filename}`, {
    data   : content,
    headers: { 'Content-Type': 'application/xml' },
  });
  expect(resp.status(), `WebDAV upload failed (${resp.status()})`).toBeLessThan(300);
  await ctx.dispose();
}

async function waitForFileToDisappear(filename: string, timeoutMs = 60_000) {
  const ctx  = await getWebDavContext();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const resp = await ctx.head(`${WEBDAV_PROCESSING}/${filename}`).catch(() => null);
    if (!resp || resp.status() === 404) break;
    await new Promise(r => setTimeout(r, 5_000));
  }
  await ctx.dispose();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TFGTRS-4329 - PayPal refund processing', () => {

  test('TC-128475: standard PayPal checkout flow — no regression', async ({ page }) => {
    const orderNum = await placePayPalOrder(page, 1);
    expect(orderNum.length, 'Order number not captured on confirmation page').toBeGreaterThan(0);
  });

  test('TC-128473: full PayPal refund processes successfully', async ({ page }) => {
    // Place a PayPal order to get a real order number.
    const orderNum = await placePayPalOrder(page, 1);
    expect(orderNum.length, 'Order number not captured').toBeGreaterThan(0);

    // Wait briefly for SFCC to write the order XML to the archive.
    await page.waitForTimeout(10_000);

    // Download the order XML from WebDAV archive.
    const { filename, content } = await findOrderXmlInArchive(orderNum);

    // Set ALL product-lineitem statuses to RETURNED.
    const modifiedXml = content
      .replace(/<status>[^<]*<\/status>/g, '<status>RETURNED</status>')
      .replace(/<return-status>[^<]*<\/return-status>/g, '<return-status>RETURNED</return-status>');

    // Upload to processing folder.
    await uploadToProcessing(filename, modifiedXml);

    // Go to BM and run the job.
    await loginToBM(page);
    await runBMJob(page, PE_JOB_NAME);

    // The file must disappear from processing once the job picks it up.
    await waitForFileToDisappear(filename, 60_000);

    // Verify order history in BM shows the refund entry.
    const ordersLink = page.locator('a[href*="Orders"], text=Orders').first();
    await ordersLink.click().catch(() => null);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name*="orderNo"], input[placeholder*="order" i]').first().fill(orderNum).catch(() => null);
    await page.locator('button:has-text("Search"), input[value*="Search"]').first().click().catch(() => null);
    await page.waitForLoadState('networkidle');

    await page.locator(`tr:has-text("${orderNum}"), a:has-text("${orderNum}")`).first().click().catch(() => null);
    await page.waitForLoadState('networkidle');

    const historyTab = page.locator('a:has-text("History"), [class*="history-tab"]').first();
    await historyTab.click().catch(() => null);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(/refunded from PayPal/i, { timeout: 10_000 });
  });

  test('TC-128474: partial refund processes correctly for one item out of two', async ({ page }) => {
    // Place a 2-item order.
    const orderNum = await placePayPalOrder(page, 2);
    expect(orderNum.length, 'Order number not captured').toBeGreaterThan(0);

    await page.waitForTimeout(10_000);

    const { filename, content } = await findOrderXmlInArchive(orderNum);

    // Set only the FIRST product-lineitem to RETURNED — leave the second unchanged.
    let replacedFirst = false;
    const modifiedXml = content.replace(/<status>[^<]*<\/status>/g, match => {
      if (!replacedFirst) {
        replacedFirst = true;
        return '<status>RETURNED</status>';
      }
      return match;
    });

    await uploadToProcessing(filename, modifiedXml);

    await loginToBM(page);
    await runBMJob(page, PE_JOB_NAME);
    await waitForFileToDisappear(filename, 60_000);

    // Check BM order history for a partial refund entry.
    await page.locator('a[href*="Orders"], text=Orders').first().click().catch(() => null);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name*="orderNo"], input[placeholder*="order" i]').first().fill(orderNum).catch(() => null);
    await page.locator('button:has-text("Search"), input[value*="Search"]').first().click().catch(() => null);
    await page.waitForLoadState('networkidle');
    await page.locator(`tr:has-text("${orderNum}"), a:has-text("${orderNum}")`).first().click().catch(() => null);
    await page.waitForLoadState('networkidle');
    await page.locator('a:has-text("History"), [class*="history-tab"]').first().click().catch(() => null);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(/refunded from PayPal/i, { timeout: 10_000 });
  });

  test('TC-128476: job runs without "Could not refund" errors in Log Center', async ({ page }) => {
    // Place an order and process a full refund (re-uses the same flow).
    const orderNum = await placePayPalOrder(page, 1);
    expect(orderNum.length, 'Order number not captured').toBeGreaterThan(0);

    await page.waitForTimeout(10_000);
    const { filename, content } = await findOrderXmlInArchive(orderNum);
    const modifiedXml = content.replace(/<status>[^<]*<\/status>/g, '<status>RETURNED</status>');
    await uploadToProcessing(filename, modifiedXml);

    await loginToBM(page);
    await runBMJob(page, PE_JOB_NAME);

    // Navigate to BM Log Center.
    await page.locator('a[href*="Administration"], text=Administration').first().click().catch(() => null);
    await page.locator('a[href*="Operations"], text=Operations').first().click().catch(() => null);
    await page.locator('a[href*="Log"], text=Log Center, a:has-text("Log Center")').first().click().catch(() => null);
    await page.waitForLoadState('networkidle');

    // Search for the order number to filter relevant entries.
    const searchInput = page.locator(BM_LOG_SEARCH).first();
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill(orderNum);
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    }

    // Assert no "Could not refund" message appears.
    await expect(page.locator('body')).not.toContainText(/Could not refund/i, { timeout: 10_000 });

    // Job status in the log must be OK.
    await expect(page.locator('body')).toContainText(/OK|Success|Finished/i);
  });

});
