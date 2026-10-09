# Validation — Spec 004 Cart

Date: 2026-10-09 · Branch: eyter_dev · Commit: 793e4d5
Spec: specs/004-cart/spec.md

## Requirement coverage
Playwright results come from the TC-004 runs on api, chromium, firefox and webkit (UI and mocked
tests run on all three browsers). Every test registers its own TEST_ customer and empties its cart
afterwards; products and prices come from the catalog read in the same test.

| RF | Test cases | Tests (file › title) | Result |
|----|------------|----------------------|--------|
| RF-1 | TC-004-01, 08 | tests/ui/cart-add.spec.ts › TC-004-01 Add To Cart on a product card adds it to the cart · tests/ui/cart-page.spec.ts › TC-004-08 empty cart page shows the empty message | PASS |
| RF-2 | TC-004-02, 12 | cart-add.spec.ts › TC-004-02 adding a product shows the Product Added To Cart alert · tests/ui/cart-remove.spec.ts › TC-004-12 | PASS |
| RF-3 | TC-004-01, 03, 08 | cart-add.spec.ts › TC-004-03 header count follows the number of products in the cart, TC-004-01 · TC-004-08 | PASS |
| RF-4 | TC-004-04, 05, 16 | cart-add.spec.ts › TC-004-04 Add to Cart on the product detail page adds the product, TC-004-05 · tests/ui/cart-guest.spec.ts › TC-004-16 | PASS |
| RF-5 | TC-004-05, 03 | cart-add.spec.ts › TC-004-05 adding a product already in the cart keeps a single line | PASS |
| RF-6 | TC-004-06, 10, 08 | cart-page.spec.ts › TC-004-06 cart page lists each product with its catalog price · tests/mocked/cart-mocked-answer.spec.ts › TC-004-10 cart page shows the names, prices and totals of the cart answer | PASS |
| RF-7 | TC-004-07, 10, 30 | cart-page.spec.ts › TC-004-07 Subtotal and Total equal the sum of the line prices · TC-004-10 · cart-remove.spec.ts › TC-004-30 totals are recomputed after removing a product | PASS (TC-004-07, 10) · KNOWN DEFECT (TC-004-30, expected failure) |
| RF-8 | TC-004-08, 12, 06 | cart-page.spec.ts › TC-004-08 · cart-remove.spec.ts › TC-004-12 removing the last product shows the empty state | PASS |
| RF-9 | TC-004-09, 14 | cart-page.spec.ts › TC-004-09 Continue Shopping returns from the cart to the dashboard · tests/ui/cart-session.spec.ts › TC-004-14 | PASS |
| RF-10 | TC-004-11, 20, 14, 30 | cart-remove.spec.ts › TC-004-11 removing one of two products updates the lines and count · tests/api/cart-api.spec.ts › TC-004-20 · TC-004-30 | PASS (lines, count, server) · KNOWN DEFECT (totals after a removal: TC-004-30, expected failure) |
| RF-11 | TC-004-12, 11 | cart-remove.spec.ts › TC-004-12 | PASS |
| RF-12 | TC-004-13, 11 | cart-remove.spec.ts › TC-004-13 the remove control has an accessible name | KNOWN DEFECT (expected failure, plan D-5): the remove control has no accessible name |
| RF-13 | TC-004-14, 16 | cart-session.spec.ts › TC-004-14 reloading the cart page keeps its lines | PASS |
| RF-14 | TC-004-15, 16 | cart-session.spec.ts › TC-004-15 signing out and back in keeps the cart | KNOWN DEFECT (expected failure, clarification 8): every new login empties the cart |
| RF-15 | TC-004-16, 14 | cart-guest.spec.ts › TC-004-16 cart route without a session redirects to the login page | PASS |
| RF-16 | TC-004-17, 24 | cart-api.spec.ts › TC-004-17 cart API adds a catalog product · tests/api/cart-authorization.spec.ts › TC-004-24 | PASS |
| RF-17 | TC-004-18, 19 | cart-api.spec.ts › TC-004-18 cart API lists and counts the products of the cart | PASS |
| RF-18 | TC-004-19, 18 | cart-api.spec.ts › TC-004-19 cart API answers No Product in Cart for an empty cart | PASS |
| RF-19 | TC-004-20, 26 | cart-api.spec.ts › TC-004-20 cart API removes a product from the cart | PASS |
| RF-20 | TC-004-21, 17 | tests/api/cart-integrity.spec.ts › TC-004-21 cart API keeps the catalog price when a different price is sent | KNOWN DEFECT (expected failure): prices 0, 1 and catalog − 1 are kept |
| RF-21 | TC-004-22, 24 | cart-integrity.spec.ts › TC-004-22 cart API rejects a product that is not in the catalog | KNOWN DEFECT (expected failure): the unknown product is accepted |
| RF-22 | TC-004-23, 24 | cart-integrity.spec.ts › TC-004-23 cart API rejects an add request without a product | KNOWN DEFECT (expected failure): no 4xx (HTTP 500, later 200 observed) |
| RF-23 | TC-004-24, 17 | cart-authorization.spec.ts › TC-004-24 adding to another customer's cart is refused | PASS |
| RF-24 | TC-004-25, 18 | cart-authorization.spec.ts › TC-004-25 listing another customer's cart is refused | PASS |
| RF-25 | TC-004-26, 20 | cart-authorization.spec.ts › TC-004-26 removing from another customer's cart is refused | PASS |
| RF-26 | TC-004-27, 17 | cart-authorization.spec.ts › TC-004-27 cart endpoints without Authorization answer 401 | PASS |
| RF-27 | TC-004-28, 17 | cart-authorization.spec.ts › TC-004-28 cart endpoints with a tampered token answer 401 | PASS |
| RF-28 | TC-004-29, 17 | cart-authorization.spec.ts › TC-004-29 cart endpoints with a malformed token answer 401 | PASS |

