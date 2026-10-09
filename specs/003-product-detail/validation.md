# Validation — Spec 003 Product detail

Date: 2026-10-09 · Branch: eyter_dev · Commit: f31dc8f
Spec: specs/003-product-detail/spec.md

## Requirement coverage
Playwright results come from the TC-003 runs on api, chromium, firefox and webkit (UI and mocked
tests run on all three browsers). Products and expected data come from the catalog and the product
detail API read in the same test; every catalog product is checked.

| RF | Test cases | Tests (file › title) | Result |
|----|------------|----------------------|--------|
| RF-1 | TC-003-01, 04, 06 | tests/ui/product-detail.spec.ts › TC-003-01 View on each catalog card opens that product's detail route, TC-003-04 two products with the same price open different detail pages, TC-003-06 viewing a second product after Continue Shopping shows the second product | PASS |
| RF-2 | TC-003-02, 04, 05, 06 | product-detail.spec.ts › TC-003-02 detail page shows the name, price and description of each catalog product, TC-003-04, TC-003-06 · tests/mocked/product-detail-mocked-answer.spec.ts › TC-003-05 detail page shows the name, price and description of the API answer | PASS |
| RF-3 | TC-003-02, 05, 06 | product-detail.spec.ts › TC-003-02, TC-003-06 · product-detail-mocked-answer.spec.ts › TC-003-05 | PASS |
| RF-4 | TC-003-02, 05, 06 | product-detail.spec.ts › TC-003-02, TC-003-06 · product-detail-mocked-answer.spec.ts › TC-003-05 | PASS |
| RF-5 | TC-003-03, 10 | product-detail.spec.ts › TC-003-03 detail page shows an enabled Add to Cart control · tests/ui/product-detail-guest.spec.ts › TC-003-10 | PASS |
| RF-6 | TC-003-07, 06 | tests/ui/product-detail-navigation.spec.ts › TC-003-07 Continue Shopping returns to the dashboard with the whole catalog · TC-003-06 | PASS |
| RF-7 | TC-003-08, 09, 10 | product-detail-navigation.spec.ts › TC-003-08 opening the detail URL directly shows the product, TC-003-09 reloading the detail page keeps the product · TC-003-10 | PASS |
| RF-8 | TC-003-10, 08 | product-detail-guest.spec.ts › TC-003-10 detail URL without a session redirects to the login page | PASS |
| RF-9 | TC-003-11, 08 | product-detail-navigation.spec.ts › TC-003-11 detail route with an unknown id shows the Product not found alert · TC-003-08 (no alert) | PASS |
| RF-10 | TC-003-12, 08 | product-detail-navigation.spec.ts › TC-003-12 detail route with a malformed id shows a readable alert | KNOWN DEFECT (expected failure, plan D-5): the alert reads "[object Object]"; the test fails as expected on all three browsers and the run passes |
| RF-11 | TC-003-13, 15 | tests/api/product-detail-api.spec.ts › TC-003-13 product detail API returns the contract for every catalog product | PASS |
| RF-12 | TC-003-14, 15 | product-detail-api.spec.ts › TC-003-14 product detail API returns the same data as the catalog | PASS |
| RF-13 | TC-003-15, 13 | product-detail-api.spec.ts › TC-003-15 product detail API with an unknown id answers 400 Product not found | PASS |
| RF-14 | TC-003-16, 15 | product-detail-api.spec.ts › TC-003-16 product detail API with malformed ids answers 4xx without internal details | KNOWN DEFECT (expected failure, plan D-5): all 6 malformed ids expose the database error, 5 with HTTP 500 |
| RF-15 | TC-003-17, 13 | tests/api/product-detail-authorization.spec.ts › TC-003-17 product detail API without Authorization answers 401 | PASS |
| RF-16 | TC-003-18, 13 | product-detail-authorization.spec.ts › TC-003-18 product detail API with a tampered token answers 401 | PASS |
| RF-17 | TC-003-19, 13 | product-detail-authorization.spec.ts › TC-003-19 product detail API with a malformed token answers 401 | PASS |

