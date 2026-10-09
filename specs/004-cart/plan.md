# Plan — Spec 004 Cart

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/004-cart/spec.md · Test cases: specs/004-cart/test-cases.md

## Context
This plan automates the 29 test cases of Spec 004: adding products, the cart page, removing
products, the session around the cart, the cart API, cart data integrity, and isolation between
customers. It is the first spec that changes data on the shop, so its core is a **test customer
fixture** that registers a fresh `TEST_` customer per test and always empties its cart afterwards.

Main approach:
- **Reuse first.**
  - Spec 000: `uniqueValue()` for unique `TEST_` values per worker, `requireEnv`, the timeouts.
  - Spec 001: `AuthClient.loginSession`, `ApiResult`, `tamperToken`, `MALFORMED_AUTHORIZATION`,
    `AUTH_API_MESSAGES`, `NO_TRACE` and the trace guard, `NavBar` (Cart button, Sign Out).
  - Spec 002 and 003: the `catalog` fixture, `ProductList` (`cardNamed`), `DashboardPage`,
    `ProductDetailPage`, `testProduct`, `requireCatalogInput` (plan D-6).
- **Test customers (D-1).** A test-scoped `customer` fixture registers a customer through
  `POST /auth/register`, logs it in through the API, and empties its cart in teardown, also when
  the test fails. A `secondCustomer` fixture gives isolation tests a second, independent customer.
  The generated password lives only inside the fixture.
- **Cart API.** `UserClient` (already holding `getCartCount`) gains `addToCart`, `getCartProducts`
  and `removeFromCart`, each returning the raw `ApiResult`.
- **UI.** A new `CartPage` holds the cart route, its lines, totals, empty state and remove
  controls. `NavBar` reads the header count; `ProductList` and `ProductDetailPage` gain
  `addToCart` actions.
- **Known defects** (TC-004-13, 21, 22, 23) run as expected failures, as Spec 002 D-5 (D-5 below,
  approved).

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ | No new dependency (`node:crypto` for the password, as in Spec 000) |
| 2 | Spec first | ✔ | Spec `test-cases-approved`; every test title starts with its TC-004 ID |
| 3 | Separation of concerns | ✔ | Locators in `CartPage`, `NavBar`, `ProductList`, `ProductDetailPage`; HTTP in `UserClient` and `AuthClient`; customer data in the factory |
| 4 | Test quality | ✔ | No `waitForTimeout`: web-first assertions and API checks. One justified CSS fallback: the remove control has no accessible name (RF-12) |
| 5 | Data and secrets | ✔ | Created data: `TEST_` customers (unique per worker and run) and their cart lines, emptied in teardown. The customer password is generated per test and never logged, attached or written. No trace (Spec 001 RF-27). The accounts themselves cannot be deleted (spec non-functional requirements) |
| 6 | Language | ✔ | English |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1 to RF-5 | TC-004-01 to TC-004-05 | ui | tests/ui/cart-add.spec.ts |
| RF-6 to RF-9 | TC-004-06 to TC-004-09 | ui | tests/ui/cart-page.spec.ts |
| RF-6, RF-7 | TC-004-10 | mocked | tests/mocked/cart-mocked-answer.spec.ts |
| RF-10 to RF-12, RF-7 | TC-004-11 to TC-004-13, TC-004-30 | ui | tests/ui/cart-remove.spec.ts |
| RF-13, RF-14 | TC-004-14, TC-004-15 | ui | tests/ui/cart-session.spec.ts |
| RF-15 | TC-004-16 | ui | tests/ui/cart-guest.spec.ts (plain `test`, no customer) |
| RF-16 to RF-19 | TC-004-17 to TC-004-20 | api | tests/api/cart-api.spec.ts |
| RF-20 to RF-22 | TC-004-21 to TC-004-23 | api | tests/api/cart-integrity.spec.ts |
| RF-23 to RF-28 | TC-004-24 to TC-004-29 | api | tests/api/cart-authorization.spec.ts |

