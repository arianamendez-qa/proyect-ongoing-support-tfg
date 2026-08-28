import { test, expect } from '@playwright/test';
import { hobbsData } from '@data/hobbs.data';

const plpUrl = `${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`;

// Broad selector — covers SFCC badge patterns regardless of exact class naming.
const BADGES = '.badge, [class*="badge"], [class*="Badge"]';

const VIEWPORTS = [
  { label: '1280px', width: 1280, height: 800 },
  { label: '1024px', width: 1024, height: 768 },
  { label: '375px',  width: 375,  height: 812 },
];

test.describe('TFGTRS-4085 - Badge styling on Hobbs PLP', () => {

  test('TC-130797: badges are visible and consistent at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(plpUrl);

    const badges = page.locator(BADGES);
    await badges.first().waitFor();

    for (const badge of await badges.all()) {
      await expect(badge).toBeVisible();
      const box = await badge.boundingBox();
      expect(box?.width, 'Badge has no width — text may be cut off').toBeGreaterThan(0);
      expect(box?.height, 'Badge has no height').toBeGreaterThan(0);
    }
  });

  test('TC-130798: badge text is not oversized at 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(plpUrl);

    const badges = page.locator(BADGES);
    await badges.first().waitFor();

    // Each badge must be fully inside its parent product tile (no overflow).
    for (const badge of await badges.all()) {
      await expect(badge).toBeVisible();
      const badgeBox  = await badge.boundingBox();
      const parentBox = await badge.locator('..').boundingBox();
      if (badgeBox && parentBox) {
        expect(badgeBox.x, 'Badge overflows left edge of tile').toBeGreaterThanOrEqual(parentBox.x - 1);
        expect(badgeBox.x + badgeBox.width, 'Badge overflows right edge of tile').toBeLessThanOrEqual(parentBox.x + parentBox.width + 1);
      }
    }
  });

  test('TC-130799: badges are visible on mobile at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(plpUrl);

    const badges = page.locator(BADGES);
    await badges.first().waitFor();

    for (const badge of await badges.all()) {
      await expect(badge).toBeVisible();
    }
  });

  test('TC-130800: at least one badge is visible at every breakpoint', async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(plpUrl);

      const badges = page.locator(BADGES);
      await badges.first().waitFor();
      expect(
        await badges.count(),
        `No badges found at ${vp.label}`,
      ).toBeGreaterThan(0);
    }
  });

});
