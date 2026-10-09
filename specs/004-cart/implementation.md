# Implementation Log — Spec 004 Cart

Spec: specs/004-cart/spec.md · Tasks: specs/004-cart/tasks.md

## T1 — Add the test customer fixture and the cart API calls, with the add and empty-cart tests

Date: 2026-10-09 · Covers: RF-16, RF-18 / TC-004-17, TC-004-19

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/cart-api.spec.ts | NEW | TC-004-17, TC-004-19 |
| src/config/urls.ts | UPDATED | `AUTH_REGISTER_PATH`, `CART_API_PATHS` and their URL builders |
| src/api/api-result.ts | UPDATED | `delete` on `ApiRequestContext` |
| src/api/auth-client.ts | UPDATED | `register(body)`, raw `ApiResult`; the body is never logged |
| src/api/user-client.ts | UPDATED | `addToCart`, `getCartProducts`, `removeFromCart`; `headersFor()` |
| src/api/cart-messages.ts | NEW | `CART_API_MESSAGES` |
| src/api/schemas/cart.schema.ts | NEW | `cartListSchema`, `cartCountSchema`, `emptyCartSchema` |
| src/data/customer-data.ts | NEW | `buildTestCustomer(workerIndex)`: TEST_ names, unique TEST_ email (`uniqueValue`), generated password |
| src/errors/messages.ts | UPDATED | `customerSetupFailedMessage(step, status)` |
| src/fixtures/customer.ts | NEW | `registerCustomer`, `emptyCart`, `TestCustomer`. Not listed in the task's Files; keeps the registration and cleanup out of test.ts and keeps the password inside one function |
| src/fixtures/test.ts | UPDATED | `customer` fixture: register → API login → test → empty the cart |

### Test run
Command: `npx playwright test tests/api/cart-api.spec.ts --grep "TC-004-1[79]" --project=api`
Result: 2 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-004-17/19 pass (2 tests); check:secrets exits 0; user-authorization.spec.ts still passes; upper-case TEST_ email recorded | PASS (2 passed; check:secrets passed; 4 passed) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS (warnings only for Spec 004 TCs not implemented yet) |

### Assumptions and findings
- TODO: VERIFY resolved (live probe, 2026-10-09): an upper-case `TEST_…@example.test` email registers
  and logs in when typed exactly as registered; the lower-cased email is rejected (as Spec 001 RF-19).
- The teardown empties the cart and checks that it is empty, so TC-004-17 also proved the cleanup:
  the cart it filled was empty afterwards.
- `check:secrets` scans only the `.env` values, so it cannot see the generated passwords. As an extra
  check, the artifacts were searched for their pattern (`TEST_` + 24 hex characters + `A1!`): 0 hits in
  reports/, playwright-report/ and test-results/ (plain files; the HTML report's embedded data is
  compressed and not covered by this search).
- First draft of `emptyCartSchema` checked for "no count" after zod had already stripped unknown
  keys, so the check could never fail; it was removed (RF-18 is judged on the message and products).
- Data created on the shop by this task: 2 TEST_ customers per run (accounts cannot be deleted).

## T2 — Test listing, counting and removing through the cart API

Date: 2026-10-09 · Covers: RF-17, RF-19 / TC-004-18, TC-004-20

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/cart-api.spec.ts | UPDATED | TC-004-18 (two products listed and counted), TC-004-20 (one of two removed) |

### Test run
Command: `npx playwright test tests/api/cart-api.spec.ts --grep "TC-004-(18|20)" --project=api`
Result: 2 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- None. List and count agreed (`count` 2), and the removal left only the other product (`count` 1).

## T3 — Test cart data integrity (known defects as expected failures)

Date: 2026-10-09 · Covers: RF-20, RF-21, RF-22 / TC-004-21, TC-004-22, TC-004-23

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/cart-integrity.spec.ts | NEW | TC-004-21 (prices 0, 1, catalog − 1), TC-004-22 (`TEST_ghost` with an unknown id), TC-004-23 (no product); each `test.fail()` with an `issue` annotation (plan D-5); helpers `isClientError`, `clientPriceIgnored`, `listedIds` |
| specs/004-cart/spec.md | UPDATED | Known issues: the RF-22 observation now records both answers seen (500, then 200); the requirement is unchanged |

