import { productListMessage } from '../api/product-messages';
import type { Product } from '../api/schemas/product.schema';
import { EMPTY_CRITERIA, type CatalogProduct, type ProductCriteria } from './catalog-oracle';

// Test data of Spec 002. Literal inputs use the TEST_ prefix; every other input is derived from the
// catalog read in the same test (spec clarification 2, plan D-1). A builder returns `undefined`
// when the current catalog cannot provide its input (plan D-6).

/** A search text that no product name starts with (TC-002-11, TC-002-29). */
export const NO_MATCH_NAME = 'TEST_no_such_product';

const WORD_SEPARATOR = ' ';

/** Any catalog product; the `catalog` fixture already guarantees a non-empty catalog (RF-17). */
export function anyProduct<T extends CatalogProduct>(catalog: readonly T[]): T {
  const [product] = catalog;
  if (product === undefined) throw new Error('The catalog has no product');
  return product;
}

/** The first word of the product name, as stored (a prefix that RF-5 matches). */
export function firstWord(product: CatalogProduct): string {
  return product.productName.split(WORD_SEPARATOR)[0] ?? product.productName;
}

/** The complete product name, as stored. */
export function completeName(product: CatalogProduct): string {
  return product.productName;
}

/** True when some catalog name starts with the text, i.e. RF-5 would find a product. */
function startsAnyName(catalog: readonly CatalogProduct[], text: string): boolean {
  return catalog.some((product) => product.productName.startsWith(text));
}

function swapCase(text: string): string {
  return [...text].map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase())).join('');
}

/** A catalog name with every letter's case swapped that starts no catalog name (RF-5 negative). */
export function flippedCase(catalog: readonly CatalogProduct[]): string | undefined {
  return catalog.map((product) => swapCase(product.productName)).find((text) => !startsAnyName(catalog, text));
}

/** The last word of a multi-word catalog name that starts no catalog name (RF-5 negative). */
export function lastWord(catalog: readonly CatalogProduct[]): string | undefined {
  return catalog
    .map((product) => product.productName.split(WORD_SEPARATOR))
    .filter((words) => words.length > 1)
    .map((words) => words[words.length - 1] ?? '')
    .find((word) => word !== '' && !startsAnyName(catalog, word));
}

/** The first word with one leading space: RF-5 does not trim, so it matches nothing. */
export function untrimmedPrefix(product: CatalogProduct): string {
  return `${WORD_SEPARATOR}${firstWord(product)}`;
}

/** Price bounds that are not numbers (RF-11, TC-002-16, TC-002-27). */
export const NON_NUMERIC_BOUNDS = ['TEST_abc', 'TEST_xyz'] as const;

/** The lowest catalog price. */
export function lowestPrice(catalog: readonly CatalogProduct[]): number {
  return Math.min(...catalog.map((product) => product.productPrice));
}

/** The highest catalog price. */
export function highestPrice(catalog: readonly CatalogProduct[]): number {
  return Math.max(...catalog.map((product) => product.productPrice));
}

/** The option list of the criteria that a filter group sets. */
export type OptionField = 'productCategory' | 'productSubCategory' | 'productFor';

/** A filter group of the panel and the product field it filters on (spec shared definitions). */
export interface FilterGroup {
  name: string;
  field: OptionField;
  options: readonly string[];
}

/** The three filter groups and their options, in panel order (observed on 2026-10-09). */
export const FILTER_OPTIONS = [
  { name: 'Categories', field: 'productCategory', options: ['fashion', 'electronics', 'household'] },
  { name: 'Sub Categories', field: 'productSubCategory', options: ['t-shirts', 'shirts', 'shoes', 'mobiles', 'laptops'] },
  { name: 'Search For', field: 'productFor', options: ['men', 'women'] },
] as const satisfies readonly FilterGroup[];

function productsWithOption(catalog: readonly CatalogProduct[], group: FilterGroup, option: string): boolean {
  return catalog.some((product) => product[group.field] === option);
}

/** An option of the group that at least one catalog product has. */
export function optionWithProducts(catalog: readonly CatalogProduct[], group: FilterGroup): string | undefined {
  return group.options.find((option) => productsWithOption(catalog, group, option));
}

/** An option of the group that no catalog product has (plan D-6: may not exist). */
export function optionWithoutProducts(catalog: readonly CatalogProduct[], group: FilterGroup): string | undefined {
  return group.options.find((option) => !productsWithOption(catalog, group, option));
}

/** Every criterion that the product satisfies at once: name prefix, category, sub category, target group (RF-15). */
export function targetCriteria(product: CatalogProduct): ProductCriteria {
  return {
    ...EMPTY_CRITERIA,
    productName: firstWord(product),
    productCategory: [product.productCategory],
    productSubCategory: [product.productSubCategory],
    productFor: [product.productFor],
  };
}

/** Search texts with characters that are special in search patterns (RF-21, TC-002-31). */
export const PATTERN_SPECIAL_NAMES = ['(', '[', 'TEST_*('] as const;

