import { isDeepStrictEqual } from 'node:util';
import type { Locator, Page, Response } from '@playwright/test';
import { PRODUCT_LIST_PATH } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import { EMPTY_CRITERIA, type ProductCriteria } from '../data/catalog-oracle';
import type { ConflictingCriterion, FilterGroup } from '../data/catalog-data';
import { CATALOG } from '../pages/catalog.constants';

// The filter panel of the dashboard (Spec 002, RF-5 to RF-16): locators and actions only, no
// assertions. The panel is rendered twice (desktop and mobile layouts) and only one copy is visible,
// so every control is scoped to the visible copy (verified 2026-10-09).
//
// Plan D-4: each change of a control sends its own product API request, so an action resolves only
// when the answer to the criteria it is expected to send has arrived. The panel keeps those
// criteria in `criteria`; tests give them to the oracle. If the shop sends other criteria than the
// model expects, the wait times out and the test fails: a difference to report, not to hide.

export class FilterPanel {
  readonly panel: Locator;
  readonly searchInput: Locator;
  readonly minPriceInput: Locator;
  readonly maxPriceInput: Locator;
  private current: ProductCriteria = EMPTY_CRITERIA;
  /** The text last committed in each price input; a request is sent only when it changes. */
  private typedBounds: Record<PriceField, string> = { ...EMPTY_BOUNDS };

  constructor(readonly page: Page) {
    this.panel = page.locator('form').filter({ visible: true, has: page.getByPlaceholder(CATALOG.SEARCH_PLACEHOLDER, { exact: true }) });
    this.searchInput = this.panel.getByPlaceholder(CATALOG.SEARCH_PLACEHOLDER, { exact: true });
    this.minPriceInput = this.panel.getByPlaceholder(CATALOG.MIN_PRICE_PLACEHOLDER, { exact: true });
    this.maxPriceInput = this.panel.getByPlaceholder(CATALOG.MAX_PRICE_PLACEHOLDER, { exact: true });
  }

  /** The criteria of the last answered request, as the shop sent them. */
  get criteria(): ProductCriteria {
    return this.current;
  }

  /** Runs `open` (a page load) and waits for its unfiltered product answer; criteria start empty. */
  async load(open: () => Promise<void>): Promise<void> {
    await this.apply(EMPTY_CRITERIA, open);
    this.typedBounds = { ...EMPTY_BOUNDS };
  }

  /** Types the search text and submits it with Enter (verified 2026-10-09: one request per submit). */
  async search(text: string): Promise<void> {
    await this.apply({ ...this.current, productName: text }, async () => {
      await this.searchInput.fill(text);
      await this.searchInput.press(CATALOG.SUBMIT_KEY);
    });
  }

  /**
   * Types the minimum, then the maximum, committing each with Enter and waiting for its answer
   * before the next, as a customer would. Verified 2026-10-09: a bound is sent on its `change`
   * event (Enter or leaving the field) whenever its text changed, even if the body stays the same,
   * and an unchanged text sends nothing. The panel sends a bound that is not a number as `null`
   * (observed), which is how RF-11 holds in the UI; `''` clears a bound.
   *
   * Committing both bounds without waiting sends two requests at once, and on firefox the shop
   * then rendered the answer that arrived last, the intermediate one (T15 finding).
   */
  async setPriceRange(min: string, max: string): Promise<void> {
    await this.commitBound(this.minPriceInput, 'minPrice', min);
    await this.commitBound(this.maxPriceInput, 'maxPrice', max);
  }

  /** Clears both price bounds. */
  async clearPriceRange(): Promise<void> {
    await this.setPriceRange('', '');
  }

  /**
   * The check box of an option. Its label is not linked to it (`for` names no id, verified
   * 2026-10-09), so it has no accessible name: it is the check box next to the exact option text.
   */
  optionCheckbox(option: string): Locator {
    return this.panel.getByText(option, { exact: true }).locator('..').getByRole('checkbox');
  }

  /**
   * Selects or clears one option of a group. The shop sends a request at once, with the option
   * appended to the group's list or removed from it (verified 2026-10-09).
   */
  async toggleOption(group: FilterGroup, option: string): Promise<void> {
    const selected = this.current[group.field];
    const next = selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option];
    await this.apply({ ...this.current, [group.field]: next }, async () => {
      await this.optionCheckbox(option).click();
    });
  }

  /** Adds one criterion of another product: an option, or its price as both bounds (TC-002-23). */
  async addCriterion(criterion: ConflictingCriterion): Promise<void> {
    if (criterion.kind === 'option') {
      await this.toggleOption(criterion.group, criterion.option);
      return;
    }
    await this.setPriceRange(String(criterion.price), String(criterion.price));
  }

  /** Types one bound and commits it with Enter, waiting for its answer; nothing if its text is unchanged. */
  private async commitBound(input: Locator, field: PriceField, text: string): Promise<void> {
    if (text === this.typedBounds[field]) return;
    await this.apply({ ...this.current, [field]: sentBound(text) }, async () => {
      await input.fill(text);
      await input.press(CATALOG.SUBMIT_KEY);
    });
    this.typedBounds[field] = text;
  }

  /** Runs `act` and waits for the product API answer to exactly `expected` (plan D-4). */
  private async apply(expected: ProductCriteria, act: () => Promise<void>): Promise<void> {
    const answer = this.page.waitForResponse((response) => isProductAnswerFor(response, expected), { timeout: API_TIMEOUT_MS });
    await act();
    await answer;
    this.current = expected;
  }
}

/** The two price fields of the criteria. */
type PriceField = 'minPrice' | 'maxPrice';

/** Both price inputs empty, as on page load. */
const EMPTY_BOUNDS: Readonly<Record<PriceField, string>> = { minPrice: '', maxPrice: '' };

/** A typed integer, optionally negative: the only text the panel sends as a number (observed). */
const NUMERIC_BOUND = /^-?\d+$/;

/** The value the panel sends for a typed price bound: a number, or `null` for anything else. */
function sentBound(typed: string): number | null {
  return NUMERIC_BOUND.test(typed) ? Number(typed) : null;
}

/** True for the product API answer whose request body equals the criteria. */
function isProductAnswerFor(response: Response, criteria: ProductCriteria): boolean {
  if (!response.url().endsWith(PRODUCT_LIST_PATH)) return false;
  const body = response.request().postDataJSON() as unknown;
  return isDeepStrictEqual(body, criteria);
}