Every TC is `Automate: Y`. The negative-side RFs a TC also covers (see test-cases.md) live in the
same file as the TC. Expected failures (D-5): TC-004-13, TC-004-21, TC-004-22, TC-004-23, TC-004-30 (added in T9
by Mode C, spec clarification 7) and TC-004-15 (found in T10, spec clarification 8).

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| CartPage (NEW) | src/pages/cart-page.ts | `open()`; lines, `lineNamed(name)`, line price, Subtotal, Total, empty message, "Continue Shopping", `remove(name)` (covers RF-6 to RF-13) | Line: `getByRole('listitem').filter({ has: getByRole('heading', { level: 3 }) })`; name: the level-3 heading; price: `getByText(/^\$\s*\d/)` inside the line (`// TODO: VERIFY` against the "MRP $" text); Subtotal / Total: `getByRole('listitem').filter({ hasText: /^Subtotal/ })`; empty: `getByRole('heading', { name: 'No Products in Your Cart !' })`; "Continue Shopping": `getByRole('button', { name: /Continue Shopping/ })` (a button here, a link on the detail page); remove: `line.locator('button.btn-danger')`, the only CSS fallback, justified by RF-12 |
| CART constants (NEW) | src/pages/cart.constants.ts | Texts, the money pattern and `moneyText(amount)` | — |
| NavBar (REUSED, extended) | src/components/nav-bar.ts | `cartCount()`: the number after "Cart" in the header button, or `undefined` (covers RF-3) | Existing `cartButton` (`/^\W*Cart\b/`) |
| ProductList (REUSED, extended) | src/components/product-list.ts | `addToCart(name)`: "Add To Cart" on the card found by name (covers RF-1, RF-2) | Existing `addToCartButtonOf(cardNamed(name))` |
| ProductDetailPage (REUSED, extended) | src/pages/product-detail-page.ts | `addToCart()` (covers RF-4, RF-5) | Existing `addToCartButton` |
| DashboardPage (REUSED, extended) | src/pages/dashboard-page.ts | `startSession(token)`: stores a session token in the page and reloads (TC-004-15, D-4) | — |

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|
| UserClient (REUSED, extended) | src/api/user-client.ts | `addToCart(userId, product, authorization?)` → `POST /user/add-to-cart` with `{ _id, product }` (the body is passed as given, so tests can send altered products or none); `getCartProducts(userId, authorization?)` → `GET /user/get-cart-products/{userId}`; `removeFromCart(userId, productId, authorization?)` → `DELETE /user/remove-from-cart/{userId}/{productId}`; `getCartCount` unchanged (covers RF-16 to RF-28) |
| ApiRequestContext (REUSED, extended) | src/api/api-result.ts | Adds `delete(url, { headers, timeout })` |
| AuthClient (REUSED, extended) | src/api/auth-client.ts | `register(body)` → `POST /auth/register`, raw `ApiResult`; the body (with the password) is never logged |
| Cart schemas (NEW) | src/api/schemas/cart.schema.ts | `cartListSchema`: "Cart Data Found", `products` of `productSchema`, `count` = length (RF-17); `cartCountSchema`: "Cart Data Found" with a numeric `count`; `emptyCartSchema`: "No Product in Cart" and no products (RF-18) |
| CART_API_MESSAGES (NEW) | src/api/cart-messages.ts | "Product Added To Cart", "Cart Data Found", "No Product in Cart", "Product Removed from cart", "Not Authorized!" |
| URL builders (REUSED, extended) | src/config/urls.ts | `CART_ROUTE_PATTERN` exists; adds the four cart API paths and builders, and `AUTH_REGISTER_PATH` |
| Error messages (REUSED, extended) | src/errors/messages.ts | `customerSetupFailedMessage(step, status)`: names the step (register, login) and the status, never the email or password |

