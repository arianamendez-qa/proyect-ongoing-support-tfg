import { test, expect } from '@playwright/test';
import { phaseEightData } from '@data/phase-eight.data';

const SEARCH_ICON  = '.site-search button, [class*="search-icon"], button[aria-label*="search" i], [class*="header"] [class*="search"] button';
const SEARCH_INPUT = 'input[name="q"], input[type="search"], .search-field input, [class*="search-bar"] input';
const CLOSE_BTN    = '[class*="search-close"], [class*="close-search"], button[aria-label*="close" i], [class*="search"] [class*="cross"], [class*="search"] button[class*="close"]';
const AUTOSUGGEST  = '[class*="suggestions"], [class*="autosuggest"], [class*="typeahead"], [class*="search-result"]';

const PAGES = {
  footerHygiene : `${phaseEightData.baseUrl}/here-to-help`,
  signIn        : `${phaseEightData.baseUrl}/login`,
  storeLocator  : `${phaseEightData.baseUrl}/stores`,
  wishlist      : `${phaseEightData.baseUrl}/wishlist`,
  bag           : `${phaseEightData.baseUrl}/cart`,
  myOrders      : `${phaseEightData.baseUrl}/account/orders`,
  myDetails     : `${phaseEightData.baseUrl}/account/profile`,
};

async function openSearchBar(page: import('@playwright/test').Page) {
  await page.locator(SEARCH_ICON).first().click();
  await page.locator(SEARCH_INPUT).first().waitFor({ timeout: 5_000 });
}

async function assertSearchBarVisible(page: import('@playwright/test').Page) {
  const input = page.locator(SEARCH_INPUT).first();
  await expect(input).toBeVisible();
  const closeBtn = page.locator(CLOSE_BTN).first();
  await expect(closeBtn).toBeVisible();
}

// ── Mobile 375px ──────────────────────────────────────────────────────────────

test.describe('TFGTRS-4285 - Search UI (Mobile 375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('search icon opens exposed search bar on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);

    const input = page.locator(SEARCH_INPUT).first();
    const inputBox = await input.boundingBox();
    expect(inputBox?.x, 'Search bar has no left margin').toBeGreaterThan(0);
    expect((inputBox?.x ?? 0) + (inputBox?.width ?? 0), 'Search bar has no right margin').toBeLessThan(375);
  });

  test('cross icon closes exposed search bar on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);

    await page.locator(CLOSE_BTN).first().click();
    await expect(page.locator(SEARCH_INPUT).first()).not.toBeVisible({ timeout: 3_000 });
  });

  test('typing a search term shows autosuggest on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await page.locator(SEARCH_INPUT).first().fill('dress');

    await expect(page.locator(AUTOSUGGEST).first()).toBeVisible({ timeout: 5_000 });
  });

  test('search icon opens exposed search bar on Sign In / Register page', async ({ page }) => {
    await page.goto(PAGES.signIn);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

  test('search component displays correctly on Store Locator page', async ({ page }) => {
    await page.goto(PAGES.storeLocator);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

  test('search component displays correctly on Wishlist page', async ({ page }) => {
    await page.goto(PAGES.wishlist);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

  test('search component displays correctly on Bag/Basket page', async ({ page }) => {
    await page.goto(PAGES.bag);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

  test('search component displays correctly on My Orders page', async ({ page }) => {
    await page.goto(PAGES.myOrders);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

  test('search component displays correctly on My Details page', async ({ page }) => {
    await page.goto(PAGES.myDetails);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

});

// ── Tablet portrait 768px ─────────────────────────────────────────────────────

test.describe('TFGTRS-4285 - Search UI (Tablet portrait 768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('search icon opens exposed search bar on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

});

// ── Tablet landscape 1024px ───────────────────────────────────────────────────

test.describe('TFGTRS-4285 - Search UI (Tablet landscape 1024px)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('search icon opens exposed search bar on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

});

// ── Desktop 1280px ────────────────────────────────────────────────────────────

test.describe('TFGTRS-4285 - Search UI (Desktop 1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('search icon opens exposed search bar on footer hygiene page', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);
    await assertSearchBarVisible(page);

    const input = page.locator(SEARCH_INPUT).first();
    const inputBox = await input.boundingBox();
    expect(inputBox?.width, 'Search bar width too narrow at 1280px').toBeGreaterThan(200);
  });

  test('cross icon sits next to search bar (not in header) at 1280px', async ({ page }) => {
    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');

    await openSearchBar(page);

    const input = page.locator(SEARCH_INPUT).first();
    const closeBtn = page.locator(CLOSE_BTN).first();

    const inputBox  = await input.boundingBox();
    const closeBox  = await closeBtn.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(closeBox).not.toBeNull();

    // Cross must be horizontally adjacent to the search bar, not above it in the header row.
    const verticalDiff = Math.abs((closeBox!.y + closeBox!.height / 2) - (inputBox!.y + inputBox!.height / 2));
    expect(verticalDiff, 'Cross icon is not vertically aligned with search bar').toBeLessThan(50);
  });

});

// ── Cross-page behaviour ──────────────────────────────────────────────────────

test.describe('TFGTRS-4285 - Search UI: cross-page behaviour', () => {

  test('no console errors on search interaction across sitewide pages', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    const pagesToTest = [
      PAGES.footerHygiene,
      PAGES.signIn,
      PAGES.bag,
    ];

    for (const url of pagesToTest) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await openSearchBar(page);
      await page.locator(CLOSE_BTN).first().click().catch(() => null);
      await page.waitForTimeout(300);
    }

    const searchErrors = jsErrors.filter(e => /search|autosuggest|typeahead/i.test(e));
    expect(searchErrors, `Search JS errors: ${searchErrors.join(' | ')}`).toHaveLength(0);
  });

  test('search bar behaves consistently when navigating between sitewide pages', async ({ page }) => {
    test.use({ viewport: { width: 375, height: 812 } });

    await page.goto(PAGES.footerHygiene);
    await page.waitForLoadState('networkidle');
    await openSearchBar(page);
    await assertSearchBarVisible(page);

    await page.goto(PAGES.signIn);
    await page.waitForLoadState('networkidle');
    await openSearchBar(page);
    await assertSearchBarVisible(page);
  });

});
