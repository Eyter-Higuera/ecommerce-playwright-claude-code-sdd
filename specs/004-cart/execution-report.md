# Execution Report — Spec 004 Cart

Spec: specs/004-cart/spec.md · Tasks: specs/004-cart/tasks.md ·
Log: specs/004-cart/implementation.md

This report is updated each time a task is completed. A task row reflects the task's
`Done when:` command; a file row reflects the tests that exercise that file.

Legend: ✅ = passed · ❌ = failed

## Summary
| Tasks completed | Passed | Failed |
|-----------------|--------|--------|
| 11 / 11 | ✅ 11 | ❌ 0 |

## Results
| Task / File | Purpose | Passed | Failed |
|-------------|---------|:------:|:------:|
| **T1 — Add the test customer fixture and the cart API calls, with the add and empty-cart tests** | Done when: TC-004-17 and TC-004-19 pass (2 tests); check:secrets exits 0; user-authorization.spec.ts still passes (4 tests) | ✅ |  |
| tests/api/cart-api.spec.ts | TC-004-17: catalog product added → 200 "Product Added To Cart", cart lists it · TC-004-19: empty cart → list and count "No Product in Cart", no product | ✅ |  |
| src/fixtures/customer.ts, src/fixtures/test.ts, src/data/customer-data.ts | TEST_ customer per test: register, API login, cart emptied and checked in teardown; password never exposed | ✅ |  |
| src/api/user-client.ts, src/api/auth-client.ts, src/api/schemas/cart.schema.ts, src/api/cart-messages.ts, src/config/urls.ts | Cart API calls, registration, cart contracts and messages, URLs | ✅ |  |
| **T2 — Test listing, counting and removing through the cart API** | Done when: TC-004-18 and TC-004-20 pass (2 tests) | ✅ |  |
| tests/api/cart-api.spec.ts | TC-004-18: two products → list "Cart Data Found" with both, count 2 on both endpoints · TC-004-20: remove one → "Product Removed from cart", only the other left | ✅ |  |
| **T3 — Test cart data integrity (known defects as expected failures)** | Done when: TC-004-21 to 23 reported as expected failures (exit code 0); check:secrets exits 0 | ✅ |  |
| tests/api/cart-integrity.spec.ts | TC-004-21: prices 0, 1, 11499 kept (defect RF-20) · TC-004-22: unknown product accepted (defect RF-21) · TC-004-23: no product → HTTP 200, not 4xx (defect RF-22); all expected failures (plan D-5) | ✅ |  |
| **T4 — Add the second customer and test isolation between carts** | Done when: TC-004-24 to 26 pass (3 tests) | ✅ |  |
| tests/api/cart-authorization.spec.ts | TC-004-24: add to another cart → 400 "Not Authorized!", other cart empty · TC-004-25: list another cart → 4xx, nothing disclosed · TC-004-26: remove from another cart → 4xx, product kept | ✅ |  |
| src/fixtures/test.ts | `secondCustomer` | ✅ |  |
| **T5 — Test the cart API authorization** | Done when: TC-004-27 to 29 pass (3 tests) | ✅ |  |
| tests/api/cart-authorization.spec.ts | TC-004-27/28/29: add, list, count and remove → 401 without token ("Access denied. No token provided."), with a tampered or a malformed token ("Session Timeout") | ✅ |  |
| **T6 — Add the cart page, the header count and the customer browser session, with the cart page tests** | Done when: TC-004-06 to 09 pass (4 tests); check:secrets exits 0 | ✅ |  |
| tests/ui/cart-page.spec.ts | TC-004-06: two lines with their catalog prices · TC-004-07: Subtotal = Total = $23000 · TC-004-08: empty message, no line, no number in the header · TC-004-09: Continue Shopping → dashboard | ✅ |  |
| src/pages/cart-page.ts, src/pages/cart.constants.ts, src/fixtures/test.ts, src/config/urls.ts | `CartPage`; cart texts; `cartPage`, `cartTest`; cart route | ✅ |  |
| **T7 — Test the cart page against a mocked cart answer** | Done when: TC-004-10 passes (1 test) | ✅ |  |
| tests/mocked/cart-mocked-answer.spec.ts | TC-004-10: mocked TEST_ products at $0 and $999999 → both lines and totals of $999999 | ✅ |  |
| **T8 — Test adding products from the dashboard and the detail page** | Done when: TC-004-01, 02, 04 and 05 pass (4 tests) | ✅ |  |
| tests/ui/cart-add.spec.ts | TC-004-01: card add → header 1, server cart holds it · TC-004-02: "Product Added To Cart" alert · TC-004-04: detail add → header 1, server cart holds it · TC-004-05: same product twice → one line, count 1 | ✅ |  |
| src/components/product-list.ts, src/pages/product-detail-page.ts, src/pages/cart-page.ts | `addToCart` on cards and detail; `addAnswer` wait | ✅ |  |
| **T9 — Test removing products and the header count transitions** | Done when: TC-004-03, 11, 12 pass; TC-004-13 and 30 expected failures. First run failed on the totals; resolved by Mode C (TC-004-30, clarification 7) | ✅ | |
| tests/ui/cart-remove.spec.ts | TC-004-11: one of two removed → one line, header 1, server cart right · TC-004-12: last removed → empty state · TC-004-13: no accessible name (defect RF-12) · TC-004-30: totals $34500 instead of $11500 until a reload (defect RF-10/RF-7); both expected failures | ✅ | |
| tests/ui/cart-add.spec.ts | TC-004-03: header count none → 1 → 2 → 1 → none | ✅ | |
| src/pages/cart-page.ts, src/pages/cart.constants.ts | `remove`, `removeAnswer`, `removeButtonOf` (CSS fallback) | ✅ | |
| **T10 — Test the cart across reloads, sign-ins and without a session** | Done when: TC-004-14 and 16 pass, TC-004-15 an expected failure. First run failed: the shop empties the cart on every new login; kept as a known defect (clarification 8) | ✅ | |
| tests/ui/cart-session.spec.ts | TC-004-14: reload keeps the line and price · TC-004-15: cart empty after Sign Out and a new login (defect RF-14, expected failure) | ✅ | |
| tests/ui/cart-guest.spec.ts | TC-004-16: cart route without a session → login | ✅ | |
| src/pages/dashboard-page.ts | `startSession` (plan D-4) | ✅ | |
| **T11 — Run the suite on all browsers, scan the artifacts and update the traceability matrix** | Done when: TC-004 green on all projects (TC-004-13, 15, 21, 22, 23, 30 expected failures only); check:secrets after each run; test:unit; spec:check --write. First rounds: token leak through Playwright call logs; resolved by plan D-9 (fetch transport) | ✅ | |
| Full suite on api + chromium (Specs 000 to 004) | 123 passed, including the 9 known expected failures · 0 flaky | ✅ | |
| TC-004 on firefox | 17 passed (TC-004-13, 15, 30 expected failures) | ✅ | |
| TC-004 on webkit | 17 passed (TC-004-13, 15, 30 expected failures) | ✅ | |
| npm run check:secrets | Passed after each final run; 0 hits for the generated-password pattern | ✅ | |
| npm run test:unit | 26 files, 100 passed | ✅ | |
| src/api/fetch-request-context.ts, src/fixtures/test.ts, src/api/api-result.ts | Node `fetch` transport for every API client; failed calls rethrown without request details | ✅ | |
| docs/traceability.md | Regenerated; 67 Spec 004 rows, all automated; spec:check 0 warnings | ✅ | |
