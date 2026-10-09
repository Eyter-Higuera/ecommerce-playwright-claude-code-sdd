// URL building (Spec 000, RF-52, RF-54). The target shop is a single-page app with hash routes,
// so routes are appended to BASE_URL as `/#/<route>` with exactly one `/` in between.

/** Hash route of the login page, relative to BASE_URL. */
export const LOGIN_ROUTE = '#/auth/login';

/** Hash route of the dashboard, relative to BASE_URL (Spec 001 shared definitions). */
export const DASHBOARD_ROUTE = '#/dashboard';

/** Spec 001 "login route": a URL containing `#/auth/login`. */
export const LOGIN_ROUTE_PATTERN = /#\/auth\/login/;

/** Spec 001 "dashboard route": a URL containing `#/dashboard` (the shop lands on `#/dashboard/dash`). */
export const DASHBOARD_ROUTE_PATTERN = /#\/dashboard/;

/** The cart page, a second protected route (TC-001-30): `#/dashboard/cart` (verified 2026-10-08). */
export const CART_ROUTE_PATTERN = /#\/dashboard\/cart/;

/** Hash route of the cart page, relative to BASE_URL (Spec 004 shared definitions). */
export const CART_ROUTE = '#/dashboard/cart';

/** BASE_URL + `/#/dashboard/cart`. */
export function buildCartUrl(baseUrl: string): string {
  return joinUrl(baseUrl, CART_ROUTE);
}

/** Path of the login endpoint, relative to API_BASE_URL. */
export const AUTH_LOGIN_PATH = 'auth/login';

/** Joins a base URL and a relative path with exactly one `/`. */
export function joinUrl(baseUrl: string, relativePath: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}

/** BASE_URL + `/#/auth/login`, with or without a trailing slash in BASE_URL. */
export function buildLoginUrl(baseUrl: string): string {
  return joinUrl(baseUrl, LOGIN_ROUTE);
}

/** BASE_URL + `/#/dashboard`. */
export function buildDashboardUrl(baseUrl: string): string {
  return joinUrl(baseUrl, DASHBOARD_ROUTE);
}

/** API_BASE_URL + `/auth/login`. */
export function buildAuthLoginUrl(apiBaseUrl: string): string {
  return joinUrl(apiBaseUrl, AUTH_LOGIN_PATH);
}

/** Path of the protected user endpoint, relative to API_BASE_URL (Spec 001, RF-24 to RF-26). */
export const USER_CART_COUNT_PATH = 'user/get-cart-count';

/** API_BASE_URL + `/user/get-cart-count/<userId>`. */
export function buildCartCountUrl(apiBaseUrl: string, userId: string): string {
  return joinUrl(apiBaseUrl, `${USER_CART_COUNT_PATH}/${encodeURIComponent(userId)}`);
}

/** Path of the product API, relative to API_BASE_URL (Spec 002 shared definitions). */
export const PRODUCT_LIST_PATH = 'product/get-all-products';

/** API_BASE_URL + `/product/get-all-products`. */
export function buildProductListUrl(apiBaseUrl: string): string {
  return joinUrl(apiBaseUrl, PRODUCT_LIST_PATH);
}

/** Path of the product detail API, relative to API_BASE_URL (Spec 003 shared definitions). */
export const PRODUCT_DETAIL_PATH = 'product/get-product-detail';

/** API_BASE_URL + `/product/get-product-detail/<id>`; the id is URL-encoded, since tests send malformed ids. */
export function buildProductDetailUrl(apiBaseUrl: string, id: string): string {
  return joinUrl(apiBaseUrl, `${PRODUCT_DETAIL_PATH}/${encodeURIComponent(id)}`);
}

/** Hash route of the product detail page, relative to BASE_URL (Spec 003 shared definitions). */
export const PRODUCT_DETAIL_ROUTE = '#/dashboard/product-details';

/** BASE_URL + `/#/dashboard/product-details/<id>`; the id is URL-encoded, since tests open malformed ids. */
export function buildProductDetailRoute(baseUrl: string, id: string): string {
  return joinUrl(baseUrl, `${PRODUCT_DETAIL_ROUTE}/${encodeURIComponent(id)}`);
}

/** Spec 003 "product detail route" of one product: a URL ending in `#/dashboard/product-details/<id>`. */
export function productDetailRoutePattern(id: string): RegExp {
  return new RegExp(`#/dashboard/product-details/${escapeRegExp(encodeURIComponent(id))}$`);
}

/** The text with every regular-expression special character escaped. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Path of the registration endpoint, relative to API_BASE_URL (Spec 004 test customers). */
export const AUTH_REGISTER_PATH = 'auth/register';

/** API_BASE_URL + `/auth/register`. */
export function buildAuthRegisterUrl(apiBaseUrl: string): string {
  return joinUrl(apiBaseUrl, AUTH_REGISTER_PATH);
}

/** Cart API paths, relative to API_BASE_URL (Spec 004 shared definitions, observed 2026-10-09). */
export const CART_API_PATHS = {
  ADD: 'user/add-to-cart',
  PRODUCTS: 'user/get-cart-products',
  REMOVE: 'user/remove-from-cart',
} as const;

/** API_BASE_URL + `/user/add-to-cart`. */
export function buildAddToCartUrl(apiBaseUrl: string): string {
  return joinUrl(apiBaseUrl, CART_API_PATHS.ADD);
}

/** API_BASE_URL + `/user/get-cart-products/<userId>`. */
export function buildCartProductsUrl(apiBaseUrl: string, userId: string): string {
  return joinUrl(apiBaseUrl, `${CART_API_PATHS.PRODUCTS}/${encodeURIComponent(userId)}`);
}

/** API_BASE_URL + `/user/remove-from-cart/<userId>/<productId>`. */
export function buildRemoveFromCartUrl(apiBaseUrl: string, userId: string, productId: string): string {
  return joinUrl(apiBaseUrl, `${CART_API_PATHS.REMOVE}/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`);
}
