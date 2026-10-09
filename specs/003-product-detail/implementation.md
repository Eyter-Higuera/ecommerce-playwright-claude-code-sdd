# Implementation Log — Spec 003 Product detail

Spec: specs/003-product-detail/spec.md · Tasks: specs/003-product-detail/tasks.md

## T1 — Add the product detail API call and schema, with the contract and catalog-consistency tests

Date: 2026-10-09 · Covers: RF-11, RF-12 / TC-003-13, TC-003-14

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-detail-api.spec.ts | NEW | TC-003-13, TC-003-14 (every catalog product) |
| src/config/urls.ts | UPDATED | `PRODUCT_DETAIL_PATH`, `buildProductDetailUrl` (id URL-encoded) |
| src/api/product-messages.ts | UPDATED | `DETAIL_FETCHED`, `PRODUCT_NOT_FOUND` |
| src/api/schemas/product.schema.ts | UPDATED | Optional `productDescription` in `productSchema` (plan D-2); `productDetailSchema` (RF-11) |
| src/api/product-client.ts | UPDATED | `getProductDetail(id, authorization?)`, raw `ApiResult` |
| src/data/catalog-data.ts | UPDATED | `detailFields(product)`: the six RF-12 fields |

### Test run
Command: `npx playwright test tests/api/product-detail-api.spec.ts --grep "TC-003-1[34]" --project=api`
Result: 2 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-003-13/14 pass (2 tests), and the Spec 002 API tests still pass | PASS (2 passed; 10 passed) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS (warnings only for Spec 003 TCs not implemented yet) |

### Assumptions and findings
- The live detail API matched RF-11 and RF-12 for the 3 catalog products: 200, "Product Details
  fetched Successfully", the requested `_id`, and the same six fields as the catalog.

## T2 — Test the detail API with unknown and malformed ids

Date: 2026-10-09 · Covers: RF-12, RF-13, RF-14 / TC-003-15, TC-003-16

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-detail-api.spec.ts | UPDATED | TC-003-15; TC-003-16 as `test.fail()` with an `issue` annotation and soft assertions (plan D-5); `outcomeOf()` |
| src/data/catalog-data.ts | UPDATED | `PRODUCT_ID_LENGTH`, `UNKNOWN_PRODUCT_ID`, `MALFORMED_PRODUCT_ID`, `unknownIdLike`, `idOfLength` |
| src/api/product-messages.ts | UPDATED | `hasCleanMessage(json)`: the message is a string with no "CastError" or "ObjectId". Not listed in the task's Files; it keeps the RF-14 check out of the test body |

### Test run
Command: `npx playwright test tests/api/product-detail-api.spec.ts --grep "TC-003-1[56]" --project=api`
Result: 2 passed (TC-003-15 passed; TC-003-16 failed as expected) · 0 unexpected failures · exit code 0 (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-003-15 passed and TC-003-16 reported as an expected failure (exit code 0) | PASS (JSON report: TC-003-16 expected `failed`, status `expected`) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- RF-13 holds: the all-zero id and a forged catalog id answer 400 "Product not found" with no data.
- Known defect (RF-14), as the spec records. All 6 malformed ids expose the database error in
  `message`: `TEST_not_an_id`, the 23- and 25-character ids, and the 3 injection-style inputs.
  Five also answer HTTP 500. `<script>alert('TEST')</script>` answers a 4xx status, but its message
  still holds the internal error.

## T3 — Test the detail API authorization

Date: 2026-10-09 · Covers: RF-15, RF-16, RF-17 / TC-003-17, TC-003-18, TC-003-19

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/product-detail-authorization.spec.ts | NEW | TC-003-17 to TC-003-19; `outcomeOf()` and `refusal()`, as in Spec 002 |

### Test run
Command: `npx playwright test tests/api/product-detail-authorization.spec.ts --grep "TC-003-1[7-9]" --project=api`
Result: 3 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/product-detail-authorization.spec.ts --grep "TC-003-1[7-9]" --project=api` passes (3 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- None. The live API answered exactly as RF-15 to RF-17 state.

## T4 — Add the product detail page and test direct opening, reload and the Add to Cart control

Date: 2026-10-09 · Covers: RF-5, RF-7, RF-9, RF-10 / TC-003-03, TC-003-08, TC-003-09

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/product-detail.spec.ts | NEW | TC-003-03 (`loggedInTest`, `NO_TRACE`) |
| tests/ui/product-detail-navigation.spec.ts | NEW | TC-003-08, TC-003-09 (`loggedInTest`, `NO_TRACE`) |
| src/pages/product-detail.constants.ts | NEW | `PRODUCT_DETAIL` texts and levels, `priceText(price)` |
| src/pages/product-detail-page.ts | NEW | `ProductDetailPage`: name, price, description, Add to Cart, Continue Shopping link, alert; `open(id)` through `about:blank` (plan D-3) |
| src/config/urls.ts | UPDATED | `PRODUCT_DETAIL_ROUTE`, `buildProductDetailRoute`, `productDetailRoutePattern` (with `escapeRegExp`) |
| src/fixtures/test.ts | UPDATED | `productDetailPage` fixture |

### Test run
Command: `npx playwright test tests/ui/product-detail.spec.ts tests/ui/product-detail-navigation.spec.ts --grep "TC-003-0[389]" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (3 tests); description locator and D-3 recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live probe, 2026-10-09):
  - the description is the `<p>` next to the level-6 "product details" heading inside one
    container, so it is located by role: that heading, its parent, then `getByRole('paragraph')`;
  - D-3: after `about:blank`, opening another product's detail route showed the new product, with
    the session intact, on chromium, firefox and webkit;
  - the name heading's text is the stored name ("ADIDAS ORIGINAL"); the tests compare it ignoring
    letter case anyway.

