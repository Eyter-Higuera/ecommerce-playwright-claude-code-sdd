# Implementation Log — Spec 002 Catalog and search

Spec: specs/002-catalog-search/spec.md · Tasks: specs/002-catalog-search/tasks.md

## T1 — Add the product API client, schemas and catalog fixture, with the contract test

Date: 2026-10-09 · Covers: RF-17 / TC-002-25

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-api.spec.ts | NEW | TC-002-25 |
| src/config/urls.ts | UPDATED | `PRODUCT_LIST_PATH`, `buildProductListUrl` |
| src/api/api-result.ts | UPDATED | Optional `headers` on `post` (plan D-2); existing callers unchanged |
| src/api/product-messages.ts | NEW | `PRODUCT_API_MESSAGES` (RF-17, RF-19) |
| src/api/schemas/product.schema.ts | NEW | `productSchema`, `productListSchema` (count = length of data), `noProductsSchema` |
| src/api/product-client.ts | NEW | `ProductClient.getAllProducts(criteria, authorization?)`, raw `ApiResult` |
| src/data/catalog-oracle.ts | NEW | `ProductCriteria`, `EMPTY_CRITERIA` |
| src/fixtures/test.ts | UPDATED | `productClient`, `catalog` (test-scoped catalog snapshot, plan D-1, D-9) |
| src/errors/messages.ts | UPDATED | `catalogUnavailableMessage(status)` for the `catalog` fixture. Not listed in the task's Files; added because every framework message lives here (Spec 000 RF-21) |

### Test run
Command: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-25" --project=api`
Result: 1 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-002-25 passes (1 test), and `auth-login-api.spec.ts` plus `user-authorization.spec.ts` still pass | PASS (1 passed; 14 passed) |
| Test review checklist | PASS |
| Lint | PASS (0 errors; the new files have no warnings, see findings) |
| typecheck | PASS |
| spec:check | PASS (warnings only for Spec 002 TCs not implemented yet) |

### Assumptions and findings
- The live API matched RF-17: 200, "All Products fetched Successfully", 3 products with every
  required field, `count` 3.
- Finding (not caused by this task): `npm run lint` reports 10 warnings in two Spec 001 files that
  this task did not touch. `tests/api/auth-login-api.spec.ts` has one
  `consistent-spacing-between-blocks` and seven `expect-expect`. `tests/api/user-authorization.spec.ts`
  has two `expect-expect`. The `expect-expect` warnings come from tests that assert through helper
  functions (`expectRejected`, `expectUnauthorized`). The same 10 warnings appear on the committed
  code (`git stash`), so Spec 001 `validation.md` ("0 errors, 0 warnings") is inaccurate on this
  point. Reported to the user; not fixed here, because the files are outside this task.

## T2 — Test the product API authorization

Date: 2026-10-09 · Covers: RF-22, RF-23, RF-24 / TC-002-32, TC-002-33, TC-002-34

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-authorization.spec.ts | NEW | TC-002-32 to TC-002-34; `outcomeOf()` summarises status, message and product list so each test asserts with one `toEqual` |

### Test run
Command: `npx playwright test tests/api/product-authorization.spec.ts --grep "TC-002-3[2-4]" --project=api`
Result: 3 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/product-authorization.spec.ts --grep "TC-002-3[2-4]" --project=api` passes (3 tests) | PASS |
| Test review checklist | PASS (first draft asserted inside a helper and raised `expect-expect`; refactored so the assertion is in the test body) |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- None. The live API answered exactly as RF-22 to RF-24 state (observed on 2026-10-09).

## T3 — Add the name rule of the oracle and test the API name search

Date: 2026-10-09 · Covers: RF-5, RF-18, RF-19 / TC-002-26, TC-002-29

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-api.spec.ts | UPDATED | TC-002-26, TC-002-29 |
| src/data/catalog-oracle.ts | UPDATED | `CatalogProduct`, `matchingProducts` with the RF-5 name rule, `productNames` |
| src/data/catalog-data.ts | NEW | `NO_MATCH_NAME`, `anyProduct`, `firstWord`, `completeName`, `flippedCase`, `lastWord`, `untrimmedPrefix` |
| src/fixtures/catalog-gaps.ts | NEW | `keepAvailableCases` and the `catalog-gap` annotation (plan D-6). The task listed this handling under catalog-data.ts; it lives in src/fixtures because it calls Playwright's `test.info()` and `test.skip()`, and src/data stays free of Playwright |
| src/api/schemas/product.schema.ts | UPDATED | `productAnswerSchema` to read the product list of any answer. Not listed in the task's Files; needed to parse empty and non-empty answers alike |

### Test run
Command: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-(26|29)" --project=api`
Result: 2 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-(26|29)" --project=api` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- The oracle agreed with the live API on all 5 derived texts. The current catalog provided every
  input (no `catalog-gap`): "ADIDAS" and "ADIDAS ORIGINAL" found that product; "adidas original",
  "ORIGINAL" and " ADIDAS" found none.

