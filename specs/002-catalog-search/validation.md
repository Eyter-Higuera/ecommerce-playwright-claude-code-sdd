# Validation — Spec 002 Catalog and search

Date: 2026-10-09 · Branch: eyter_dev · Commit: working tree on top of ad4a2a0 (Spec 002 not committed yet)
Spec: specs/002-catalog-search/spec.md

## Requirement coverage
Playwright results come from the TC-002 runs on api, chromium, firefox and webkit (UI and mocked
tests run on all three browsers). Every expected result is computed from the catalog read through
the product API in the same test (spec clarification 2).

| RF | Test cases | Tests (file › title) | Result |
|----|------------|----------------------|--------|
| RF-1 | TC-002-01, 04 | tests/ui/catalog-listing.spec.ts › TC-002-01 dashboard shows one card per catalog product · tests/mocked/catalog-mocked-answer.spec.ts › TC-002-04 empty product API answer shows no card and Showing 0 results | PASS |
| RF-2 | TC-002-01, 04, 05 | catalog-listing.spec.ts › TC-002-01 · catalog-mocked-answer.spec.ts › TC-002-05 cards show the name and price of each product in the API answer, TC-002-04 | PASS |
| RF-3 | TC-002-02, 04 | catalog-listing.spec.ts › TC-002-02 product cards show View and Add To Cart controls · catalog-mocked-answer.spec.ts › TC-002-04 | PASS |
| RF-4 | TC-002-03, 04, 06, 11 | catalog-listing.spec.ts › TC-002-03 result counter equals the number of product cards · tests/ui/catalog-search.spec.ts › TC-002-06, TC-002-11 · TC-002-04 | PASS |
| RF-5 | TC-002-06 to 09, 26 | catalog-search.spec.ts › TC-002-06 search with the start of a product name shows only matching products, TC-002-07 search with a complete product name shows that product, TC-002-08 search in another letter case or from the middle of a name shows no product, TC-002-09 search with surrounding or only spaces shows no product · tests/api/product-api.spec.ts › TC-002-26 | PASS |
| RF-6 | TC-002-10, 11 | catalog-search.spec.ts › TC-002-10 clearing the search text shows all products again, TC-002-11 | PASS |
| RF-7 | TC-002-04, 06, 08, 11, 23 | catalog-search.spec.ts › TC-002-11 search without matches shows no card and Showing 0 results, TC-002-08, TC-002-06 · tests/ui/catalog-filters.spec.ts › TC-002-23 · TC-002-04 | PASS |
| RF-8 | TC-002-12, 06 | catalog-search.spec.ts › TC-002-12 injection-style search opens no dialog and shows no card | PASS |
| RF-9 | TC-002-13, 14, 27 | catalog-filters.spec.ts › TC-002-13 price range equal to a catalog price includes its products, TC-002-14 price range just above or below a price excludes its products · product-api.spec.ts › TC-002-27 | PASS |
| RF-10 | TC-002-15, 13, 27 | catalog-filters.spec.ts › TC-002-15 minimum above maximum shows no product · TC-002-27 | PASS |
| RF-11 | TC-002-16, 13, 27 | catalog-filters.spec.ts › TC-002-16 non-numeric or single price bound is ignored · TC-002-27 | PASS |
| RF-12 | TC-002-17, 20, 21, 28 | catalog-filters.spec.ts › TC-002-17 each Categories option alone shows exactly its catalog products, TC-002-20 a filter option without catalog products shows no card, TC-002-21 · TC-002-28 | PASS |
| RF-13 | TC-002-18, 20, 28 | catalog-filters.spec.ts › TC-002-18 each Sub Categories option alone shows exactly its catalog products, TC-002-20 · TC-002-28 | PASS |
| RF-14 | TC-002-19, 20, 21, 28 | catalog-filters.spec.ts › TC-002-19 each Search For option alone shows exactly its catalog products, TC-002-20, TC-002-21 · TC-002-28 | PASS |
| RF-15 | TC-002-21, 22, 23, 28 | catalog-filters.spec.ts › TC-002-21 two options of the same group show the products of either option, TC-002-22 search, price and options of several groups show only products matching all, TC-002-23 a combination that no product satisfies shows no card · TC-002-28 | PASS |
| RF-16 | TC-002-10, 24, 22 | catalog-filters.spec.ts › TC-002-24 clearing criteria one at a time restores the matching products · TC-002-10 | PASS |
| RF-17 | TC-002-25, 32 | product-api.spec.ts › TC-002-25 product API without criteria returns the catalog contract | PASS |
| RF-18 | TC-002-26 to 29 | product-api.spec.ts › TC-002-26 product API name search matches the start of the name in the same letter case, TC-002-27 product API price range uses inclusive bounds and ignores invalid bounds, TC-002-28 product API combines filter groups with OR within a group and AND across groups, TC-002-29 | PASS |
| RF-19 | TC-002-29, 25 | product-api.spec.ts › TC-002-29 product API without matches answers No Products Found | PASS |
| RF-20 | TC-002-30, 25 | product-api.spec.ts › TC-002-30 product API with injection-style names answers below 500 with no product | PASS |
| RF-21 | TC-002-31, 25 | product-api.spec.ts › TC-002-31 product API with pattern special characters answers below 500 | KNOWN DEFECT (expected failure, plan D-5): the API answers HTTP 500 for `(`, `[` and `TEST_*(`; the test fails as expected and the run passes |
| RF-22 | TC-002-32, 25 | tests/api/product-authorization.spec.ts › TC-002-32 product API without Authorization answers 401 | PASS |
| RF-23 | TC-002-33, 25 | product-authorization.spec.ts › TC-002-33 product API with a tampered token answers 401 | PASS |
| RF-24 | TC-002-34, 25 | product-authorization.spec.ts › TC-002-34 product API with a malformed token answers 401 | PASS |
| RF-25 | TC-002-27, 25 | product-api.spec.ts › TC-002-27 (two non-numeric bounds → "No Products Found") | PASS |