All 17 RFs are covered. All 19 TCs are `Automate: Y`, and each has a test whose title starts with
its ID (spec:check: 0 warnings).

## Manual test cases (Automate: N)
| Test case | Reason | Result |
|-----------|--------|--------|
| — | Spec 003 has no manual test case | — |

## Quality gates
| Gate | Result | Notes |
|------|--------|-------|
| Playwright: `npx playwright test --grep "TC-003-"`, run as `--project=api --project=chromium`, `--project=firefox` and `--project=webkit` (`--workers=2`) | PASS | 19 + 12 + 12 = 43 passed · 0 failed · 0 skipped · 0 flaky. Expected failures counted as passed: TC-003-12 (each browser) and TC-003-16 (api), plan D-5 |
| Full regression (T9): `npx playwright test --project=api --project=chromium` | PASS | 93 passed (Specs 000 to 003) |
| `npm run check:secrets` (after each run) | PASS | No password or token in reports/, playwright-report/, test-results/ |
| `npm run test:unit` | PASS | 26 files, 100 passed |
| `npm run lint` | PASS | 0 errors. 10 warnings, all in two Spec 001 files; 0 in Spec 003 files |
| `npm run typecheck` | PASS | |
| `npm run spec:check` | PASS | 4 specs, 0 warnings; docs/traceability.md regenerated in T9 (31 Spec 003 rows, all automated) |
| Test review checklist | PASS | Applied per task (T1 to T9); findings fixed: a lost regex backslash in TC-003-12 (T7), and TC-003-10 unseen by spec:check (T9). No CSS selector in Spec 003 code; every locator is role-based |
| CI pipelines for f31dc8f | PASS | eyter_dev 2929304712 · release 2929316144 (full regression on api, chromium, firefox, webkit) · main 2929370020 · production 2929400663: all success. Automatic promotion merged each stage |

## Done criteria
- [x] Every RF has approved test cases.
- [x] All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit (TC-003-12 and TC-003-16 are the approved expected failures, D-5).
- [x] test-reviewer PASS.
- [x] `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- [x] The pipeline on `eyter_dev` is green (2929304712; the chain continued green up to production 2929400663).
- [x] User validation (confirmed by the user on 2026-10-09).

## Issues found
- **Known defect (RF-14, spec Known issues).** A malformed id makes the product detail API expose
  its database error ("CastError", "Cast to ObjectId failed …"): 5 of the 6 tested ids also answer
  HTTP 500. TC-003-16 is an approved expected failure (plan D-5).
- **Known defect (RF-10, spec Known issues).** The UI then shows the alert "[object Object]".
  TC-003-12 is an approved expected failure (plan D-5). Each of these tests fails the run as
  "unexpectedly passed" once the shop fixes its defect, which is the signal to remove the marker.
- **Known issue without a requirement.** For an unknown or malformed id, the page stays on an empty
  product with a lone "$" and an "Add to Cart" control (spec Known issues).
- **Deviation from the plan (T9).** TC-003-10 lives in `tests/ui/product-detail-guest.spec.ts`
  instead of the navigation file, because spec:check reads only `test(...)` and `it(...)` calls. The
  plan's coverage map was updated.
- **Catalog risk.** The page shows at most 9 products. TC-003-01 clicks only cards on the first
  page; TC-003-02 and the API tests cover every catalog product.
- **Lint warnings outside this spec.** The 10 warnings in two Spec 001 files remain (see Spec 002
  validation).
- No RF without coverage, no unexpected failing test, no `Automate: Y` TC without a test, and no
  open `[NEEDS CLARIFICATION]`.

## Verdict
The spec IS fulfilled. All 17 RFs are covered and every check passes on api, chromium, firefox and
webkit: 43 tests, with TC-003-12 and TC-003-16 the approved expected failures. Unit tests, lint
(0 errors), typecheck, spec:check and check:secrets all pass. In CI, commit f31dc8f went green
through eyter_dev, release (full regression), main and production. The user confirmed it as
validated on 2026-10-09.
