import { test, expect } from '@playwright/test';
import { phaseEightData } from '@data/phase-eight.data';

// Phase Eight search results carry filter refinements — same rel="nofollow" requirement.
// Uses search URL to avoid hardcoding a category cgid that may vary per environment.
const plpUrl = `${phaseEightData.baseUrl}/search/show?q=${phaseEightData.searchTerm}`;

// Matches all <a> tags inside the refinements panel regardless of the exact SFCC class names.
const FILTER_LINKS = '.refinements a[href], [class*="refinement"] a[href]';

test.describe('TFGTRS-4335 - Filter links have rel=nofollow on Phase Eight PLP', () => {

  test('TC-128477: single filter selection links have rel=nofollow', async ({ page }) => {
    await page.goto(plpUrl);
    const links = page.locator(FILTER_LINKS);
    await links.first().waitFor();

    for (const link of await links.all()) {
      const rel = await link.getAttribute('rel') ?? '';
      expect(rel, `link ${await link.getAttribute('href')} is missing rel="nofollow"`).toContain('nofollow');
    }
  });

  test('TC-128478: nofollow persists after applying multiple filters', async ({ page }) => {
    await page.goto(plpUrl);
    const links = page.locator(FILTER_LINKS);
    await links.first().waitFor();

    // Apply the first available filter
    await links.first().click();
    await page.waitForLoadState('networkidle');

    const linksAfter = page.locator(FILTER_LINKS);
    await linksAfter.first().waitFor();

    for (const link of await linksAfter.all()) {
      const rel = await link.getAttribute('rel') ?? '';
      expect(rel, `rel="nofollow" missing after filter applied`).toContain('nofollow');
    }
  });

  test('TC-128480: nofollow is present across all filter types', async ({ page }) => {
    await page.goto(plpUrl);
    const links = page.locator(FILTER_LINKS);
    await links.first().waitFor();

    const count = await links.count();
    expect(count, 'No filter links found on the page').toBeGreaterThan(0);

    for (const link of await links.all()) {
      const rel = await link.getAttribute('rel') ?? '';
      expect(rel).toContain('nofollow');
    }
  });

});
