# Tasks — Spec 003 Product detail

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/003-product-detail/spec.md · Plan: specs/003-product-detail/plan.md

Rules:
- One task at a time, tests first, at most 20-30 minutes per task, in dependency order.
- A task is done only when its own TCs pass and the earlier tasks' tests still pass. Each task also
  runs `npm run lint`, `npm run typecheck` and `npm run spec:check`, and updates
  `execution-report.md`.
- Playwright tasks run on chromium (UI and mocked) or `api`. Firefox and webkit run in T9.
- On Windows, Playwright is run as `"$(volta which node)" node_modules/@playwright/test/cli.js`
  when the `--grep` pattern contains `|` (README).
- Every `TODO: VERIFY` of the plan is checked live in the task that uses it. A difference from the
  spec is reported as a possible defect, and the assertion is not weakened.

## Product detail API

- [x] T1 — Add the product detail API call and schema, with the contract and catalog-consistency tests
  - Covers: RF-11, RF-12 / TC-003-13, TC-003-14
  - Depends on: —
  - Files:
    - src/config/urls.ts (`PRODUCT_DETAIL_PATH`, `buildProductDetailUrl`)
    - src/api/product-messages.ts (`DETAIL_FETCHED`, `PRODUCT_NOT_FOUND`)
    - src/api/schemas/product.schema.ts (optional `productDescription` in `productSchema`, `productDetailSchema`)
    - src/api/product-client.ts (`getProductDetail`)
    - src/data/catalog-data.ts (`detailFields`)
    - tests/api/product-detail-api.spec.ts
  - Done when:
    - `npx playwright test tests/api/product-detail-api.spec.ts --grep "TC-003-1[34]" --project=api` passes (2 tests);
    - `npx playwright test tests/api/product-api.spec.ts tests/api/product-authorization.spec.ts --project=api` still passes (Spec 002 contracts unchanged).

- [x] T2 — Test the detail API with unknown and malformed ids
  - Covers: RF-12, RF-13, RF-14 / TC-003-15, TC-003-16
  - Depends on: T1
  - Files:
    - src/data/catalog-data.ts (`UNKNOWN_PRODUCT_ID`, `MALFORMED_PRODUCT_ID`, `unknownIdLike`, `idOfLength`)
    - tests/api/product-detail-api.spec.ts (TC-003-16 as `test.fail()` with the Known-issue annotation, plan D-5)
  - Done when: `npx playwright test tests/api/product-detail-api.spec.ts --grep "TC-003-1[56]" --project=api` reports TC-003-15 passed and TC-003-16 as an expected failure (exit code 0)

- [x] T3 — Test the detail API authorization
  - Covers: RF-15, RF-16, RF-17 / TC-003-17, TC-003-18, TC-003-19
  - Depends on: T1
  - Files: tests/api/product-detail-authorization.spec.ts
  - Done when: `npx playwright test tests/api/product-detail-authorization.spec.ts --grep "TC-003-1[7-9]" --project=api` passes (3 tests)

## Detail page (UI)

