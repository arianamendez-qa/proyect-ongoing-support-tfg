import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ProductDetailPage } from './product-detail.page';

/**
 * ProductListPage (PLP) — página de listado de productos.
 *
 * Compartida por todas las marcas (misma plataforma SFCC SFRA).
 */
export class ProductListPage extends BasePage {
  readonly productTiles: Locator;

  constructor(page: Page) {
    super(page);
    this.productTiles = page.locator('.product-tile');
  }

  /** Espera a que al menos un producto sea visible. */
  async waitForLoaded(): Promise<void> {
    await this.productTiles.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Número de productos visibles en el listado. */
  async getProductCount(): Promise<number> {
    return this.productTiles.count();
  }

  /** Navega al primer producto y devuelve la PDP. */
  async clickFirstProduct(): Promise<ProductDetailPage> {
    await this.productTiles.first().locator('a').first().click();
    const pdp = new ProductDetailPage(this.page);
    await pdp.waitForLoaded();
    return pdp;
  }
}
