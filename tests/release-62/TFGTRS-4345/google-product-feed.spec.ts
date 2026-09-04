import { test, expect, request as baseRequest } from '@playwright/test';
import { hobbsData } from '@data/hobbs.data';

const BM_URL      = process.env.BM_URL      ?? '';
const BM_USERNAME = process.env.BM_USERNAME ?? '';
const BM_PASSWORD = process.env.BM_PASSWORD ?? '';
const WEBDAV_URL  = process.env.WEBDAV_URL  ?? '';

const FEED_ARCHIVE_PATH = `${WEBDAV_URL}/Impex/src/feeds/custom/archive`;
const JOB_NAME          = 'GoogleProductFeed';
const SITE_ID           = 'HB-UK';

const PRODUCT_TILE  = '.product-tile a, [class*="product-tile"] a';
const SALE_PRICE    = '.sales .value, [class*="sales"] [class*="value"], [class*="sale-price"], del + [class*="price"]';

// ── BM helpers ────────────────────────────────────────────────────────────────

async function loginToBM(page: import('@playwright/test').Page) {
  await page.goto(`${BM_URL}`);
  await page.waitForLoadState('networkidle');

  await page.locator('input[name="LoginForm_Login"], input[name*="username" i]').first().fill(BM_USERNAME);
  await page.locator('input[type="password"]').first().fill(BM_PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"], button[value*="Log"]').first().click();
  await page.waitForLoadState('networkidle');
}

async function runBMJob(page: import('@playwright/test').Page, jobName: string, siteId: string) {
  // Navigate to Administration > Operations > Jobs.
  await page.locator('a[href*="Administration"], text=Administration').first().click().catch(() => null);
  await page.locator('a[href*="Operations"], text=Operations').first().click().catch(() => null);
  await page.locator('a[href*="Jobs"], text=Jobs').first().click().catch(() => null);
  await page.waitForLoadState('networkidle');

  // Find the job row.
  const jobRow = page.locator(`tr:has-text("${jobName}"), [class*="job-row"]:has-text("${jobName}")`).first();
  await jobRow.waitFor({ timeout: 15_000 });

  // Select the site scope if needed.
  const siteSelect = jobRow.locator(`select, [class*="site-select"]`).first();
  if (await siteSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await siteSelect.selectOption(siteId).catch(() => null);
  }

  // Click Run.
  await jobRow.locator('button:has-text("Run"), a:has-text("Run"), [title="Run"]').first().click();
  await page.waitForLoadState('networkidle');

  // Wait for the job to finish (status changes to "OK" / "Finished").
  const statusCell = jobRow.locator('[class*="status"], td:last-child');
  await expect(statusCell).toContainText(/OK|Finished|Complete/i, { timeout: 120_000 });
}

// ── WebDAV helpers ────────────────────────────────────────────────────────────

async function getLatestFeedFile(feedArchivePath: string): Promise<{ filename: string; content: string }> {
  const ctx = await baseRequest.newContext({
    httpCredentials: { username: BM_USERNAME, password: BM_PASSWORD },
  });

  // PROPFIND to list directory contents.
  const propfind = await ctx.fetch(feedArchivePath + '/', {
    method: 'PROPFIND',
    headers: { Depth: '1', 'Content-Type': 'application/xml' },
    data: `<?xml version="1.0"?><propfind xmlns="DAV:"><prop><displayname/><getlastmodified/></prop></propfind>`,
  });
  const listXml = await propfind.text();

  // Find all googleshopping_HB-UK_*.xml filenames.
  const fileMatches = [...listXml.matchAll(/googleshopping_HB-UK_[^<"]+\.xml/g)];
  expect(fileMatches.length, 'No GoogleProductFeed XML file found in WebDAV archive').toBeGreaterThan(0);

  // Take the last match (most recent file after sort).
  const filename = fileMatches.at(-1)![0];

  const fileResp = await ctx.get(`${feedArchivePath}/${filename}`);
  const content  = await fileResp.text();
  await ctx.dispose();

  return { filename, content };
}

function parseSalePrice(feedXml: string): { productId: string; salePrice: string } | null {
  // Find the first item that has a g:sale_price tag.
  const itemMatch = feedXml.match(/<item>[\s\S]*?<g:sale_price>[\s\S]*?<\/item>/);
  if (!itemMatch) return null;

  const idMatch    = itemMatch[0].match(/<g:id>([^<]+)<\/g:id>/);
  const priceMatch = itemMatch[0].match(/<g:sale_price>([^<]+)<\/g:sale_price>/);

  if (!idMatch || !priceMatch) return null;
  return { productId: idMatch[1].trim(), salePrice: priceMatch[1].trim().replace(/[^0-9.]/g, '') };
}

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('TFGTRS-4345 - Google Product Feed sale price for Hobbs combined promotions', () => {

  test('TC-132898: sale price in GoogleProductFeed XML matches Hobbs PDP price', async ({ page }) => {
    // Step 1-3: Login to BM and run the GoogleProductFeed job.
    await loginToBM(page);
    await runBMJob(page, JOB_NAME, SITE_ID);

    // Step 4-8: Download the most recent feed XML from WebDAV and parse a sale price.
    const { content: feedXml } = await getLatestFeedFile(FEED_ARCHIVE_PATH);
    expect(feedXml.length, 'Feed XML file is empty').toBeGreaterThan(0);

    const parsed = parseSalePrice(feedXml);
    expect(parsed, 'No item with g:sale_price found in feed XML').not.toBeNull();

    const { productId, salePrice: feedPrice } = parsed!;

    // Step 9: Navigate to the product PDP on Hobbs staging.
    const pdpUrl = `${hobbsData.baseUrl}/product/${productId}`;
    await page.goto(pdpUrl);
    await page.waitForLoadState('networkidle');

    // Step 10: Compare g:sale_price with the displayed PDP price.
    const pdpPriceEl = page.locator(SALE_PRICE).first();
    await pdpPriceEl.waitFor({ timeout: 10_000 });

    const pdpPriceText = await pdpPriceEl.innerText();
    const pdpPrice     = pdpPriceText.replace(/[^0-9.]/g, '');

    expect(
      pdpPrice,
      `Feed sale price (${feedPrice}) does not match PDP price (${pdpPrice}) for product ${productId}`,
    ).toBe(feedPrice);
  });

});
