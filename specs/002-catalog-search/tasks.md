# Tasks — Spec 002 Catalog and search

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/002-catalog-search/spec.md · Plan: specs/002-catalog-search/plan.md

Rules:
- One task at a time, tests first, at most 20-30 minutes per task, in dependency order.
- A task is done only when its own TCs pass and the earlier tasks' tests still pass. Each task also
  runs `npm run lint`, `npm run typecheck` and `npm run spec:check`, and updates
  `execution-report.md`.
- Playwright tasks run on chromium (UI and mocked) or `api`. Firefox and webkit run in T15.
- On Windows, Playwright is run as `"$(volta which node)" node_modules/@playwright/test/cli.js`
  when the `--grep` pattern contains `|` (README).
- Every `TODO: VERIFY` of the plan is checked live in the task that uses it.
- If the live API disagrees with the oracle, the task stops and reports a possible defect. The
  oracle is never edited just to match the shop (plan Risks).

## Product API

- [x] T1 — Add the product API client, schemas and catalog fixture, with the contract test
  - Covers: RF-17 / TC-002-25
  - Depends on: —
  - Files:
    - src/config/urls.ts (`PRODUCT_LIST_PATH`, `buildProductListUrl`)
    - src/api/api-result.ts (optional `headers` on `post`)
    - src/api/product-messages.ts (`PRODUCT_API_MESSAGES`)
    - src/api/schemas/product.schema.ts (`productSchema`, `productListSchema`, `noProductsSchema`)
    - src/api/product-client.ts (`ProductClient.getAllProducts`)
    - src/data/catalog-oracle.ts (`ProductCriteria`, `EMPTY_CRITERIA` only)
    - src/fixtures/test.ts (`productClient`, `catalog`)
    - tests/api/product-api.spec.ts
  - Done when:
    - `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-25" --project=api` passes (1 test);
    - `npx playwright test tests/api/auth-login-api.spec.ts tests/api/user-authorization.spec.ts --project=api` still passes (the `post` change is backward compatible).

- [x] T2 — Test the product API authorization
  - Covers: RF-22, RF-23, RF-24 / TC-002-32, TC-002-33, TC-002-34
  - Depends on: T1
  - Files: tests/api/product-authorization.spec.ts
  - Done when: `npx playwright test tests/api/product-authorization.spec.ts --grep "TC-002-3[2-4]" --project=api` passes (3 tests)

- [x] T3 — Add the name rule of the oracle and test the API name search
  - Covers: RF-5, RF-18, RF-19 / TC-002-26, TC-002-29
  - Depends on: T1
  - Files:
    - src/data/catalog-oracle.ts (`matchingProducts` with the name rule, `sameProducts` comparison by name ignoring case, sorted)
    - src/data/catalog-data.ts (`NO_MATCH_NAME`, `firstWord`, `completeName`, `flippedCase`, `lastWord`, `catalog-gap` handling of plan D-6)
    - tests/api/product-api.spec.ts
  - Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-(26|29)" --project=api` passes (2 tests)

- [x] T4 — Add the price rules of the oracle and test the API price range
  - Covers: RF-9, RF-10, RF-11, RF-18, RF-25 / TC-002-27
  - Depends on: T3
  - Files:
    - src/data/catalog-oracle.ts (inclusive range, ignored single or non-numeric bound, minimum above maximum)
    - src/data/catalog-data.ts (`NON_NUMERIC_BOUNDS`, `lowestPrice`, `highestPrice`)
    - tests/api/product-api.spec.ts
  - Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-27" --project=api` passes (1 test)

- [x] T5 — Add the option rules of the oracle and test the API filter combinations
  - Covers: RF-12, RF-13, RF-14, RF-15, RF-18 / TC-002-28
  - Depends on: T4
  - Files:
    - src/data/catalog-oracle.ts (OR within an option list, AND across criteria)
    - src/data/catalog-data.ts (`FILTER_OPTIONS`, `optionWithProducts`, `optionWithoutProducts`)
    - tests/api/product-api.spec.ts
  - Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-28" --project=api` passes (1 test)

- [x] T6 — Test injection-style names and pattern special characters in the API
  - Covers: RF-20, RF-21 / TC-002-30, TC-002-31
  - Depends on: T1
  - Files:
    - src/data/catalog-data.ts (`PATTERN_SPECIAL_NAMES`)
    - tests/api/product-api.spec.ts (TC-002-31 as `test.fail()` with the Known-issue annotation, plan D-5)
  - Done when: `npx playwright test tests/api/product-api.spec.ts --grep "TC-002-3[01]" --project=api` reports TC-002-30 passed and TC-002-31 as an expected failure (exit code 0), and the TC-002-31 report shows the 500 for `(`

## Product listing (UI)

- [x] T7 — Add the product list component and test the dashboard listing
  - Covers: RF-1, RF-2, RF-3, RF-4 / TC-002-01, TC-002-02, TC-002-03
  - Depends on: T3
  - Files:
    - src/pages/catalog.constants.ts (`CATALOG`)
    - src/components/product-list.ts (`ProductList`)
    - src/pages/dashboard-page.ts (`products`)
    - tests/ui/catalog-listing.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/catalog-listing.spec.ts --grep "TC-002-0[1-3]" --project=chromium` passes (3 tests). The card name role and the price format are verified and recorded.

- [x] T8 — Test the listing against mocked product API answers
  - Covers: RF-1, RF-2, RF-3, RF-4, RF-7 / TC-002-04, TC-002-05
  - Depends on: T7
  - Files:
    - src/data/catalog-data.ts (`testProduct`)
    - tests/mocked/catalog-mocked-answer.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/mocked/catalog-mocked-answer.spec.ts --grep "TC-002-0[45]" --project=chromium` passes (2 tests)

