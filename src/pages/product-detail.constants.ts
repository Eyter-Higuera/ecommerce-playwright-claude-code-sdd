// UI texts of the product detail page (Spec 003), verified on the live site on 2026-10-09.

export const PRODUCT_DETAIL = {
  /** The page's main heading: the product name (RF-2). */
  NAME_LEVEL: 2,
  /** The price heading, e.g. "$ 11500" (RF-3); the header also has a level-3 "Automation" heading. */
  PRICE_LEVEL: 3,
  PRICE_NAME: /^\$/,
  /** The level-6 heading above the description paragraph (RF-4). */
  DESCRIPTION_HEADING: 'product details',
  /** Exact name: the header's " Cart" button must not match (RF-5). */
  ADD_TO_CART_NAME: 'Add to Cart',
  /** "Continue Shopping❯" link back to the dashboard (RF-6). */
  CONTINUE_SHOPPING_NAME: /Continue Shopping/,
  /** Alert texts for invalid ids (RF-9, RF-10). */
  PRODUCT_NOT_FOUND: 'Product not found',
  UNREADABLE_ALERT: '[object Object]',
} as const;

/** The price text of the detail page for a price, e.g. "$ 11500" (RF-3). */
export function priceText(price: number): RegExp {
  return new RegExp(`^\\$\\s*${String(price)}$`);
}
