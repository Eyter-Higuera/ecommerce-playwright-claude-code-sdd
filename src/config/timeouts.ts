// Time budgets (Spec 000, NFR "Time budgets", RF-53, RF-57). Named here so a test never hides a
// magic number and the spec value can be checked by a unit test.

/** Page navigation budget for the sanity tests: a slower page counts as unavailable (RF-53). */
export const NAVIGATION_TIMEOUT_MS = 30_000;

/** API request budget for the sanity tests: no response in time counts as unreachable (RF-57). */
export const API_TIMEOUT_MS = 30_000;

/**
 * What a page object navigation waits for: the page document only (RF-101). Images and other
 * resources are not waited for, so a slow third-party image never uses the navigation budget;
 * actions and assertions wait for the elements they need.
 */
export const NAVIGATION_WAIT_UNTIL = 'domcontentloaded';