## T4 — Add the price rules of the oracle and test the API price range

Date: 2026-10-09 · Covers: RF-9, RF-10, RF-11, RF-18, RF-25 / TC-002-27

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-api.spec.ts | UPDATED | TC-002-27 (7 ranges around the lowest price L and the highest H; status, products and message per range) |
| src/data/catalog-oracle.ts | UPDATED | `matchesPrice` on the API body (single bound ignored; two numbers: inclusive range; a non-number with both bounds: nothing), `resultSize` |
| src/data/catalog-data.ts | UPDATED | `NON_NUMERIC_BOUNDS`, `lowestPrice`, `highestPrice` |
| src/api/product-messages.ts | UPDATED | `productListMessage(count)`. Not listed in the task's Files; added so the test checks the RF-19/RF-25 message without a conditional |
| specs/002-catalog-search/spec.md, test-cases.md, plan.md, tasks.md | UPDATED | Mode C approved by the user: RF-11 names the filter panel, RF-18 refers to RF-25, new RF-25, clarification 11; TC-002-27 expects no product for two non-numeric bounds |

### Test run
Command: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-27" --project=api`
Result: 1 passed · 0 failed · 0 skipped (api). The whole file: 4 passed.

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-27" --project=api` passes (1 test) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- First run: FAIL on "non-numeric bounds". The work stopped and the difference was reported
  instead of weakening the assertion. Probe on 2026-10-09 (statuses and counts only):
  - with both bounds present, any non-number matches nothing: `TEST_abc`/`TEST_xyz`,
    `TEST_abc`/100000, 0/`TEST_xyz`, `""`/`""`, `"11500"`/`"11500"` → 200 "No Products Found";
  - `TEST_abc`/null and null/`TEST_xyz` → the whole catalog (single bound ignored).
- The user chose to adopt the observed behavior (Mode C): new RF-25; RF-11 applies to the filter
  panel, which sends a non-numeric typed bound as `null`.

## T5 — Add the option rules of the oracle and test the API filter combinations

Date: 2026-10-09 · Covers: RF-12, RF-13, RF-14, RF-15, RF-18 / TC-002-28

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-api.spec.ts | UPDATED | TC-002-28: the 10 options alone, two Categories options, both Search For options, and one product's name prefix with its category, sub category and target group |
| src/data/catalog-oracle.ts | UPDATED | `matchesOptions` (empty list = no filter, OR within a list); `matchingProducts` combines every rule with AND |
| src/data/catalog-data.ts | UPDATED | `FILTER_OPTIONS` (groups, product field, options), `optionWithProducts`, `optionWithoutProducts`, `targetCriteria` |

### Test run
Command: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-28" --project=api`
Result: 1 passed · 0 failed · 0 skipped (api). The whole file: 5 passed.

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-28" --project=api` passes (1 test) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- The oracle agreed with the live API on all 13 combinations. With the current catalog (all
  products electronics, mobiles, women), 7 single options return no product, and the target
  combination returns its product.
- `targetCriteria` was not listed in the task; it builds the AND case shared by TC-002-28 and the
  UI test TC-002-22.

## T6 — Test injection-style names and pattern special characters in the API

Date: 2026-10-09 · Covers: RF-20, RF-21 / TC-002-30, TC-002-31

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-api.spec.ts | UPDATED | TC-002-30 (closed injection list of Spec 001); TC-002-31 as `test.fail()` with an `issue` annotation and soft assertions (plan D-5); `productsIn()` reads the product list of any answer |
| src/data/catalog-data.ts | UPDATED | `PATTERN_SPECIAL_NAMES` |
| specs/002-catalog-search/spec.md | UPDATED | Known issues: the observed 500 now names `(` and `[` (observation only, no requirement changed) |

