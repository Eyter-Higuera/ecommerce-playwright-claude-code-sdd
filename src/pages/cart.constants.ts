// UI texts of the cart page (Spec 004), verified on the live site on 2026-10-09.

export const CART = {
  /** Each cart line has a level-3 heading with the product name. */
  LINE_NAME_LEVEL: 3,
  /** The line price "$ 11500"; the line also shows "MRP $ 11500", which this pattern skips. */
  LINE_PRICE_PATTERN: /^\$\s*\d/,
  /** The totals are list items "Subtotal $11500" and "Total $11500". */
  SUBTOTAL_PATTERN: /^Subtotal/,
  TOTAL_PATTERN: /^Total/,
  /** Heading of the empty cart (RF-8). */
  EMPTY_MESSAGE: 'No Products in Your Cart !',
  /** "Continue Shopping❯" is a button on the cart route (a link on the product detail page). */
  CONTINUE_SHOPPING_NAME: /Continue Shopping/,
  /**
   * The remove control: an icon-only `btn-danger` button in the line, with no role name or label
   * (RF-12, a known defect), so CSS is its only stable handle (plan D-6).
   */
  REMOVE_BUTTON_SELECTOR: 'button.btn-danger',
  /** An accessible name that names the remove action (RF-12). */
  REMOVE_ACTION_NAME: /remove|delete/i,
} as const;

/** The price text of a cart line, e.g. "$ 11500" (RF-6). */
export function lineMoneyText(amount: number): RegExp {
  return new RegExp(`^\\$\\s*${String(amount)}$`);
}

/** A totals row, e.g. "Subtotal $23000" (RF-7). */
export function totalText(label: 'Subtotal' | 'Total', amount: number): RegExp {
  return new RegExp(`^${label}\\s*\\$\\s*${String(amount)}$`);
}

/** The header Cart button: "Cart" followed by the count, or nothing when the cart is empty (RF-3). */
export function cartButtonText(count: number): RegExp {
  return count === 0 ? /Cart\s*$/ : new RegExp(`Cart\\s*${String(count)}\\s*$`);
}