## Search (UI)

- [x] T9 — Add the filter panel search and test the positive search flow
  - Covers: RF-4, RF-5, RF-6, RF-7, RF-16 / TC-002-06, TC-002-07, TC-002-10, TC-002-11
  - Depends on: T7
  - Files:
    - src/components/filter-panel.ts (`FilterPanel`: visible panel, `search` with the plan D-4 wait)
    - src/pages/dashboard-page.ts (`filters`)
    - tests/ui/catalog-search.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-(06|07|10|11)" --project=chromium` passes (4 tests). The search trigger (Enter) is verified and recorded.

- [x] T10 — Test searches in another letter case, from the middle of a name, or with spaces
  - Covers: RF-5, RF-7 / TC-002-08, TC-002-09
  - Depends on: T9
  - Files: tests/ui/catalog-search.spec.ts
  - Done when: `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-0[89]" --project=chromium` passes (2 tests)

- [x] T11 — Extract the dialog recorder and test injection-style search
  - Covers: RF-8 / TC-002-12
  - Depends on: T9
  - Files:
    - src/components/dialog-recorder.ts (`DialogRecorder`)
    - src/pages/login-page.ts (`recordDialogs` delegates)
    - src/pages/dashboard-page.ts (`recordDialogs`)
    - tests/ui/catalog-search.spec.ts
  - Done when:
    - `npx playwright test tests/ui/catalog-search.spec.ts --grep "TC-002-12" --project=chromium` passes (1 test);
    - `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-11" --project=chromium` still passes.

## Filters (UI)

- [x] T12 — Add the price range to the filter panel and test the price filters
  - Covers: RF-9, RF-10, RF-11 / TC-002-13, TC-002-14, TC-002-15, TC-002-16
  - Depends on: T4, T9
  - Files:
    - src/components/filter-panel.ts (`setPriceRange`, `clearPriceRange`)
    - tests/ui/catalog-filters.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-1[3-6]" --project=chromium` passes (4 tests). The price input trigger is verified and recorded.

- [x] T13 — Add the option groups to the filter panel and test each option
  - Covers: RF-12, RF-13, RF-14 / TC-002-17, TC-002-18, TC-002-19, TC-002-20
  - Depends on: T5, T12
  - Files:
    - src/components/filter-panel.ts (`toggleOption`)
    - tests/ui/catalog-filters.spec.ts
  - Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-(1[7-9]|20)" --project=chromium` passes (4 tests). The checkbox locator is verified and recorded.

- [x] T14 — Test combined criteria and clearing them
  - Covers: RF-12, RF-14, RF-15, RF-16, RF-7 / TC-002-21, TC-002-22, TC-002-23, TC-002-24
  - Depends on: T13
  - Files: tests/ui/catalog-filters.spec.ts
  - Done when: `npx playwright test tests/ui/catalog-filters.spec.ts --grep "TC-002-2[1-4]" --project=chromium` passes (4 tests)

## Cross-browser, secrets and traceability

- [x] T15 — Run the suite on all browsers, scan the artifacts and update the traceability matrix
  - Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; RF-27 of Spec 001 on the new tests)
  - Depends on: T1 to T14
  - Files:
    - docs/traceability.md (regenerated)
    - specs/002-catalog-search/implementation.md
  - Done when:
    - `npx playwright test --grep "TC-002-" --project=api --project=chromium` passes, then `--project=firefox` and `--project=webkit` pass (`--workers=2`, run per project because of local memory limits), with TC-002-31 as the only expected failure;
    - `npm run check:secrets` exits 0 after each run;
    - `npm run test:unit` passes;
    - `npm run spec:check -- --write` passes with no Spec 002 warning.

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-002-01 | T7 |
| TC-002-02 | T7 |
| TC-002-03 | T7 |
| TC-002-04 | T8 |
| TC-002-05 | T8 |
| TC-002-06 | T9 |
| TC-002-07 | T9 |
| TC-002-08 | T10 |
| TC-002-09 | T10 |
| TC-002-10 | T9 |
| TC-002-11 | T9 |
| TC-002-12 | T11 |
| TC-002-13 | T12 |
| TC-002-14 | T12 |
| TC-002-15 | T12 |
| TC-002-16 | T12 |
| TC-002-17 | T13 |
| TC-002-18 | T13 |
| TC-002-19 | T13 |
| TC-002-20 | T13 |
| TC-002-21 | T14 |
| TC-002-22 | T14 |
| TC-002-23 | T14 |
| TC-002-24 | T14 |
| TC-002-25 | T1 |
| TC-002-26 | T3 |
| TC-002-27 | T4 |
| TC-002-28 | T5 |
| TC-002-29 | T3 |
| TC-002-30 | T6 |
| TC-002-31 | T6 |
| TC-002-32 | T2 |
| TC-002-33 | T2 |
| TC-002-34 | T2 |
