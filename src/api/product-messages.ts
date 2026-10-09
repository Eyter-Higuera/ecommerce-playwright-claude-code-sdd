// Messages of the shop's product API named by Spec 002 (RF-17, RF-19), observed on the live API on
// 2026-10-09. The 401 messages (RF-22 to RF-24) are those of Spec 001 in AUTH_API_MESSAGES.
export const PRODUCT_API_MESSAGES = {
  ALL_FETCHED: 'All Products fetched Successfully',
  NO_PRODUCTS: 'No Products Found',
} as const;

/** The message the product API sends for a list of `count` products (RF-17, RF-19). */
export function productListMessage(count: number): string {
  return count === 0 ? PRODUCT_API_MESSAGES.NO_PRODUCTS : PRODUCT_API_MESSAGES.ALL_FETCHED;
}