## T5 — Test View navigation and the detail content of every catalog product

Date: 2026-10-09 · Covers: RF-1, RF-2, RF-3, RF-4 / TC-003-01, TC-003-02

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/product-detail.spec.ts | UPDATED | TC-003-01 (View on every card of the first page), TC-003-02 (content of every catalog product); `test.slow()` for both loops |
| src/components/product-list.ts | UPDATED | `cardNamed(name)`, `view(name)` (plan D-4) |
| src/pages/product-detail-page.ts | UPDATED | `answerFor(id)`: the detail API answer of one product (plan D-4). Not listed in the task's Files; the plan places the wait in the Page Object |
| src/data/catalog-data.ts | UPDATED | `MAX_PRODUCTS_PER_PAGE`, `productsOnFirstPage(catalog)`. Not listed in the task's Files; it names the 9-product page limit |

### Test run
Command: `npx playwright test tests/ui/product-detail.spec.ts --grep "TC-003-0[12]" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/product-detail.spec.ts --grep "TC-003-0[12]" --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- Each of the 3 cards opened its own detail route, including the two products priced 11500, and
  every detail page showed its catalog name, price and description.
- The title of TC-003-01 is written in double quotes because it contains an apostrophe; spec:check
  reads it like the others.

## T6 — Test Continue Shopping, equal-price products and viewing a second product

Date: 2026-10-09 · Covers: RF-1, RF-2, RF-3, RF-4, RF-6 / TC-003-04, TC-003-06, TC-003-07

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/product-detail.spec.ts | UPDATED | TC-003-04 (two products with one price; plan D-6), TC-003-06 (A, Continue Shopping, B) |
| tests/ui/product-detail-navigation.spec.ts | UPDATED | TC-003-07 |
| src/pages/product-detail-page.ts | UPDATED | `continueShopping()` |
| src/data/catalog-data.ts | UPDATED | `productsWithSamePrice`, `twoNamedProducts` |

### Test run
Command: `npx playwright test tests/ui/product-detail.spec.ts tests/ui/product-detail-navigation.spec.ts --grep "TC-003-0[467]" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (3 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- The current catalog provided both inputs (no `catalog-gap`): ADIDAS ORIGINAL and ZARA COAT 3 share
  the price 11500 and open different detail routes; after "Continue Shopping", the second product's
  page showed only its own data. Navigating dashboard → detail through "View" creates a new detail
  view, unlike a hash change between two detail routes.

## T7 — Test the guest redirect and the alerts for unknown and malformed ids

Date: 2026-10-09 · Covers: RF-8, RF-9, RF-10 / TC-003-10, TC-003-11, TC-003-12

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/product-detail-navigation.spec.ts | UPDATED | TC-003-10 (guest `test`, no stored session), TC-003-11, TC-003-12 as `test.fail()` with an `issue` annotation (plan D-5) |
| src/pages/product-detail-page.ts | UPDATED | `alertNamed(text)` |

### Test run
Command: `npx playwright test tests/ui/product-detail-navigation.spec.ts --grep "TC-003-1[0-2]" --project=chromium`
Result: 3 passed (TC-003-10 and TC-003-11 passed; TC-003-12 failed as expected) · 0 unexpected failures · exit code 0 (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-003-10 and TC-003-11 passed, TC-003-12 an expected failure (exit code 0) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- RF-8 and RF-9 hold: a guest is sent to `#/auth/login`, and an unknown id shows the alert
  "Product not found".
- Known defect (RF-10), as the spec records: TC-003-12 fails on
  `not.toHaveAccessibleName("[object Object]")`. The alert keeps that name until it disappears.
  Once the shop shows a readable message, the assertion passes at once, and the test reports
  "unexpectedly passed".
- Process note: the first draft lost a backslash (`/S/` instead of `/\S/`) while the edit script
  was generated. With that regex, TC-003-12 failed for the wrong reason (the text did not contain
  a capital S). It was fixed before closing, and the failure reason was checked in the JSON report.

## T8 — Test the detail page against a mocked detail answer

Date: 2026-10-09 · Covers: RF-2, RF-3, RF-4 / TC-003-05

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/mocked/product-detail-mocked-answer.spec.ts | NEW | TC-003-05 (`page.route` on the detail API only; real page and API session; `NO_TRACE`) |

### Test run
Command: `npx playwright test tests/mocked/product-detail-mocked-answer.spec.ts --grep "TC-003-05" --project=chromium`
Result: 1 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (1 test) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 002/003 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- The page rendered the mocked `test_detail_product` with "$ 0" and `TEST_description`. The test
  waits for the mocked answer before asserting, so it proves that the mock reached the page. The
  mocked product uses the all-zero id, so it cannot be confused with a real one.

## T9 — Run the suite on all browsers, scan the artifacts and update the traceability matrix

Date: 2026-10-09 · Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; Spec 001 RF-27 on the new tests)

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| docs/traceability.md | UPDATED | Regenerated; all 31 Spec 003 rows `automated` |
| specs/003-product-detail/implementation.md | UPDATED | This entry |
| tests/ui/product-detail-guest.spec.ts | NEW | TC-003-10 moved here (see findings) |
| tests/ui/product-detail-navigation.spec.ts | UPDATED | TC-003-10 removed; header comment |
| specs/003-product-detail/plan.md | UPDATED | Coverage map: TC-003-10 in its own file |

### Test run
Commands (`--workers=2`, one invocation per project):
- `npx playwright test --grep "TC-003-" --project=api --project=chromium` → 19 passed (TC-003-12 and TC-003-16 expected failures) · 0 failed · 0 flaky
- `npx playwright test --grep "TC-003-" --project=firefox` → 12 passed (TC-003-12 expected failure) · 0 failed · 0 flaky
- `npx playwright test --grep "TC-003-" --project=webkit` → 12 passed (TC-003-12 expected failure) · 0 failed · 0 flaky
- After moving TC-003-10: guest and navigation files on chromium, firefox and webkit → 6 passed each
- Extra regression: `npx playwright test --project=api --project=chromium` (Specs 000 to 003) → 93 passed
- `npm run test:unit` → 26 files, 100 passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-003 passes on api, chromium, firefox and webkit, with TC-003-12 and TC-003-16 the only expected failures | PASS (19 + 12 + 12) |
| Done when: `npm run check:secrets` exits 0 after each run | PASS |
| Done when: `npm run test:unit` passes | PASS (100 passed) |
| Done when: `npm run spec:check -- --write` passes with no Spec 003 warning | PASS (0 warnings, after the move below) |
| Test review checklist | PASS |
| Lint | PASS (0 errors; only the 10 earlier Spec 001 warnings) |
| typecheck | PASS |

### Assumptions and findings
- First `spec:check -- --write`: WARNING "TC-003-10 is marked Automate: Y but no test title starts
  with it". The test was declared as `guestTest(...)`, and spec:check reads only `test(...)` and
  `it(...)` calls (`scripts/spec-check/scan-titles.ts`). Instead of changing the Spec 000 scanner,
  TC-003-10 moved to `tests/ui/product-detail-guest.spec.ts`, where the plain `test` (no stored
  session) is used under its own name. The plan's coverage map was updated. The test ran on the
  three browsers afterwards.
- No flaky test and no unexpected failure on any browser.
