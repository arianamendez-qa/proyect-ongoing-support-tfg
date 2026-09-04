import { test, expect } from '@playwright/test';
import { hobbsData }    from '@data/hobbs.data';
import { whistlesData } from '@data/whistles.data';

const LOG_CENTER_URL      = process.env.LOG_CENTER_URL      ?? 'https://logcenter-eu.visibility.commercecloud.salesforce.com';
const LOG_CENTER_USERNAME = process.env.LOG_CENTER_USERNAME ?? '';
const LOG_CENTER_PASSWORD = process.env.LOG_CENTER_PASSWORD ?? '';

const PRODUCT_TILE = '.product-tile a, [class*="product-tile"] a, [class*="productTile"] a';

function trackConstructor400s(page: import('@playwright/test').Page): () => string[] {
  const failed: string[] = [];
  page.on('response', response => {
    if (/cnstrc\.com|constructor\.io/i.test(response.url()) && response.status() === 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  return () => failed;
}

async function navigateToPdp(page: import('@playwright/test').Page, plpUrl: string): Promise<void> {
  await page.goto(plpUrl);
  const tile = page.locator(PRODUCT_TILE).first();
  await tile.waitFor({ timeout: 15_000 });
  await tile.click();
  await page.waitForLoadState('networkidle');
}

test.describe('TFGTRS-4343 - No Constructor 400 errors on PDPs', () => {

  test('TC-132894: no Constructor 400 errors on Hobbs PDP', async ({ page }) => {
    const getErrors = trackConstructor400s(page);
    await navigateToPdp(page, `${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`);
    expect(getErrors(), 'Constructor returned 400 on Hobbs PDP').toHaveLength(0);
  });

  test('TC-132895: no Constructor 400 errors on Whistles PDP', async ({ page }) => {
    const getErrors = trackConstructor400s(page);
    await navigateToPdp(page, `${whistlesData.baseUrl}/search/show?q=${whistlesData.searchTerm}`);
    expect(getErrors(), 'Constructor returned 400 on Whistles PDP').toHaveLength(0);
  });

  test('TC-132897: Hobbs PDP loads fully with no visible errors', async ({ page }) => {
    await navigateToPdp(page, `${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`);
    await expect(page.locator('body')).not.toContainText(/something went wrong|error loading/i);
    const productImages = page.locator('.primary-images img, [class*="product-image"] img').first();
    await productImages.waitFor({ timeout: 10_000 });
    await expect(productImages).toBeVisible();
  });

  test('TC-132896: no Constructor item_id errors in Log Center for dev', async ({ page }) => {
    // Log in to Log Center.
    await page.goto(LOG_CENTER_URL);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name*="user" i], input[name*="email" i]').first();
    const passInput  = page.locator('input[type="password"]').first();
    const loginBtn   = page.locator('button[type="submit"], input[type="submit"]').first();

    await emailInput.fill(LOG_CENTER_USERNAME);
    await passInput.fill(LOG_CENTER_PASSWORD);
    await loginBtn.click();
    await page.waitForLoadState('networkidle');

    // Apply Tenant Type = dev filter.
    const tenantFilter = page.locator('select, [class*="filter"], [aria-label*="tenant" i]').first();
    if (await tenantFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tenantFilter.selectOption({ label: 'dev' }).catch(() => null);
    }

    // Apply Severity = error filter.
    const severityFilter = page.locator('[aria-label*="severity" i], select[name*="severity" i]').first();
    if (await severityFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await severityFilter.selectOption({ label: 'error' }).catch(() => null);
    }

    // Search for the specific error string.
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [class*="search-input"] input').first();
    await searchInput.fill('item_id: field required');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // No results should appear in the last 24 hours.
    const noResults = page.locator('[class*="no-result"], [class*="empty"], text=/no results|no logs|0 results/i').first();
    const resultsTable = page.locator('table tbody tr, [class*="log-row"], [class*="result-row"]');

    const hasNoResultsMsg = await noResults.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasNoResultsMsg) {
      const rowCount = await resultsTable.count();
      expect(rowCount, '"item_id: field required" errors found in Log Center').toBe(0);
    }
  });

});
