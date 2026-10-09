// Messages of the shop's cart API named by Spec 004 (RF-16 to RF-19, RF-23), observed on the live
// API on 2026-10-09. The 401 messages (RF-26 to RF-28) are those of Spec 001 in AUTH_API_MESSAGES.
export const CART_API_MESSAGES = {
  ADDED: 'Product Added To Cart',
  FOUND: 'Cart Data Found',
  EMPTY: 'No Product in Cart',
  REMOVED: 'Product Removed from cart',
  NOT_AUTHORIZED: 'Not Authorized!',
} as const;
