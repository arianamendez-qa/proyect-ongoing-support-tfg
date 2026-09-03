import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ProductDetailPage } from './product-detail.page';

/**
 * SearchResultsPage — página de resultados de búsqueda (/search/?q=...).
 */
export class SearchResultsPage extends BasePage {
  readonly grid: Locator;
  readonly productTiles: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    super(page);
    this.grid = page.locator('.product-grid').first();
    // Excluye tiles de Constructor.io (recomendaciones ocultas en el DOM)
    this.productTiles = page.locator('.product-tile:not([data-cnstrc-item])');
    this.resultCount = page.locator('.filters__result-count').first();
  }

  async waitForLoaded(): Promise<void> {
    await this.productTiles.first().waitFor({ state: 'visible' });
  }

  async getProductCount(): Promise<number> {
    return this.productTiles.count();
  }

  async getResultCountText(): Promise<string> {
    return (await this.resultCount.textContent())?.trim() ?? '';
  }

  /** Navega al primer producto via href para evitar el hover effect del tile. */
  async clickFirstProduct(): Promise<ProductDetailPage> {
    await this.dismissModalsIfPresent();
    const href = await this.productTiles.first().locator('a').first().getAttribute('href');
    const absoluteUrl = new URL(href!, this.page.url()).toString();
    await this.page.goto(absoluteUrl);
    const pdp = new ProductDetailPage(this.page);
    await pdp.waitForLoaded();
    return pdp;
  }
}
