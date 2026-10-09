// Expected results of Spec 002 (plan D-1). The catalog read through the product API is the source
// of truth (spec clarification 2); these helpers describe the search and filter criteria.

/** Search and filter criteria, exactly as the product API body names them (spec shared definitions). */
export interface ProductCriteria {
  productName: string;
  /** A number, `null` (no bound) or any other value the customer may type (RF-11). */
  minPrice: number | string | null;
  maxPrice: number | string | null;
  productCategory: readonly string[];
  productSubCategory: readonly string[];
  productFor: readonly string[];
}

/** No search text and no filter: the body the shop sends when the dashboard loads (observed). */
export const EMPTY_CRITERIA: ProductCriteria = {
  productName: '',
  minPrice: null,
  maxPrice: null,
  productCategory: [],
  productSubCategory: [],
  productFor: [],
};

/** The fields of a product the matching rules read. */
export interface CatalogProduct {
  productName: string;
  productPrice: number;
  productCategory: string;
  productSubCategory: string;
  productFor: string;
}

/** RF-5: the name starts with the text, in the same letter case and without trimming spaces. */
function matchesName(product: CatalogProduct, text: string): boolean {
  return product.productName.startsWith(text);
}

function isNumericBound(bound: ProductCriteria['minPrice']): bound is number {
  return typeof bound === 'number' && Number.isFinite(bound);
}

/**
 * The price rule on the API body. A single bound (the other one `null`) is ignored (RF-11). With
 * both bounds present, two numbers give an inclusive range, so a minimum above the maximum matches
 * nothing (RF-9, RF-10), and a non-number matches nothing (RF-25). The filter panel sends a
 * non-numeric typed bound as `null` (observed), which is how RF-11 holds in the UI.
 */
function matchesPrice(product: CatalogProduct, minPrice: ProductCriteria['minPrice'], maxPrice: ProductCriteria['maxPrice']): boolean {
  if (minPrice === null || maxPrice === null) return true;
  if (!isNumericBound(minPrice) || !isNumericBound(maxPrice)) return false;
  return product.productPrice >= minPrice && product.productPrice <= maxPrice;
}

/** RF-12 to RF-14: an empty option list is no filter; otherwise the value must be one of the options (OR). */
function matchesOptions(value: string, options: readonly string[]): boolean {
  return options.length === 0 || options.includes(value);
}

/** The catalog products that satisfy every active criterion, all of them together (AND, RF-15). */
export function matchingProducts<T extends CatalogProduct>(catalog: readonly T[], criteria: ProductCriteria): T[] {
  return catalog.filter(
    (product) =>
      matchesName(product, criteria.productName) &&
      matchesPrice(product, criteria.minPrice, criteria.maxPrice) &&
      matchesOptions(product.productCategory, criteria.productCategory) &&
      matchesOptions(product.productSubCategory, criteria.productSubCategory) &&
      matchesOptions(product.productFor, criteria.productFor),
  );
}

/**
 * Product names ignoring letter case, sorted: the UI shows names in upper case (RF-2) and the list
 * order is not part of the spec (plan D-3), so two product lists are compared through this form.
 */
export function productNames(products: readonly { productName: string }[]): string[] {
  return products.map((product) => product.productName.toLowerCase()).sort();
}

/** Size class of a result compared with the catalog, to check that the oracle applied a rule. */
export type ResultSize = 'none' | 'some' | 'all';

export function resultSize(count: number, catalogSize: number): ResultSize {
  if (count === 0) return 'none';
  return count === catalogSize ? 'all' : 'some';
}

/** What a product card shows: name (lower case, plan D-3) and price (RF-2). */
export interface CardEntry {
  name: string;
  price: number;
}

/** The cards expected for these products, sorted by name like `ProductList.entries()`. */
export function cardEntries(products: readonly CatalogProduct[]): CardEntry[] {
  return products.map((product) => ({ name: product.productName.toLowerCase(), price: product.productPrice })).sort((a, b) => a.name.localeCompare(b.name));
}