/** A mocked TEST_ product with every field the shop sends (TC-002-04, TC-002-05). */
export function testProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: `TEST_id_${overrides.productName ?? 'product'}`,
    productName: 'TEST_Product',
    productCategory: 'electronics',
    productSubCategory: 'mobiles',
    productFor: 'women',
    productPrice: 1,
    ...overrides,
  };
}

/** A product API answer for these products, shaped like the shop's (RF-17, RF-19). */
export function productListAnswer(products: readonly Product[]): { data: readonly Product[]; count: number; message: string } {
  return { data: products, count: products.length, message: productListMessage(products.length) };
}

/** A search text made of a single space (TC-002-09): RF-5 does not trim, so it matches nothing. */
export const ONLY_SPACES = WORD_SEPARATOR;

/** A criterion that some other catalog product satisfies on its own but the given product does not. */
export type ConflictingCriterion = { label: string; kind: 'option'; group: FilterGroup; option: string } | { label: string; kind: 'price'; price: number };

/**
 * TC-002-23: criteria that each match on their own but not together. The test data names a
 * Categories option the product does not have; when the catalog has none (plan D-6), another group's
 * option or another product's price is used instead, in that order of preference.
 */
export function conflictingCriterion(catalog: readonly CatalogProduct[], product: CatalogProduct): ConflictingCriterion | undefined {
  for (const group of FILTER_OPTIONS) {
    const option = group.options.find((candidate) => candidate !== product[group.field] && productsWithOption(catalog, group, candidate));
    if (option !== undefined) return { label: `${group.name} option "${option}"`, kind: 'option', group, option };
  }
  const price = catalog.map((other) => other.productPrice).find((candidate) => candidate !== product.productPrice);
  return price === undefined ? undefined : { label: `price range ${String(price)} to ${String(price)}`, kind: 'price', price };
}

/** The six product fields the detail API must share with the catalog (Spec 003 RF-12). */
export function detailFields(product: Product): Pick<Product, 'productName' | 'productPrice' | 'productCategory' | 'productSubCategory' | 'productFor' | 'productDescription'> {
  return {
    productName: product.productName,
    productPrice: product.productPrice,
    productCategory: product.productCategory,
    productSubCategory: product.productSubCategory,
    productFor: product.productFor,
    productDescription: product.productDescription,
  };
}

/** Length of a well-formed product id: 24 hexadecimal characters (Spec 003 shared definitions). */
export const PRODUCT_ID_LENGTH = 24;

/** A well-formed id of no product (TC-003-11, TC-003-15). */
export const UNKNOWN_PRODUCT_ID = '0'.repeat(PRODUCT_ID_LENGTH);

/** A malformed product id (TC-003-12, TC-003-16). */
export const MALFORMED_PRODUCT_ID = 'TEST_not_an_id';

/** Last characters replaced to forge an unknown id from a catalog id. */
const FORGED_ID_SUFFIXES = ['ffff', 'eeee', 'dddd'] as const;
const FORGED_SUFFIX_LENGTH = 4;

/** A catalog id with its last 4 hex characters changed, so it is well-formed and matches no product. */
export function unknownIdLike(catalog: readonly Product[]): string {
  const ids = new Set(catalog.map((product) => product._id));
  const head = anyProduct(catalog)._id.slice(0, -FORGED_SUFFIX_LENGTH);
  const forged = FORGED_ID_SUFFIXES.map((suffix) => head + suffix).find((id) => !ids.has(id));
  return forged ?? UNKNOWN_PRODUCT_ID;
}

/** A product id cut or zero-padded to `length` hexadecimal characters (around the 24-character format). */
export function idOfLength(id: string, length: number): string {
  return id.length >= length ? id.slice(0, length) : id.padEnd(length, '0');
}

/** The dashboard shows at most this many products on a page (observed, Spec 003 edge cases). */
export const MAX_PRODUCTS_PER_PAGE = 9;

/** The catalog products the dashboard's first page can show (Spec 003 TC-003-01). */
export function productsOnFirstPage<T extends CatalogProduct>(catalog: readonly T[]): T[] {
  return catalog.slice(0, MAX_PRODUCTS_PER_PAGE);
}

/** Two catalog products with the same price (Spec 003 TC-003-04), or `undefined` (plan D-6). */
export function productsWithSamePrice<T extends CatalogProduct>(catalog: readonly T[]): readonly [T, T] | undefined {
  for (const [index, product] of catalog.entries()) {
    const twin = catalog.slice(index + 1).find((other) => other.productPrice === product.productPrice);
    if (twin !== undefined) return [product, twin];
  }
  return undefined;
}

/** Two catalog products with different names (Spec 003 TC-003-06), or `undefined` (plan D-6). */
export function twoNamedProducts<T extends CatalogProduct>(catalog: readonly T[]): readonly [T, T] | undefined {
  const first = catalog[0];
  const other = catalog.find((product) => first !== undefined && product.productName !== first.productName);
  return first === undefined || other === undefined ? undefined : [first, other];
}