### Test run
Command: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-3[01]" --project=api`
Result: 2 passed (TC-002-30 passed; TC-002-31 failed as expected) · 0 unexpected failures · exit code 0 (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-002-30 passed and TC-002-31 reported as an expected failure (exit code 0), its report showing the 500 for `(` | PASS (JSON report: TC-002-31 expected `failed`, status `expected`; soft errors for `(`, `[` and `TEST_*(`) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- Known defect, wider than first observed: `[` and `TEST_*(` also answer HTTP 500, not only `(`.
  The spec Known issues note was updated with the observation; RF-21 is unchanged.
- The three injection-style names answered 200 "No Products Found" (RF-20 holds).

## T7 — Add the product list component and test the dashboard listing

Date: 2026-10-09 · Covers: RF-1, RF-2, RF-3, RF-4 / TC-002-01, TC-002-02, TC-002-03

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-listing.spec.ts | NEW | TC-002-01 to TC-002-03 (`loggedInTest`, `NO_TRACE`) |
| src/pages/catalog.constants.ts | NEW | `CATALOG` (card selector, name level, button names, price and counter patterns), `resultCounterText(n)` |
| src/components/product-list.ts | NEW | `ProductList`: cards, result counter, View and Add To Cart per card, `entries()` (name and price of every card) |
| src/pages/dashboard-page.ts | UPDATED | `products: ProductList` |
| src/data/catalog-oracle.ts | UPDATED | `CardEntry`, `cardEntries(products)`: the expected cards. Not listed in the task's Files; it keeps the expectation next to the oracle |

### Test run
Command: `npx playwright test tests/ui/catalog-listing.spec.ts --grep "TC-002-0[1-3]" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-listing.spec.ts --grep "TC-002-0[1-3]" --project=chromium` passes (3 tests); card name role and price format recorded | PASS |
| Test review checklist | PASS (one justified CSS fallback: the product card) |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09):
  - the card name is a level-5 heading whose text is the stored name; CSS shows it in upper case;
  - the price text is `$ 11500`;
  - the buttons are "View" and " Add To Cart" (icon glyph first);
  - the counter reads "Showing 3 results |".
- No role or test id exists for a card, so `.card-body` is the only CSS fallback (justified in
  `CATALOG.CARD_SELECTOR`).
- Risk noted: the page says "User can only see maximum 9 products on a page" and has a paginator.
  With more than 9 catalog products, TC-002-01 would see only the first page. Pagination is out of
  scope; today the catalog has 3 products.

## T8 — Test the listing against mocked product API answers

Date: 2026-10-09 · Covers: RF-1, RF-2, RF-3, RF-4, RF-7 / TC-002-04, TC-002-05

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/mocked/catalog-mocked-answer.spec.ts | NEW | TC-002-04, TC-002-05 (`page.route` on the product API only; real dashboard and API session; `NO_TRACE`) |
| src/data/catalog-data.ts | UPDATED | `testProduct(overrides)` (TEST_ products), `productListAnswer(products)` (answer shaped like the shop's) |
| src/components/product-list.ts | UPDATED | `allViewButtons`, `allAddToCartButtons` (page-wide card controls). Not listed in the task's Files; needed to prove that an empty list shows no control |

### Test run
Command: `npx playwright test tests/mocked/catalog-mocked-answer.spec.ts --grep "TC-002-0[45]" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/mocked/catalog-mocked-answer.spec.ts --grep "TC-002-0[45]" --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- Each test waits for the mocked answer before asserting, so it proves that the mock reached the
  app. The UI rendered the TEST_ names (lower-case `test_catalog_beta` shown in upper case) with
  their own prices.

## T9 — Add the filter panel search and test the positive search flow

Date: 2026-10-09 · Covers: RF-4, RF-5, RF-6, RF-7, RF-16 / TC-002-06, TC-002-07, TC-002-10, TC-002-11

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-search.spec.ts | NEW | TC-002-06, TC-002-07, TC-002-10, TC-002-11 (`loggedInTest`, `NO_TRACE`) |
| src/components/filter-panel.ts | NEW | `FilterPanel`: visible panel only; `load`, `search`; `criteria` (the criteria of the last answered request); every action waits for the product API answer whose request body equals the expected criteria (plan D-4) |
| src/pages/dashboard-page.ts | UPDATED | `filters: FilterPanel`; `openCatalog()` (open and wait for the unfiltered answer, so a filter action cannot race with the initial list) |
| src/pages/catalog.constants.ts | UPDATED | Placeholders of the panel inputs, `SUBMIT_KEY` |

### Test run
Command: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-(06|07|10|11)" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-(06|07|10|11)" --project=chromium` passes (4 tests); search trigger recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09): the search is sent when Enter is pressed, one request
  per submit, with the panel's full criteria as the body; an empty submit sends `productName: ""`.