### Test run
Command: `npx playwright test tests/api/cart-integrity.spec.ts --grep "TC-004-2[1-3]" --project=api`
Result: 3 passed (all three failed as expected) · 0 unexpected failures · exit code 0 (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the 3 tests reported as expected failures (exit code 0), and check:secrets exits 0 | PASS (JSON report: expected `failed`, status `expected` for each) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- Each test failed for the reason of its defect (JSON report):
  - TC-004-21: prices 0, 1 and 11499 were all kept, not refused or replaced by 11500 (RF-20);
  - TC-004-22: the unknown `TEST_ghost` product was accepted and listed (RF-21);
  - TC-004-23: adding without a product answered **HTTP 200**. The spec probe had seen HTTP 500. Both
    break RF-22 (a 4xx is required), so the defect stands; only its observation changed.
- The fixture teardown removed the ghost product too, so every customer cart ended empty.

## T4 — Add the second customer and test isolation between carts

Date: 2026-10-09 · Covers: RF-23, RF-24, RF-25 / TC-004-24, TC-004-25, TC-004-26

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| src/fixtures/test.ts | UPDATED | `secondCustomer` fixture (same lifecycle as `customer`) |
| tests/api/cart-authorization.spec.ts | NEW | TC-004-24 to TC-004-26; customer 2's cart is always judged with customer 2's own token (plan D-8) |

### Test run
Command: `npx playwright test tests/api/cart-authorization.spec.ts --grep "TC-004-2[4-6]" --project=api`
Result: 3 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (3 tests); RF-24 and RF-25 recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09, two real TEST_ customers):
  - RF-23: adding to another customer's cart → 400 "Not Authorized!", the other cart stays empty;
  - RF-24: listing another customer's cart → a 4xx status and none of its products;
  - RF-25: removing from another customer's cart → a 4xx status, and the product stays in the other
    cart.
- Data created on the shop by this task: 6 TEST_ customers per run (two per test).

## T5 — Test the cart API authorization

Date: 2026-10-09 · Covers: RF-26, RF-27, RF-28 / TC-004-27, TC-004-28, TC-004-29

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/cart-authorization.spec.ts | UPDATED | TC-004-27 to TC-004-29 over the four cart endpoints (add, list, count, remove); helpers `callEveryCartEndpoint`, `refusalOf` |

### Test run
Command: `npx playwright test tests/api/cart-authorization.spec.ts --grep "TC-004-2[7-9]" --project=api`
Result: 3 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (3 tests); RF-27 and RF-28 recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09): on all four cart endpoints, no Authorization header →
  401 "Access denied. No token provided."; a tampered token and a malformed token → 401
  "Session Timeout", as in Spec 001.

## T6 — Add the cart page, the header count and the customer browser session, with the cart page tests

