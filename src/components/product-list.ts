import type { Locator, Page } from '@playwright/test';
import { CATALOG } from '../pages/catalog.constants';
import type { CardEntry } from '../data/catalog-oracle';

// The product list of the dashboard (Spec 002, RF-1 to RF-4, RF-7): locators and reads only, no
// assertions. Verified on the live site on 2026-10-09: each card has a level-5 heading with the
// name, a "$ <price>" text, a "View" and an " Add To Cart" button.

export class ProductList {
  /** Every product card shown (CSS fallback, see CATALOG.CARD_SELECTOR). */
  readonly cards: Locator;
  readonly resultCounter: Locator;
  /** The card controls on the whole page, to prove an empty list has none (TC-002-04). */
  readonly allViewButtons: Locator;
  readonly allAddToCartButtons: Locator;

  constructor(readonly page: Page) {
    this.cards = page.locator(CATALOG.CARD_SELECTOR);
    this.resultCounter = page.getByText(CATALOG.RESULT_COUNTER_PATTERN);
    this.allViewButtons = page.getByRole('button', { name: CATALOG.VIEW_NAME });
    this.allAddToCartButtons = page.getByRole('button', { name: CATALOG.ADD_TO_CART_NAME });
  }

  viewButtonOf(card: Locator): Locator {
    return card.getByRole('button', { name: CATALOG.VIEW_NAME });
  }

  /** The card whose heading is exactly this stored product name (Spec 003 plan D-4). */
  cardNamed(name: string): Locator {
    return this.cards.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  /** Activates "View" on the card of this product (Spec 003 RF-1). */
  async view(name: string): Promise<void> {
    await this.viewButtonOf(this.cardNamed(name)).click();
  }

  addToCartButtonOf(card: Locator): Locator {
    return card.getByRole('button', { name: CATALOG.ADD_TO_CART_NAME });
  }

  /**
   * Name and price of every card shown, as `cardEntries` builds them from the catalog: names in
   * lower case, sorted by name (plan D-3). The heading's text content is the stored name; only CSS
   * shows it in upper case.
   */
  async entries(): Promise<CardEntry[]> {
    const cards = await this.cards.all();
    const entries = await Promise.all(
      cards.map(async (card) => {
        const name = (await card.getByRole('heading', { level: CATALOG.CARD_NAME_LEVEL }).textContent()) ?? '';
        const priceText = (await card.getByText(CATALOG.PRICE_PATTERN).textContent()) ?? '';
        const price = Number(CATALOG.PRICE_PATTERN.exec(priceText)?.[1] ?? Number.NaN);
        return { name: name.trim().toLowerCase(), price };
      }),
    );
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }
}
