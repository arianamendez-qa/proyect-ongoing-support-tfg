import { test, expect } from '@playwright/test';
import { insideStoryData } from '@data/inside-story.data';

const PRODUCT_TILE  = '.product-tile a, [class*="product-tile"] a';
const SIZE_BTN      = '.size-btn:not(.unselectable), [class*="size"]:not([disabled])';
const PRIMARY_IMAGE = '.primary-image, [class*="primary-image"], .product-images img:first-child';
const ZOOM_OVERLAY  = '[class*="zoom"], .zoom-container, .zoom-overlay, [class*="viewer"]';
const ZOOM_CLOSE    = '[class*="zoom"] [class*="close"], [class*="zoom"] button[aria-label*="close" i], .zoom-close, [class*="close-zoom"]';
const HEADER        = 'header, .header, [class*="site-header"], [role="banner"]';

test.describe('TFGTRS-4101 - Product image zoom view on Inside Story mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  async function navigateToPdp(page: import('@playwright/test').Page) {
    const plpUrl = `${insideStoryData.baseUrl}/search/show?q=${insideStoryData.searchTerm}`;
    await page.goto(plpUrl);
    const tile = page.locator(PRODUCT_TILE).first();
    await tile.waitFor({ timeout: 15_000 });
    await tile.click();
    await page.waitForLoadState('networkidle');

    const size = page.locator(SIZE_BTN).first();
    if (await size.isVisible({ timeout: 2_000 }).catch(() => false)) await size.click();
  }

  test('TC-132885: zoom view opens without header overlapping', async ({ page }) => {
    await navigateToPdp(page);

    const image = page.locator(PRIMARY_IMAGE).first();
    await image.waitFor({ timeout: 10_000 });
    await image.tap();

    const zoom = page.locator(ZOOM_OVERLAY).first();
    await expect(zoom).toBeVisible({ timeout: 5_000 });

    // Header must not be on top of the zoom overlay.
    const header = page.locator(HEADER).first();
    if (await header.isVisible().catch(() => false)) {
      const headerBox = await header.boundingBox();
      const zoomBox   = await zoom.boundingBox();
      if (headerBox && zoomBox) {
        const overlap = headerBox.y + headerBox.height > zoomBox.y && headerBox.y < zoomBox.y + zoomBox.height;
        expect(overlap, 'Header is overlapping the zoom overlay').toBe(false);
      }
    }

    const closeBtn = page.locator(ZOOM_CLOSE).first();
    await expect(closeBtn).toBeVisible();

    const closeBtnBox  = await closeBtn.boundingBox();
    const headerHeight = (await page.locator(HEADER).first().boundingBox().catch(() => null))?.height ?? 0;
    if (closeBtnBox) {
      expect(closeBtnBox.y, 'Close icon is hidden behind the header').toBeGreaterThanOrEqual(headerHeight);
    }
  });

  test('TC-132886: X icon closes zoom view', async ({ page }) => {
    await navigateToPdp(page);

    const image = page.locator(PRIMARY_IMAGE).first();
    await image.waitFor({ timeout: 10_000 });
    await image.tap();

    const zoom = page.locator(ZOOM_OVERLAY).first();
    await expect(zoom).toBeVisible({ timeout: 5_000 });

    await page.locator(ZOOM_CLOSE).first().tap();
    await expect(zoom).not.toBeVisible({ timeout: 5_000 });

    // Product page must still render correctly.
    await expect(page.locator(PRIMARY_IMAGE).first()).toBeVisible();
  });

  test('TC-132887: double-tap closes zoom view', async ({ page }) => {
    await navigateToPdp(page);

    const image = page.locator(PRIMARY_IMAGE).first();
    await image.waitFor({ timeout: 10_000 });
    await image.tap();

    const zoom = page.locator(ZOOM_OVERLAY).first();
    await expect(zoom).toBeVisible({ timeout: 5_000 });

    // Double-tap the zoomed image.
    const zoomedImg = zoom.locator('img').first();
    const target    = (await zoomedImg.isVisible().catch(() => false)) ? zoomedImg : zoom;
    await target.dblclick();
    await page.waitForTimeout(600);

    await expect(zoom).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator(PRIMARY_IMAGE).first()).toBeVisible();
  });

});
