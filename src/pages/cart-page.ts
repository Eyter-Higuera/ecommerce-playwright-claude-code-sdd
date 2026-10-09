import type { Locator, Page, Response } from '@playwright/test';
import { CART_API_PATHS, buildCartUrl } from '../config/urls';
import { API_TIMEOUT_MS, NAVIGATION_TIMEOUT_MS } from '../config/timeouts';
import { CART } from './cart.constants';

// Page Object of the cart page (Spec 004, RF-6 to RF-13): locators and actions only, no assertions.
// Verified on the live site on 2026-10-09: each line is a list item with a level-3 heading (the
// name), "MRP $ <price>", "In Stock", "$ <price>", "Buy Now" and an icon-only remove button; the
// totals are list items "Subtotal $<sum>" and "Total $<sum>".

export class CartPage {
  readonly url: string;
  /** Every cart line: a list item that holds a product name heading. */
  readonly lines: Locator;
  readonly subtotal: Locator;
  readonly total: Locator;
  readonly emptyMessage: Locator;
  readonly continueShoppingButton: Locator;

  constructor(
    readonly page: Page,
    baseUrl: string,
  ) {
    this.url = buildCartUrl(baseUrl);
    this.lines = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: CART.LINE_NAME_LEVEL }) });
    this.subtotal = page.getByRole('listitem').filter({ hasText: CART.SUBTOTAL_PATTERN });
    this.total = page.getByRole('listitem').filter({ hasText: CART.TOTAL_PATTERN });
    this.emptyMessage = page.getByRole('heading', { name: CART.EMPTY_MESSAGE, exact: true });
    this.continueShoppingButton = page.getByRole('button', { name: CART.CONTINUE_SHOPPING_NAME });
  }

  /** Opens the cart route; without a session the shop redirects to the login route (RF-15). */
  async open(): Promise<void> {
    await this.page.goto(this.url, { timeout: NAVIGATION_TIMEOUT_MS });
  }

  /**
   * The answer of the next add-to-cart request; call it before the UI action that adds a product, so
   * the test asserts only after the server has answered (plan D-7).
   */
  addAnswer(): Promise<Response> {
    return this.page.waitForResponse((response) => response.url().includes(CART_API_PATHS.ADD), { timeout: API_TIMEOUT_MS });
  }

  /** The answer of the next remove-from-cart request; call it before the UI removal (plan D-7). */
  removeAnswer(): Promise<Response> {
    return this.page.waitForResponse((response) => response.url().includes(CART_API_PATHS.REMOVE), { timeout: API_TIMEOUT_MS });
  }

  /** The remove control of a product's line: CSS fallback, it has no accessible name (RF-12, plan D-6). */
  removeButtonOf(name: string): Locator {
    return this.lineNamed(name).locator(CART.REMOVE_BUTTON_SELECTOR);
  }

  /** Removes a product with the remove control of its line (RF-10). */
  async remove(name: string): Promise<void> {
    await this.removeButtonOf(name).click();
  }

  /** The line of the product with this stored name. */
  lineNamed(name: string): Locator {
    return this.lines.filter({ has: this.page.getByRole('heading', { level: CART.LINE_NAME_LEVEL, name, exact: true }) });
  }

  /** The price text of a product's line ("$ 11500", not "MRP $ 11500"). */
  priceOf(name: string): Locator {
    return this.lineNamed(name).getByText(CART.LINE_PRICE_PATTERN);
  }

  /** Returns to the dashboard with the "Continue Shopping" button (RF-9). */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
