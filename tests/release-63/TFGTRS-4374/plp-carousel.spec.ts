import { test, expect } from '@playwright/test';
import { hobbsData } from '@data/hobbs.data';

// Any TFG brand PLP works for this ticket; using Hobbs as the representative brand.
const plpUrl = `${hobbsData.baseUrl}/search/show?q=${hobbsData.searchTerm}`;

const CAROUSEL     = '[class*="recommendation"] [class*="carousel"], [class*="recommendation"] .slick-slider, [class*="recommendation"] .swiper';
const ARROW_NEXT   = '.slick-next, .swiper-button-next, [class*="arrow"][class*="next" i], [aria-label*="Next" i]';
const ARROW_PREV   = '.slick-prev, .swiper-button-prev, [class*="arrow"][class*="prev" i], [aria-label*="Previous" i]';
const PRODUCT_TILE = '.slick-active .product-tile, .swiper-slide-active [class*="product-tile"]';

test.describe('TFGTRS-4374 - PLP Carousel: recommendation arrows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(plpUrl);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test('right arrow navigates to the next set of recommended products', async ({ page }) => {
    const carousel = page.locator(CAROUSEL).first();
    await carousel.waitFor({ timeout: 15_000 });

    // Record the text of the first visible tile before clicking.
    const firstTile = page.locator(PRODUCT_TILE).first();
    await firstTile.waitFor();
    const textBefore = await firstTile.innerText().catch(() => '');

    const nextBtn = carousel.locator(ARROW_NEXT).first();
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(600);

    const textAfter = await firstTile.innerText().catch(() => '');
    expect(textAfter).not.toBe(textBefore);
  });

  test('carousel arrows are clickable multiple times without JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    const carousel = page.locator(CAROUSEL).first();
    await carousel.waitFor({ timeout: 15_000 });

    const nextBtn = carousel.locator(ARROW_NEXT).first();
    const prevBtn = carousel.locator(ARROW_PREV).first();

    await nextBtn.click();
    await page.waitForTimeout(400);
    await nextBtn.click();
    await page.waitForTimeout(400);
    await prevBtn.click();
    await page.waitForTimeout(400);

    const carouselErrors = jsErrors.filter(e => /carousel|slider|swiper|slick/i.test(e));
    expect(carouselErrors, `Carousel JS errors: ${carouselErrors.join(', ')}`).toHaveLength(0);
  });

});
