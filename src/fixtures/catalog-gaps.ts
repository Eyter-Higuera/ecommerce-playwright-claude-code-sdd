import { test } from '@playwright/test';

// Spec 002, plan D-6. The catalog belongs to a third party, so it may not provide every derived
// input (for example, no multi-word product name). Missing data is not a defect: such a case is
// dropped and recorded as a `catalog-gap` annotation, and a test with no case left is skipped with
// the reason, so reports and spec:check show it as skipped instead of a false failure.

export const CATALOG_GAP_ANNOTATION = 'catalog-gap';

/** One case of a multi-case test; `value` is `undefined` when the catalog cannot provide it. */
export type CatalogCase<T, Extra extends object> = { label: string; value: T | undefined } & Extra;

/** Keeps the cases the catalog can provide; annotates the others; skips the test if none is left. */
export function keepAvailableCases<T, Extra extends object>(cases: readonly CatalogCase<T, Extra>[]): ({ label: string; value: T } & Extra)[] {
  const available: ({ label: string; value: T } & Extra)[] = [];
  for (const item of cases) {
    if (item.value === undefined) {
      test.info().annotations.push({ type: CATALOG_GAP_ANNOTATION, description: `The current catalog cannot provide: ${item.label}` });
    } else {
      available.push({ ...item, value: item.value });
    }
  }
  test.skip(available.length === 0, 'The current catalog provides none of the inputs of this test (plan D-6)');
  return available;
}

/** One input the test cannot do without: returns it, or annotates the gap and skips the test. */
export function requireCatalogInput<T>(label: string, value: T | undefined): T {
  const [item] = keepAvailableCases([{ label, value }]);
  if (item === undefined) throw new Error(`Unreachable: the test was skipped for lack of ${label}`);
  return item.value;
}
