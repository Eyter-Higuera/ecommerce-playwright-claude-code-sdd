// UI texts of the catalog on the dashboard (Spec 002), verified on the live site on 2026-10-09.

export const CATALOG = {
  /**
   * The product card has no role or test id (verified 2026-10-09), so this class selector is the
   * only CSS fallback of the catalog; everything inside a card is located by role.
   */
  CARD_SELECTOR: '.card-body',
  /** Card name: a level-5 heading; the UI shows it in upper case through CSS (RF-2). */
  CARD_NAME_LEVEL: 5,
  /** "View" and " Add To Cart": the second name starts with an icon glyph. */
  VIEW_NAME: /^\W*View$/,
  ADD_TO_CART_NAME: /^\W*Add To Cart$/,
  /** Card price text, e.g. "$ 11500": the number after the currency sign. */
  PRICE_PATTERN: /\$\s*([\d.]+)/,
  /** "Showing N results |" above the list (RF-4). */
  RESULT_COUNTER_PATTERN: /Showing \d+ results/,
  /** Filter panel inputs have placeholders and no label (verified 2026-10-09). */
  SEARCH_PLACEHOLDER: 'search',
  MIN_PRICE_PLACEHOLDER: 'Min Price',
  MAX_PRICE_PLACEHOLDER: 'Max Price',
  /** Enter submits the search and commits a typed price bound (verified 2026-10-09). */
  SUBMIT_KEY: 'Enter',
} as const;

/** The result counter for `count` cards, e.g. "Showing 3 results" (RF-4, RF-7). */
export function resultCounterText(count: number): RegExp {
  return new RegExp(`Showing ${String(count)} results`);
}