## Fixtures and test data
- **Customer factory (src/data/customer-data.ts, NEW):** `buildTestCustomer(workerIndex)` returns
  a registration body: `TEST_` first and last names, email `<uniqueValue('cart', worker)>@example.test`
  (lower-cased if the shop requires it, `// TODO: VERIFY`), a generated password
  (`node:crypto`, letters, digits and a symbol), and fixed `TEST_`-safe values for role,
  occupation, gender and a `0000000000` mobile.
- **Fixtures (src/fixtures/test.ts):**
  - `customer` (NEW, test-scoped): register → API login → `{ userId, token, email }`; the
    password stays in the fixture closure. Teardown lists the cart and removes every product, and
    then checks that the cart is empty; a failed cleanup fails the test with a clear message.
  - `secondCustomer` (NEW): the same, independent of `customer` (TC-004-24 to 26).
  - `cartTest` (NEW): `test.extend` with `storageState` holding `customer.token`, guarded by the
    Spec 001 trace check (as `loggedInTest`), for UI tests.
  - `cartPage` (NEW); `catalog` (REUSED; read with the fixed account A token, which only reads).
- **Mocked answer (TC-004-10):** `testProduct({ productName: 'TEST_Cart_Zero', productPrice: 0 })`
  and `testProduct({ productName: 'test_cart_big', productPrice: 999999 })`, answered as
  `{ products, count, message }`.
- **Cleanup guarantee:** the cart of every test customer is emptied in fixture teardown; accounts
  remain (no delete API). The fixed accounts A and B are never used to write.

## Mocking strategy
- **Mocked UI (TC-004-10):** `page.route('**/user/get-cart-products/**', …)` answers the two `TEST_`
  products; the cart route and the session are real. The test waits for the mocked answer.
- **Real environment:** everything else. Cart lines are set up through the API (faster and
  independent of the UI), except where the UI action is under test (TC-004-01 to 05, 11 to 13).
- **No unit tests:** no TC targets framework code. The password generator is exercised by every
  cart test.

## Locator strategy
- **Verified live on 2026-10-09:**
  - Cart route `#/dashboard/cart`, heading "My Cart", "Continue Shopping❯" is a **button** there.
  - Each line is a list item with a level-3 heading (the name), "#<id>", "MRP $ 11500",
    "In Stock", "$ 11500", "Buy Now" and an icon-only remove button (`btn-danger`, no name).
  - Totals: list items "Subtotal $11500" and "Total $11500" (no space after `$`, unlike the line
    price "$ 11500").
  - Empty cart: heading "No Products in Your Cart !".
  - Header: "Cart" with the count appended ("Cart 1"); no number when empty.
- **Not yet verified (`// TODO: VERIFY`):**
  - the line price locator that skips "MRP $ …";
  - "Add to Cart" on the detail page calls the same cart API (RF-4);
  - registration with an upper-case `TEST_` email local part, and login with it.

## Test file layout, tags and browsers
- UI files use `cartTest` with `test.use(NO_TRACE)`: `cart-add`, `cart-page`, `cart-remove`,
  `cart-session`. `cart-guest.spec.ts` uses the plain `test` with `NO_TRACE` (as Spec 003 T9).
- Describes by scenario type: positive / negative / boundary / security, per file.
- Tags from the test cases: TC-004-01 and TC-004-17 are `@smoke`; P1 TCs carry `@critical`.
- **Browsers:** UI and mocked tests on chromium, firefox and webkit; API tests in the `api`
  project. Smoke adds TC-004-01 on chromium and TC-004-17 on `api`.
- **Waits:** after a UI add or remove, the test waits for the cart API answer of that action
  (`page.waitForResponse` in the Page Object), then asserts with web-first assertions.

## Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| D-1 | One freshly registered `TEST_` customer per test, created and cleaned by a test-scoped fixture | Interview Q2: the cart is per account and server-side, so per-test customers make tests independent and safe in parallel across workers and browsers | The fixed account A in serial mode (slow, collides between CI jobs); a worker-scoped customer (tests in one worker would share a cart) |
| D-2 | The customer password is generated in the fixture with `node:crypto`, kept only in its closure, and never logged; the UI never types it | A generated password is still a secret: `check:secrets` scans only the `.env` values, so this one is protected by not putting it anywhere | Storing it in the customer object passed to tests (could leak through assertion messages); typing it into the login form (would need `enterSecret`, Spec 001 D-9) |
| D-3 | Cart lines for UI tests are set up through `UserClient.addToCart` with the catalog product, except where the UI add is under test | Faster, and a setup failure is reported as such, not as a UI defect | Adding through the UI in every test |
| D-4 | TC-004-15 signs out in the UI, then starts a new session of the same customer with an API login, stored in the page by `DashboardPage.startSession(token)` (an `evaluate` step, titled "Evaluate" only) | RF-14 is about the cart surviving the session, not about the login form (Spec 001). No password is typed | Logging in through the form with `enterSecret` |
| D-5 | **Approved by the user (2026-10-09).** TC-004-13, 21, 22 and 23 are declared `test.fail()` with an `issue` annotation pointing to the spec Known issues; multi-value checks use `expect.soft` | Same reasoning as Spec 002 D-5: the pipeline stays green, the defects stay visible, and each test fails the run as "unexpectedly passed" once the shop fixes its defect | Plain failing tests (block promotions); `skip`/`fixme` (hide the defects) |
| D-6 | The remove control is located with `line.locator('button.btn-danger')`, scoped to the line, with a comment pointing to RF-12 | It has no role name or label (the defect TC-004-13 reports); CSS is the only stable handle | Clicking by position or by the icon class (`fa-trash-o`), which is more fragile |
| D-7 | Every cart assertion in UI tests is confirmed through the cart API as well (lines and count) | The UI can lag behind the server; the API is the source of truth for "the product is in the cart" (RF-1, RF-4) | Trusting the UI alone |
| D-8 | Isolation tests (TC-004-24 to 26) use two fixtures, `customer` and `secondCustomer`, and judge the other cart through its owner's token | Proves both the refusal and that the other cart did not change | Using the fixed account B as the other customer (would write to it) |
| D-9 | **Added in T11, approved by the user (2026-10-09).** Every API client sends its requests through `FetchRequestContext` (Node's built-in `fetch`) instead of Playwright's `request`; a network failure is rethrown without request details (`sendSafely`, and the adapter's own error) | Playwright records each `request` call as a report step, and a call that fails before an answer stores a call log with the `Authorization` header in the HTML report: `check:secrets` found a customer token there after a dropped connection. `fetch` creates no steps. No new dependency | Keeping `request` and relying on `check:secrets` to stop the pipeline (the token would still sit in the artifacts); post-processing the reports (discarded in Spec 001 D-9) |

## Risks
- **Account growth on the shop.** About 60 `TEST_` accounts per full regression (UI tests on three
  browsers plus API tests). They cannot be deleted. Mitigation: carts are emptied; names are
  recognisable (`TEST_`); the risk is recorded for the user. If the shop rate-limits registration,
  the fallback is a worker-scoped customer for read-only API tests.
- **Registration failure or slowness.** Every cart test depends on it. Mitigation: a clear setup
  error that names the step; the 30 s API budget.
- **Cleanup failure.** A cart left non-empty belongs to a throw-away customer, so it cannot affect
  other tests; the failure is still reported.
- **Expected failures (D-5).** If not approved, four tests fail on every run and block the chain.
- **Verify items** (RF-4, RF-24, RF-25, RF-27, RF-28): if the shop behaves differently, the task
  stops and reports a possible defect.

## Out of scope
- "Buy Now", "Checkout", quantities, registration as a feature, the fixed accounts' carts (spec Out
  of scope).
- Deleting test accounts (no API).
- Any change to `.gitlab-ci.yml` or the CI scripts.
