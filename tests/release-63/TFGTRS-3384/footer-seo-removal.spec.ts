import { test, expect } from '@playwright/test';
import { whistlesData } from '@data/whistles.data';

test.describe('TFGTRS-3384 - Whistles Footer: SEO copy removed', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(whistlesData.baseUrl);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test('SEO test copy is no longer visible in the footer on any breakpoint', async ({ page }) => {
    const footer = page.locator('footer, .footer');
    await footer.waitFor();

    // Verify the SEO-specific container that was flagged (red-highlighted in ticket) is gone.
    // SFCC typically renders SEO copy inside a dedicated slot or div.
    const seoCopy = footer.locator(
      '[class*="seo-copy"], [class*="seoCopy"], [class*="footer-seo"], [data-content-type="seo"]',
    );
    await expect(seoCopy).toHaveCount(0);

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 768,  height: 1024 },
      { width: 375,  height: 812 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(seoCopy).toHaveCount(0);
    }
  });

  test('Standard footer content is intact after SEO copy removal', async ({ page }) => {
    const footer = page.locator('footer, .footer');
    await footer.waitFor();

    // Footer navigation links must still be present.
    await expect(footer.locator('a')).not.toHaveCount(0);

    // Newsletter signup must still be present.
    const newsletter = footer.locator('[class*="newsletter"], input[type="email"]');
    await expect(newsletter.first()).toBeVisible();

    // Social icons must still be present.
    const socialIcons = footer.locator('[class*="social"] a, [aria-label*="Instagram" i], [aria-label*="Facebook" i]');
    await expect(socialIcons.first()).toBeVisible();

    // Legal / copyright text must still be present.
    const legal = footer.locator('[class*="copyright"], [class*="legal"]');
    await expect(legal.first()).toBeVisible();
  });

});