All 28 RFs are covered. All 30 TCs are `Automate: Y`, and each has a test whose title starts with
its ID (spec:check: 0 warnings).

## Manual test cases (Automate: N)
| Test case | Reason | Result |
|-----------|--------|--------|
| — | Spec 004 has no manual test case | — |

## Quality gates
| Gate | Result | Notes |
|------|--------|-------|
| Playwright: `npx playwright test --grep "TC-004-"`, run as `--project=api --project=chromium`, `--project=firefox` and `--project=webkit` (`--workers=2`) | PASS | 30 + 17 + 17 = 64 passed · 0 failed · 0 skipped · 0 flaky. Expected failures counted as passed: TC-004-21, 22, 23 (api) and TC-004-13, 15, 30 (each browser), plan D-5 |
| Full regression (T11): `npx playwright test --project=api --project=chromium` | PASS | 123 passed (Specs 000 to 004, on the new fetch transport), including the 9 known expected failures |
| `npm run check:secrets` (after each run) | PASS | No password or token in reports/, playwright-report/, test-results/; 0 hits for the generated customer-password pattern |
| `npm run test:unit` | PASS | 26 files, 100 passed |
| `npm run lint` | PASS | 0 errors. 10 warnings, all in two Spec 001 files; 0 in Spec 004 files |
| `npm run typecheck` | PASS | |
| `npm run spec:check` | PASS | 5 specs, 0 warnings; docs/traceability.md regenerated in T11 (67 Spec 004 rows, all automated) |
| Test review checklist | PASS | Applied per task (T1 to T11); findings fixed: helper-only assertions, a conditional in a test body, a schema check that could never fail (T1). One justified CSS fallback: the nameless remove control (plan D-6) |
| CI pipelines for 793e4d5 | PASS | eyter_dev 2929700319 · release 2929719481 (full regression of Specs 000 to 004 on api, chromium, firefox, webkit, on the fetch transport) · main 2929835324 · production 2929865697: all success. Automatic promotion merged each stage |

## Done criteria
- [x] Every RF has approved test cases.
- [x] All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit (TC-004-13, 15, 21, 22, 23 and 30 are the approved expected failures, D-5).
- [x] test-reviewer PASS.
- [x] `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- [x] The pipeline on `eyter_dev` is green (2929700319; the chain continued green up to production 2929865697).
- [x] User validation (confirmed by the user on 2026-10-09).

## Issues found
- **Known defects of the shop (expected failures, plan D-5):**
  - RF-20 (revenue-critical): the cart keeps a price sent by the client (TC-004-21).
  - RF-21: a product that is not in the catalog is accepted (TC-004-22).
  - RF-22: adding without a product is not a 4xx (500, later 200) (TC-004-23).
  - RF-12 (accessibility): the remove control has no accessible name (TC-004-13).
  - RF-10/RF-7 (revenue-critical, found in T9): after a removal the page shows the old total plus the
    remaining price until a reload (TC-004-30, spec clarification 7).
  - RF-14 (found in T10): every new login empties the cart on the server (TC-004-15, clarification 8).
- **Framework change (T11, plan D-9, approved by the user):** every API client now uses Node's `fetch`
  through `FetchRequestContext`. With Playwright's `request`, a dropped connection left the
  `Authorization` header in the HTML report (call log of the recorded step); `check:secrets` caught it.
  The same path existed for the fixed account A token in Specs 001 to 003. `docs/test-plan.md` was
  updated.
- **Data left on the shop:** every test registers a TEST_ customer that cannot be deleted (about 60
  per full regression, plus the probes and the local runs of this spec); every cart is emptied.
- **Network instability of the shop:** "socket hang up" was seen during T11; cleanup retries absorb it
  in teardown, and CI retries cover it inside tests.
- **Lint warnings outside this spec:** the 10 warnings in two Spec 001 files remain.
- No RF without coverage, no unexpected failing test, no `Automate: Y` TC without a test, and no open
  `[NEEDS CLARIFICATION]`.

## Verdict
The spec IS fulfilled. All 28 RFs are covered and every check passes on api, chromium, firefox
and webkit: 64 tests, with the six approved expected failures for the shop's known defects. Unit
tests, lint (0 errors), typecheck, spec:check and check:secrets all pass. In CI, commit 793e4d5 went
green through eyter_dev, release (full regression on the fetch transport), main and production. The
user confirmed it as validated on 2026-10-09.