- `openCatalog()` was added during the task (not in the plan's file list). Without it, a search
  could start before the initial unfiltered answer arrived, and a late initial answer could
  overwrite the searched list.

## T10 — Test searches in another letter case, from the middle of a name, or with spaces

Date: 2026-10-09 · Covers: RF-5, RF-7 / TC-002-08, TC-002-09

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-search.spec.ts | UPDATED | TC-002-08 (changed letter case, last word of a multi-word name), TC-002-09 (leading space, a single space); `test.slow()` for the multi-search loops; inputs through `keepAvailableCases` (plan D-6) |
| src/data/catalog-data.ts | UPDATED | `ONLY_SPACES`. Not listed in the task's Files; it names the single-space search text |

### Test run
Command: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-0[89]" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-0[89]" --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- The panel sends the search text untrimmed (the plan D-4 wait matched `" ADIDAS"` and `" "`
  exactly), and the shop shows "Showing 0 results" for each, as RF-5 and RF-7 state.
- The current catalog provided every input (no `catalog-gap`).

## T11 — Extract the dialog recorder and test injection-style search

Date: 2026-10-09 · Covers: RF-8 / TC-002-12

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-search.spec.ts | UPDATED | TC-002-12 (closed injection list of Spec 001; `test.slow()`) |
| src/components/dialog-recorder.ts | NEW | `DialogRecorder`: records dialog types and dismisses each dialog (plan D-8) |
| src/pages/login-page.ts | UPDATED | `recordDialogs()` delegates to `DialogRecorder`; same contract |
| src/pages/dashboard-page.ts | UPDATED | `recordDialogs()` |

### Test run
Command: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-12" --project=chromium`
Result: 1 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-002-12 passes (1 test), and `tests/ui/auth-login-validation.spec.ts --grep "TC-001-11"` still passes | PASS (1 passed; TC-001-10 and TC-001-11: 2 passed) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- None. No injection-style search opened a dialog, and each showed "Showing 0 results".

## T12 — Add the price range to the filter panel and test the price filters

Date: 2026-10-09 · Covers: RF-9, RF-10, RF-11 / TC-002-13, TC-002-14, TC-002-15, TC-002-16

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-filters.spec.ts | NEW | TC-002-13 to TC-002-16 (`loggedInTest`, `NO_TRACE`; `test.slow()` for the multi-range loops) |
| src/components/filter-panel.ts | UPDATED | `minPriceInput`, `maxPriceInput`, `setPriceRange(min, max)` (fill both, Enter on the maximum), `clearPriceRange()`, `sentBound()` (the panel sends a non-integer text as `null`) |
| src/pages/catalog.constants.ts | UPDATED | `SUBMIT_KEY` comment: Enter also commits a price bound |

### Test run
Command: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-1[3-6]" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-1[3-6]" --project=chromium` passes (4 tests); price input trigger recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live probe, 2026-10-09): typing alone sends nothing. A price bound is sent
  on its `change` event: leaving the field (Tab, or focusing the other input) or Enter. Each
  changed value sends one request with the full criteria; pressing Enter again on an unchanged
  value sends none. Non-numeric text (`abc`) is sent as `null`.
- First run: all 4 tests timed out waiting for the answer, because `setPriceRange` filled the
  inputs without committing the maximum. Fixed by pressing Enter on the maximum; the wait
  (plan D-4) was not loosened.
- `setPriceRange` resolves on the answer to the final pair, so a call must change the criteria.
  TC-002-16 orders its cases so each one does.

## T13 — Add the option groups to the filter panel and test each option

Date: 2026-10-09 · Covers: RF-12, RF-13, RF-14 / TC-002-17, TC-002-18, TC-002-19, TC-002-20

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-filters.spec.ts | UPDATED | TC-002-17 to TC-002-19 (each option of a group alone, then cleared), TC-002-20 (per group, an option without catalog products; plan D-6) |
| src/components/filter-panel.ts | UPDATED | `optionCheckbox(option)`, `toggleOption(group, option)` (selection appended to the group's list, clearing removes it) |

### Test run
Command: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-(1[7-9]|20)" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium). The whole file: 8 passed.

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-(1[7-9]|20)" --project=chromium` passes (4 tests); checkbox locator recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09): each option is an `<input type="checkbox">` next to a
  `<label for="cat|sub|…">` whose `for` names no element, so the check box has no accessible name.
  Locator: the check box in the parent of the exact option text (`getByText(option, { exact: true })`
  then `..`), inside the visible panel. Clicking sends one request with the option appended to the
  group's list; clicking again removes it.
- With the current catalog, 7 of the 10 options list no product, and fashion, shirts and men were
  used as options without products (no `catalog-gap`).
- Process note: an `npx prettier --write` run reformatted the test file to another style (double
  quotes, narrow lines). Prettier is not a project tool, so the file was restored to the project
  style before the final run. No dependency or config file was added.

