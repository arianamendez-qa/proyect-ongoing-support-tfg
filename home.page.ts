import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { SearchResultsPage } from './search-results.page';

/**
 * HomePage — página de inicio.
 *
 * Compartida por Hobbs y Phase Eight (misma plataforma Salesforce Commerce
 * Cloud). El buscador es un input nativo de búsqueda con name="q".
 */
export class HomePage extends BasePage {
  readonly searchBox: Locator;

  constructor(page: Page) {
    super(page);
    // Hay varios inputs de búsqueda (desktop/mobile); usamos el primero visible.
    this.searchBox = page.getByRole('searchbox').first();
  }

  /** Abre la home y acepta el banner de cookies si aparece. */
  async open(): Promise<void> {
    await this.goto('/');
    await this.acceptCookiesIfPresent();
  }

  /**
   * Escribe un término y lanza la búsqueda.
   * Devuelve el Page Object de la página de resultados.
   */
  async search(term: string): Promise<SearchResultsPage> {
    await this.searchBox.waitFor({ state: 'visible' });
    await this.searchBox.fill(term);
    await this.searchBox.press('Enter');
    const results = new SearchResultsPage(this.page);
    await results.waitForLoaded();
    return results;
  }
}
