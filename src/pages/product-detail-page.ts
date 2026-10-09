import type { Locator, Page, Response } from '@playwright/test';
import { PRODUCT_DETAIL_PATH, buildProductDetailRoute } from '../config/urls';
import { API_TIMEOUT_MS, NAVIGATION_TIMEOUT_MS } from '../config/timeouts';
import { PRODUCT_DETAIL } from './product-detail.constants';

// Page Object of the product detail page (Spec 003, RF-1 to RF-10): locators and actions only, no
// assertions. Verified on the live site on 2026-10-09: the name is the only level-2 heading, the
// price a level-3 heading "$ <price>", the description the paragraph under the "product details"
// heading, and the alerts are toasts with role `alert` whose text is their accessible name.

/** An empty document: leaving the shop for it makes the next detail route load as a new page. */
const BLANK_PAGE = 'about:blank';

export class ProductDetailPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly addToCartButton: Locator;
  readonly continueShoppingLink: Locator;
  /** Any alert (toast) on the page. */
  readonly alert: Locator;

  constructor(
    readonly page: Page,
    private readonly baseUrl: string,
  ) {
    this.name = page.getByRole('heading', { level: PRODUCT_DETAIL.NAME_LEVEL });
    this.price = page.getByRole('heading', { level: PRODUCT_DETAIL.PRICE_LEVEL, name: PRODUCT_DETAIL.PRICE_NAME });
    this.description = page.getByRole('heading', { name: PRODUCT_DETAIL.DESCRIPTION_HEADING, exact: true }).locator('..').getByRole('paragraph');
    this.addToCartButton = page.getByRole('button', { name: PRODUCT_DETAIL.ADD_TO_CART_NAME, exact: true });
    this.continueShoppingLink = page.getByRole('link', { name: PRODUCT_DETAIL.CONTINUE_SHOPPING_NAME });
    this.alert = page.getByRole('alert');
  }

  /**
   * The answer of the product detail API for `id`; call it before the action that loads the page,
   * so the test can tie the page to the requested product (plan D-4).
   */
  answerFor(id: string): Promise<Response> {
    const suffix = `${PRODUCT_DETAIL_PATH}/${encodeURIComponent(id)}`;
    return this.page.waitForResponse((response) => response.url().endsWith(suffix), { timeout: API_TIMEOUT_MS });
  }

  /** The alert whose text (accessible name) is exactly `text`, e.g. "Product not found" (RF-9). */
  alertNamed(text: string): Locator {
    return this.page.getByRole('alert', { name: text, exact: true });
  }

  /** Activates "Add to Cart" on the detail page (Spec 004 RF-4). */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  /** Returns to the catalog with the "Continue Shopping" link (RF-6). */
  async continueShopping(): Promise<void> {
    await this.continueShoppingLink.click();
  }

  /**
   * Opens the detail route of `id` as a new page load (plan D-3): changing only the URL hash kept the
   * previous product on screen (observed), so the page first leaves for `about:blank`. The session
   * lives in local storage and survives (verified on chromium, firefox and webkit, 2026-10-09).
   */
  async open(id: string): Promise<void> {
    await this.page.goto(BLANK_PAGE);
    await this.page.goto(buildProductDetailRoute(this.baseUrl, id), { timeout: NAVIGATION_TIMEOUT_MS });
  }
}
