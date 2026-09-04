import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postcode: string;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
}

/**
 * CheckoutPage — flujo de checkout multi-paso de SFCC SFRA.
 *
 * Pasos:
 *   1. Identificación de cliente (guest email)
 *   2. Dirección de envío
 *   3. Método de envío
 *   4. Pago (Adyen — solo en staging)
 */
export class CheckoutPage extends BasePage {
  // Step 1 — guest email
  readonly emailInput: Locator;
  readonly guestCheckoutButton: Locator;

  // Step 2 — shipping address
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly address1Input: Locator;
  readonly cityInput: Locator;
  readonly postcodeInput: Locator;
  readonly submitShippingButton: Locator;

  // Step 3 — shipping method
  readonly submitShippingMethodButton: Locator;

  // Step 4 — payment summary (Adyen iframes)
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input#email-guest, input[name="loginEmail"]').first();
    this.guestCheckoutButton = page.locator('button[value="submit-customer"], .btn.submit-customer-login, button.btn.btn-primary.btn-block.guest').first();

    // SFCC SFRA usa IDs con sufijo "default" para la primera dirección de envío
    this.firstNameInput = page.locator('#shippingFirstNamedefault, input[name="firstName"]').first();
    this.lastNameInput = page.locator('#shippingLastNamedefault, input[name="lastName"]').first();
    this.address1Input = page.locator('#shippingAddressOnedefault, input[name="address1"]').first();
    this.cityInput = page.locator('#shippingAddressCitydefault, input[name="city"]').first();
    this.postcodeInput = page.locator('#shippingZipCodedefault, input[name="postalCode"]').first();
    this.submitShippingButton = page.locator('button.submit-shipping').first();

    this.submitShippingMethodButton = page.locator('button.submit-shipping-method, button[data-action="submit-shipping-method"]').first();

    this.placeOrderButton = page.locator('button.place-order, button[data-action="placeOrder"]').first();
  }

  /** Continúa como guest con el email indicado. */
  async continueAsGuest(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.fill(email);
    await this.guestCheckoutButton.click();
  }

  /** Rellena y envía el formulario de dirección de envío. */
  async fillShippingAddress(address: ShippingAddress): Promise<void> {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.address1Input.fill(address.address1);
    await this.cityInput.fill(address.city);
    await this.postcodeInput.fill(address.postcode);
    await this.submitShippingButton.click();
  }

  /** Confirma el método de envío (selecciona el primero por defecto). */
  async submitShippingMethod(): Promise<void> {
    // El método de envío por defecto suele estar ya seleccionado
    await this.submitShippingMethodButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitShippingMethodButton.click();
  }

  /**
   * Rellena los campos de tarjeta de Adyen (iframes).
   * Los campos de Adyen se renderizan dentro de iframes independientes.
   */
  async fillAdyenCard(card: CardDetails): Promise<void> {
    // iframe del número de tarjeta
    const cardNumberFrame = this.page.frameLocator('[data-fieldtype="encryptedCardNumber"] iframe, .adyen-checkout__card__cardNumber__input iframe').first();
    await cardNumberFrame.locator('input[data-fieldtype="encryptedCardNumber"], input').first().fill(card.number);

    // iframe de la fecha de expiración
    const expiryFrame = this.page.frameLocator('[data-fieldtype="encryptedExpiryDate"] iframe, .adyen-checkout__card__exp-date__input iframe').first();
    await expiryFrame.locator('input[data-fieldtype="encryptedExpiryDate"], input').first().fill(card.expiry);

    // iframe del CVV
    const cvvFrame = this.page.frameLocator('[data-fieldtype="encryptedSecurityCode"] iframe, .adyen-checkout__card__cvc__input iframe').first();
    await cvvFrame.locator('input[data-fieldtype="encryptedSecurityCode"], input').first().fill(card.cvv);
  }

  /** Verifica que el botón de pago es visible (último paso antes de pagar). */
  async isPlaceOrderVisible(): Promise<boolean> {
    try {
      await this.placeOrderButton.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /** Confirma el pedido (solo usar en staging). */
  async placeOrder(): Promise<void> {
    await this.placeOrderButton.waitFor({ state: 'visible' });
    await this.placeOrderButton.click();
  }
}