Date: 2026-10-09 · Covers: RF-6, RF-7, RF-8, RF-9 / TC-004-06, TC-004-07, TC-004-08, TC-004-09

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/cart-page.spec.ts | NEW | TC-004-06 to TC-004-09 (`cartTest`, `NO_TRACE`; cart lines set up through the API, plan D-3) |
| src/pages/cart.constants.ts | NEW | `CART` texts and patterns; `lineMoneyText`, `totalText`, `cartButtonText` (header count, RF-3) |
| src/pages/cart-page.ts | NEW | `CartPage`: lines, `lineNamed`, `priceOf`, Subtotal, Total, empty message, Continue Shopping |
| src/fixtures/test.ts | UPDATED | `cartPage` fixture; `cartTest` (browser session of the test's own customer, with the trace guard) |
| src/config/urls.ts | UPDATED | `CART_ROUTE`, `buildCartUrl`. Not listed in the task's Files; `CartPage.open()` needs the route |
| src/components/nav-bar.ts | UNCHANGED | The plan's `cartCount()` was not needed: the header count is asserted on the existing `cartButton` with `cartButtonText(n)`, a web-first assertion |

### Test run
Command: `npx playwright test tests/ui/cart-page.spec.ts --grep "TC-004-0[6-9]" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (4 tests); check:secrets exits 0; line price locator recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS (and 0 hits for the generated-password pattern in the artifacts) |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09): `getByText(/^\$\s*\d/)` inside a line matches only the line
  price "$ 11500" and skips "MRP $ 11500".
- TC-004-07 used the two products priced 11500, so the totals were checked at $23000.

## T7 — Test the cart page against a mocked cart answer

Date: 2026-10-09 · Covers: RF-6, RF-7 / TC-004-10

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/mocked/cart-mocked-answer.spec.ts | NEW | TC-004-10 (`page.route` on the cart products call only; real page and customer session; `NO_TRACE`) |

### Test run
Command: `npx playwright test tests/mocked/cart-mocked-answer.spec.ts --grep "TC-004-10" --project=chromium`
Result: 1 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (1 test) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS |

### Assumptions and findings
- The page rendered both mocked TEST_ products with "$ 0" and "$ 999999", and the totals as $999999.
  The test waits for the mocked answer, so it proves the mock reached the page. The mock lives only
  in the browser; the fixture teardown still uses the real cart API.

## T8 — Test adding products from the dashboard and the detail page

Date: 2026-10-09 · Covers: RF-1, RF-2, RF-3, RF-4, RF-5 / TC-004-01, TC-004-02, TC-004-04, TC-004-05

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/cart-add.spec.ts | NEW | TC-004-01, 02, 04, 05 (`cartTest`, `NO_TRACE`); each UI add is confirmed through the cart API (plan D-7) |
| src/components/product-list.ts | UPDATED | `addToCart(name)` |
| src/pages/product-detail-page.ts | UPDATED | `addToCart()` |
| src/pages/cart-page.ts | UPDATED | `addAnswer()`: the next add-to-cart answer. Not listed in the task's Files; it keeps the wait in a Page Object |

### Test run
Command: `npx playwright test tests/ui/cart-add.spec.ts --grep "TC-004-0[1245]" --project=chromium`
Result: 4 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: the command passes (4 tests); RF-4 recorded | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS (and 0 hits for the generated-password pattern) |

### Assumptions and findings
- TODO: VERIFY resolved (live, 2026-10-09): "Add to Cart" on the product detail page sends the same
  `POST /user/add-to-cart` as the card button, and the product reaches the server cart (RF-4).
- Adding the same product from the card and then from the detail page kept one line and a count of 1
  (RF-5).

## T9 — Test removing products and the header count transitions

Date: 2026-10-09 · Covers: RF-3, RF-7, RF-10, RF-11, RF-12 / TC-004-03, TC-004-11, TC-004-12, TC-004-13, TC-004-30

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/cart-remove.spec.ts | NEW | TC-004-11 (line, header count, server cart), TC-004-12, TC-004-13 and TC-004-30 as `test.fail()` (plan D-5) |
| tests/ui/cart-add.spec.ts | UPDATED | TC-004-03 (header count: none → 1 → 2 → 1 → none) |
| src/pages/cart-page.ts | UPDATED | `removeAnswer()`, `removeButtonOf(name)` (CSS fallback, plan D-6), `remove(name)` |
| src/pages/cart.constants.ts | UPDATED | `REMOVE_BUTTON_SELECTOR`, `REMOVE_ACTION_NAME` |
| specs/004-cart/spec.md, test-cases.md, plan.md, tasks.md | UPDATED | Mode C approved by the user (clarification 7): TC-004-11 no longer checks totals; new TC-004-30 checks them as a known defect; Known issue added |

### Test run
Command: `npx playwright test tests/ui/cart-remove.spec.ts tests/ui/cart-add.spec.ts --grep "TC-004-(03|1[1-3]|30)" --project=chromium`
Result: 5 passed (TC-004-03, 11, 12 passed; TC-004-13 and TC-004-30 failed as expected) · 0 unexpected failures · exit code 0 (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-004-03, 11, 12 passed and TC-004-13, 30 expected failures (exit code 0) | PASS (JSON report: both expected failures fail on their defect's assertion) |
| Test review checklist | PASS (one justified CSS fallback for the nameless remove control, plan D-6) |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS (and 0 hits for the generated-password pattern) |

### Assumptions and findings
- First run: TC-004-11 FAILED on the totals: after removing one of two products at 11500, the page
  showed "Subtotal$34500" instead of $11500. An independent probe with a fresh TEST_ customer
  reproduced it: $23000 before, $34500 after the removal, $11500 after a reload; the server cart was
  right. The work stopped and the defect was reported instead of weakening the assertion.
- The user chose option 1 (Mode C): the defect is now TC-004-30, an expected failure, and TC-004-11
  keeps the checks that pass (line, header count, server cart).
- TC-004-13 fails on `toHaveAccessibleName(/remove|delete/i)`: the remove control has no accessible
  name (RF-12, known defect).

## T10 — Test the cart across reloads, sign-ins and without a session

Date: 2026-10-09 · Covers: RF-13, RF-14, RF-15 / TC-004-14, TC-004-15, TC-004-16

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/cart-session.spec.ts | NEW | TC-004-14; TC-004-15 as `test.fail()` with an `issue` annotation (spec clarification 8, plan D-5) |
| tests/ui/cart-guest.spec.ts | NEW | TC-004-16 (plain `test`, no customer, `NO_TRACE`) |
| src/pages/dashboard-page.ts | UPDATED | `startSession(token)` (plan D-4: store the token through `evaluate`, open the dashboard, reload) |
| specs/004-cart/spec.md, test-cases.md, plan.md, tasks.md | UPDATED | Known issue and clarification 8 approved by the user; TC-004-15 marked as a known defect |

### Test run
Command: `npx playwright test tests/ui/cart-session.spec.ts tests/ui/cart-guest.spec.ts --grep "TC-004-1[4-6]" --project=chromium`
Result: 3 passed (TC-004-14 and 16 passed; TC-004-15 failed as expected) · 0 unexpected failures · exit code 0 (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-004-14 and 16 passed, TC-004-15 an expected failure (exit code 0); check:secrets exits 0 | PASS (JSON report: TC-004-15 fails on the cart line count after the new login) |
| Test review checklist | PASS |
| Lint | PASS (0 warnings in Spec 004 files) |
| typecheck | PASS |
| spec:check | PASS |
| check:secrets | PASS (and 0 hits for the generated-password pattern) |

### Assumptions and findings
- First run: TC-004-15 FAILED (cart lines: expected 1, received 0). Probes with fresh TEST_ customers
  showed the cause: **every new login empties the cart on the server**. A second API login alone
  took the cart from 1 product to 0; opening the cart and Sign Out did not change it. The work
  stopped and the defect was reported.
- The user chose option 1: RF-14 stays a requirement and TC-004-15 is a known defect (expected
  failure).
- Debugging note: a first fix attempt (reloading after storing the new token) did not change the
  result; it was kept as harmless and closer to a real login, and its comment says only that.
- Consequence for test design: a test must never log its customer in twice before checking the cart
  (the fixture logs in once; `newSession()` is used only by TC-004-15).

## T11 — Run the suite on all browsers, scan the artifacts and update the traceability matrix

Date: 2026-10-09 · Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; no password or token in artifacts)

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| src/api/fetch-request-context.ts | NEW | `FetchRequestContext`: Node `fetch` transport for every API client (plan D-9, approved by the user); network errors keep only the system code or "timed out" (Spec 000 RF-57 still classifies them) |
| src/fixtures/test.ts | UPDATED | `apiRequest` fixture; `authClient`, `userClient` and `productClient` use it instead of Playwright's `request` |
| src/api/api-result.ts | UPDATED | `sendSafely(call)`: a failed call is rethrown with its first line only |
| src/api/auth-client.ts, src/api/product-client.ts, src/api/user-client.ts | UPDATED | The 8 raw HTTP calls go through `sendSafely` |
| src/fixtures/customer.ts | UPDATED | `emptyCart` retries the cleanup up to 3 times on a network failure |
| docs/test-plan.md | UPDATED | API test level: Playwright Test with Node `fetch` (`FetchRequestContext`) |
| specs/004-cart/plan.md | UPDATED | Decision D-9 |
| docs/traceability.md | UPDATED | Regenerated; 67 Spec 004 rows, all `automated` |

### Test run
Commands (`--workers=2`, one invocation per project), final round:
- `npx playwright test --project=api --project=chromium` (Specs 000 to 004, after the transport change) → 123 passed, including the 9 known expected failures (TC-002-31, TC-003-12, TC-003-16, TC-004-13, 15, 21, 22, 23, 30) · 0 unexpected failures
- `npx playwright test --grep "TC-004-" --project=firefox` → 17 passed (TC-004-13, 15, 30 expected failures)
- `npx playwright test --grep "TC-004-" --project=webkit` → 17 passed (TC-004-13, 15, 30 expected failures)
- `npm run test:unit` → 26 files, 100 passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-004 green on api, chromium, firefox and webkit, with TC-004-13, 15, 21, 22, 23 and 30 the only expected failures | PASS |
| Done when: `npm run check:secrets` exits 0 after each run | PASS (final round; plus 0 hits for the generated-password pattern) |
| Done when: `npm run test:unit` passes | PASS |
| Done when: `npm run spec:check -- --write` passes with no Spec 004 warning | PASS (0 warnings) |
| Test review checklist | PASS |
| Lint | PASS (0 errors; only the 10 earlier Spec 001 warnings) |
| typecheck | PASS |

### Assumptions and findings
- First round: TC-004-10 (chromium) and TC-004-08 (firefox) failed with "socket hang up" in the fixture
  teardown, after their assertions had passed, and **check:secrets failed**: Playwright's error call log
  listed the request headers, `Authorization` included, and it reached the reports.
- Second round, with `sendSafely` and cleanup retries: chromium and firefox clean; on webkit a dropped
  connection inside a test still left a token in the HTML report, because Playwright stores the call
  log in the step it records for every `request` call. The work stopped and the issue was reported.
- The user chose option 1 (plan D-9): every API client now uses Node's built-in `fetch` through
  `FetchRequestContext`, which records no report steps. No dependency was added. The whole api and
  chromium suite of Specs 000 to 004 passed on the new transport, and every check:secrets run was clean.
- The same leak path existed for the fixed account A token in Specs 001 to 003; it is closed by the
  same change.