All 25 RFs are covered. All 34 TCs are `Automate: Y`, and each has a test whose title starts with
its ID (spec:check: 0 warnings).

## Manual test cases (Automate: N)
| Test case | Reason | Result |
|-----------|--------|--------|
| — | Spec 002 has no manual test case | — |

## Quality gates
| Gate | Result | Notes |
|------|--------|-------|
| Playwright: `npx playwright test --grep "TC-002-"`, run as `--project=api --project=chromium`, `--project=firefox` and `--project=webkit` (`--workers=2`) | PASS | 34 + 24 + 24 = 82 passed · 0 failed · 0 skipped · 0 flaky. TC-002-31 is counted as passed because it failed as expected (D-5). Split by project because of local memory limits |
| Full regression (T15): `npx playwright test --project=api --project=chromium` | PASS | 74 passed (Specs 000, 001 and 002) |
| `npm run check:secrets` (after each run) | PASS | No password or token in reports/, playwright-report/, test-results/ |
| `npm run test:unit` | PASS | 26 files, 100 passed |
| `npm run lint` | PASS | 0 errors. 10 warnings, all in two Spec 001 files (`tests/api/auth-login-api.spec.ts`, `tests/api/user-authorization.spec.ts`); 0 in Spec 002 files (see Issues) |
| `npm run typecheck` | PASS | |
| `npm run spec:check` | PASS | 3 specs, 0 warnings; docs/traceability.md regenerated in T15 (314 rows) |
| Test review checklist | PASS | Applied per task (T1 to T15). Findings fixed: helper assertions (`expect-expect`, T2), a conditional in TC-002-23 (T14). One justified CSS fallback (`.card-body`); the filter panel is scoped by the `form` element because it has no role or label |
| CI pipeline on `eyter_dev` | PENDING | Spec 002 is not committed or pushed yet |

## Done criteria
- [x] Every RF has approved test cases.
- [x] All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit (TC-002-31 is the approved expected failure, D-5).
- [x] test-reviewer PASS.
- [x] `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- [ ] The pipeline on `eyter_dev` is green. Pending: needs a commit and push to `eyter_dev`.
- [ ] User validation.

## Issues found
- **Known defect (RF-21, spec Known issues).** The product API answers HTTP 500 for a name with an
  unbalanced `(` or `[`. TC-002-31 is an approved expected failure (plan D-5). When the shop fixes
  the defect, the test will fail as "unexpectedly passed", which is the signal to remove the marker.
- **Spec changes during implementation, approved by the user:** T4 Mode C added RF-25 (two price
  bounds with a non-number match nothing in the API), and RF-11 now names the filter panel
  (clarification 11). T6 widened the Known issues note from `(` to `(` and `[`.
- **Possible defect, not a requirement of this spec (T15).** The shop does not discard answers to
  superseded product requests. On firefox, two price requests sent at once rendered the older
  answer. The tests now commit one bound at a time, as a customer would; the assertions were not
  changed.
- **Test-data deviation (T14).** TC-002-23 names a Categories option the product lacks. The current
  catalog (all electronics, mobiles, women) has none, so per plan D-6 the test used another
  product's price ("ADIDAS" + 55000 to 55000). The RF-15 intent is kept.
- **Catalog risk.** The page shows at most 9 products. With more than 9 catalog products, TC-002-01
  would see only the first page (pagination is out of scope; the catalog has 3 products today).
- **Lint warnings outside this spec.** The 10 warnings in two Spec 001 files were already present
  at commit ad4a2a0. Spec 001 `validation.md` records "0 warnings", which is inaccurate. Not fixed
  here.
- No RF without coverage, no unexpected failing test, no `Automate: Y` TC without a test, and no
  open `[NEEDS CLARIFICATION]`.

## Verdict
The spec IS fulfilled locally, but two Done criteria are open. All 25 RFs are covered and every
check passes on api, chromium, firefox and webkit: 82 tests, with TC-002-31 the approved expected
failure. Unit tests, lint (0 errors), typecheck, spec:check and check:secrets all pass. Still open:
the `eyter_dev` pipeline (Spec 002 is not pushed yet) and the user's confirmation.