## T14 — Test combined criteria and clearing them

Date: 2026-10-09 · Covers: RF-12, RF-14, RF-15, RF-16, RF-7 / TC-002-21, TC-002-22, TC-002-23, TC-002-24

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/catalog-filters.spec.ts | UPDATED | TC-002-21 (two options of a group: OR), TC-002-22 (search, price and three options of one product: AND), TC-002-23 (criteria that match apart but not together), TC-002-24 (clear option, price range, search text in turn) |
| src/data/catalog-data.ts | UPDATED | `ConflictingCriterion`, `conflictingCriterion(catalog, product)`. Not listed in the task's Files; needed for TC-002-23 (see findings) |
| src/components/filter-panel.ts | UPDATED | `addCriterion(criterion)`, so the test body has no conditional |
| src/fixtures/catalog-gaps.ts | UPDATED | `requireCatalogInput(label, value)`: one required input, or annotate and skip (plan D-6) |

### Test run
Command: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-2[1-4]" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-2[1-4]" --project=chromium` passes (4 tests) | PASS |
| Test review checklist | PASS (a first draft had a conditional in TC-002-23, flagged by `no-conditional-in-test`; moved into `FilterPanel.addCriterion`) |
| Lint | PASS (0 warnings in Spec 002 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TC-002-23 test data names "a Categories option that this product does not have", which must
  match products on its own. The current catalog has none: every product is electronics, mobiles
  and women. Following plan D-6, `conflictingCriterion` prefers such a Categories option, then an
  option of another group, then another product's price as both bounds. Today the test used the
  price range 55000 to 55000 with the search "ADIDAS": each matches a product on its own, none
  together. The TC's intent (RF-15 AND) is kept; the deviation from its literal data is recorded
  here.
- TC-002-21 used electronics + fashion (Categories) and men + women (Search For).

## T15 — Run the suite on all browsers, scan the artifacts and update the traceability matrix

Date: 2026-10-09 · Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; Spec 001 RF-27 on the new tests)

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| docs/traceability.md | UPDATED | Regenerated: 314 rows; all 56 Spec 002 rows `automated` |
| specs/002-catalog-search/implementation.md | UPDATED | This entry |
| src/components/filter-panel.ts | UPDATED | `setPriceRange` commits the minimum and the maximum one at a time, waiting for each answer (`commitBound`, `typedBounds`). Not listed in the task's Files; fix for the firefox finding below |
| tests/ui/catalog-filters.spec.ts | UPDATED | TC-002-16 comment: the case order no longer matters |

### Test run
Commands (`--workers=2`, one invocation per project because of local memory limits):
- `npx playwright test --grep "TC-002-" --project=api --project=chromium` → 34 passed (TC-002-31 an expected failure) · 0 failed · 0 flaky
- `npx playwright test --grep "TC-002-" --project=firefox` → 24 passed · 0 failed · 0 flaky
- `npx playwright test --grep "TC-002-" --project=webkit` → 24 passed · 0 failed · 0 flaky
- Extra regression: `npx playwright test --project=api --project=chromium` (Specs 000, 001 and 002) → 74 passed · 0 failed
- `npm run test:unit` → 26 files, 100 passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-002 passes on api, chromium, firefox and webkit, with TC-002-31 the only expected failure | PASS (34 + 24 + 24) |
| Done when: `npm run check:secrets` exits 0 after each run | PASS (after each of the 4 runs) |
| Done when: `npm run test:unit` passes | PASS (100 passed) |
| Done when: `npm run spec:check -- --write` passes with no Spec 002 warning | PASS (0 warnings) |
| Test review checklist | PASS |
| Lint | PASS (0 errors; only the 10 earlier Spec 001 warnings reported in T1) |
| typecheck | PASS |

### Assumptions and findings
- First firefox run: TC-002-14 and TC-002-23 FAILED. `setPriceRange` committed both bounds at once,
  so two requests were in flight: an intermediate one (minimum only, or the old maximum) and the
  final one. On firefox the intermediate answer arrived last and the shop rendered it. TC-002-14
  showed the 2 products of 11499 to 11501 instead of none, and TC-002-23 showed "Showing 1 results"
  instead of 0.
- Fix: commit the minimum, wait for its answer, then commit the maximum, as a customer would.
  A probe confirmed the rule this relies on: a request is sent whenever a bound's committed text
  changes, even with an identical body, and never when it does not change. The assertions were not
  touched. All three browsers passed afterwards.
- Possible defect, for the record (not a requirement of this spec): the shop does not discard
  answers to superseded product requests, so fast consecutive filter changes can leave the list
  showing an older answer.