- [x] T4 — Add the product detail page and test direct opening, reload and the Add to Cart control
  - Covers: RF-5, RF-7, RF-9, RF-10 / TC-003-03, TC-003-08, TC-003-09
  - Depends on: T1
  - Files:
    - src/config/urls.ts (`PRODUCT_DETAIL_ROUTE`, `buildProductDetailRoute`, `productDetailRoutePattern`)
    - src/pages/product-detail.constants.ts (`PRODUCT_DETAIL`)
    - src/pages/product-detail-page.ts (`ProductDetailPage`, `open(id)` through `about:blank`, plan D-3)
    - src/fixtures/test.ts (`productDetailPage`)
    - tests/ui/product-detail.spec.ts (TC-003-03; `test.use(NO_TRACE)`)
    - tests/ui/product-detail-navigation.spec.ts (TC-003-08, TC-003-09; `test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/product-detail.spec.ts tests/ui/product-detail-navigation.spec.ts --grep "TC-003-0[389]" --project=chromium` passes (3 tests). The description locator and D-3 (session kept through `about:blank`) are verified and recorded.

- [x] T5 — Test View navigation and the detail content of every catalog product
  - Covers: RF-1, RF-2, RF-3, RF-4 / TC-003-01, TC-003-02
  - Depends on: T4
  - Files:
    - src/components/product-list.ts (`cardNamed`)
    - tests/ui/product-detail.spec.ts
  - Done when: `npx playwright test tests/ui/product-detail.spec.ts --grep "TC-003-0[12]" --project=chromium` passes (2 tests)

- [x] T6 — Test Continue Shopping, equal-price products and viewing a second product
  - Covers: RF-1, RF-2, RF-3, RF-4, RF-6 / TC-003-04, TC-003-06, TC-003-07
  - Depends on: T5
  - Files:
    - src/pages/product-detail-page.ts (`continueShopping`)
    - src/data/catalog-data.ts (`productsWithSamePrice`, `twoNamedProducts`)
    - tests/ui/product-detail.spec.ts (TC-003-04, TC-003-06)
    - tests/ui/product-detail-navigation.spec.ts (TC-003-07)
  - Done when: `npx playwright test tests/ui/product-detail.spec.ts tests/ui/product-detail-navigation.spec.ts --grep "TC-003-0[467]" --project=chromium` passes (3 tests)

- [x] T7 — Test the guest redirect and the alerts for unknown and malformed ids
  - Covers: RF-8, RF-9, RF-10 / TC-003-10, TC-003-11, TC-003-12
  - Depends on: T4
  - Files:
    - src/pages/product-detail-page.ts (alert locators)
    - tests/ui/product-detail-navigation.spec.ts (TC-003-10 with the guest `test`; TC-003-12 as `test.fail()`, plan D-5)
  - Done when: `npx playwright test tests/ui/product-detail-navigation.spec.ts --grep "TC-003-1[0-2]" --project=chromium` reports TC-003-10 and TC-003-11 passed and TC-003-12 as an expected failure (exit code 0)

- [x] T8 — Test the detail page against a mocked detail answer
  - Covers: RF-2, RF-3, RF-4 / TC-003-05
  - Depends on: T4
  - Files: tests/mocked/product-detail-mocked-answer.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/mocked/product-detail-mocked-answer.spec.ts --grep "TC-003-05" --project=chromium` passes (1 test)

## Cross-browser, secrets and traceability

- [x] T9 — Run the suite on all browsers, scan the artifacts and update the traceability matrix
  - Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; Spec 001 RF-27 on the new tests)
  - Depends on: T1 to T8
  - Files:
    - docs/traceability.md (regenerated)
    - specs/003-product-detail/implementation.md
  - Done when:
    - `npx playwright test --grep "TC-003-" --project=api --project=chromium` passes, then `--project=firefox` and `--project=webkit` pass (`--workers=2`, one invocation per project), with TC-003-12 and TC-003-16 as the only expected failures;
    - `npm run check:secrets` exits 0 after each run;
    - `npm run test:unit` passes;
    - `npm run spec:check -- --write` passes with no Spec 003 warning.

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-003-01 | T5 |
| TC-003-02 | T5 |
| TC-003-03 | T4 |
| TC-003-04 | T6 |
| TC-003-05 | T8 |
| TC-003-06 | T6 |
| TC-003-07 | T6 |
| TC-003-08 | T4 |
| TC-003-09 | T4 |
| TC-003-10 | T7 |
| TC-003-11 | T7 |
| TC-003-12 | T7 |
| TC-003-13 | T1 |
| TC-003-14 | T1 |
| TC-003-15 | T2 |
| TC-003-16 | T2 |
| TC-003-17 | T3 |
| TC-003-18 | T3 |
| TC-003-19 | T3 |
