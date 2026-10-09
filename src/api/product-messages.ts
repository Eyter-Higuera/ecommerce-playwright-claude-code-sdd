// Messages of the shop's product API named by Spec 002 (RF-17, RF-19) and Spec 003 (RF-11, RF-13),
// observed on the live API on 2026-10-09. The 401 messages (Spec 002 RF-22 to RF-24, Spec 003 RF-15
// to RF-17) are those of Spec 001 in AUTH_API_MESSAGES.
export const PRODUCT_API_MESSAGES = {
  ALL_FETCHED: 'All Products fetched Successfully',
  NO_PRODUCTS: 'No Products Found',
  DETAIL_FETCHED: 'Product Details fetched Successfully',
  PRODUCT_NOT_FOUND: 'Product not found',
} as const;

/** The message the product API sends for a list of `count` products (RF-17, RF-19). */
export function productListMessage(count: number): string {
  return count === 0 ? PRODUCT_API_MESSAGES.NO_PRODUCTS : PRODUCT_API_MESSAGES.ALL_FETCHED;
}

/** Names of internal errors that an API answer must not disclose (Spec 003 RF-14, observed in the 500 body). */
const INTERNAL_ERROR_MARKERS = ['CastError', 'ObjectId'] as const;

/** True when the body's `message` is a string that names no internal error (Spec 003 RF-14). */
export function hasCleanMessage(json: unknown): boolean {
  const message = typeof json === 'object' && json !== null ? (json as Record<string, unknown>).message : undefined;
  return typeof message === 'string' && INTERNAL_ERROR_MARKERS.every((marker) => !message.includes(marker));
}
