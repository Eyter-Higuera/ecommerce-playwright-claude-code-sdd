# Tasks — Spec 004 Cart

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/004-cart/spec.md · Plan: specs/004-cart/plan.md

Rules:
- One task at a time, tests first, at most 20-30 minutes per task, in dependency order.
- A task is done only when its own TCs pass and the earlier tasks' tests still pass. Each task also
  runs `npm run lint`, `npm run typecheck` and `npm run spec:check`, and updates
  `execution-report.md`.
- Playwright tasks run on chromium (UI and mocked) or `api`. Firefox and webkit run in T11.
- On Windows, Playwright is run as `"$(volta which node)" node_modules/@playwright/test/cli.js`
  when the `--grep` pattern contains `|` (README).
- Every `TODO: VERIFY` of the plan is checked live in the task that uses it. A difference from the
  spec is reported as a possible defect, and the assertion is not weakened.
- Every task that registers customers also runs `npm run check:secrets` (the generated passwords
  must not reach any artifact).

## Test customers and cart API

- [x] T1 — Add the test customer fixture and the cart API calls, with the add and empty-cart tests
  - Covers: RF-16, RF-18 / TC-004-17, TC-004-19
  - Depends on: —
  - Files:
    - src/config/urls.ts (`AUTH_REGISTER_PATH`, cart API paths and builders)
    - src/api/api-result.ts (`delete` on `ApiRequestContext`)
    - src/api/auth-client.ts (`register`)
    - src/api/user-client.ts (`addToCart`, `getCartProducts`, `removeFromCart`)
    - src/api/cart-messages.ts (`CART_API_MESSAGES`)
    - src/api/schemas/cart.schema.ts (`cartListSchema`, `cartCountSchema`, `emptyCartSchema`)
    - src/data/customer-data.ts (`buildTestCustomer`)
    - src/errors/messages.ts (`customerSetupFailedMessage`)
    - src/fixtures/test.ts (`customer` with cart cleanup in teardown)
    - tests/api/cart-api.spec.ts
  - Done when:
    - `npx playwright test tests/api/cart-api.spec.ts --grep "TC-004-1[79]" --project=api` passes (2 tests);
    - `npm run check:secrets` exits 0;
    - `npx playwright test tests/api/user-authorization.spec.ts --project=api` still passes (`UserClient` changes).
    - The upper-case `TEST_` email (plan `TODO: VERIFY`) is verified and recorded.

- [x] T2 — Test listing, counting and removing through the cart API
  - Covers: RF-17, RF-19 / TC-004-18, TC-004-20
  - Depends on: T1
  - Files: tests/api/cart-api.spec.ts
  - Done when: `npx playwright test tests/api/cart-api.spec.ts --grep "TC-004-(18|20)" --project=api` passes (2 tests)

- [x] T3 — Test cart data integrity (known defects as expected failures)
  - Covers: RF-20, RF-21, RF-22 / TC-004-21, TC-004-22, TC-004-23
  - Depends on: T1
  - Files: tests/api/cart-integrity.spec.ts (`test.fail()` with the Known-issue annotations, plan D-5)
  - Done when: `npx playwright test tests/api/cart-integrity.spec.ts --grep "TC-004-2[1-3]" --project=api` reports the 3 tests as expected failures (exit code 0), and `npm run check:secrets` exits 0

- [x] T4 — Add the second customer and test isolation between carts
  - Covers: RF-23, RF-24, RF-25 / TC-004-24, TC-004-25, TC-004-26
  - Depends on: T1
  - Files:
    - src/fixtures/test.ts (`secondCustomer`)
    - tests/api/cart-authorization.spec.ts
  - Done when: `npx playwright test tests/api/cart-authorization.spec.ts --grep "TC-004-2[4-6]" --project=api` passes (3 tests). RF-24 and RF-25 (plan `TODO: VERIFY`) are verified and recorded.

- [x] T5 — Test the cart API authorization
  - Covers: RF-26, RF-27, RF-28 / TC-004-27, TC-004-28, TC-004-29
  - Depends on: T1
  - Files: tests/api/cart-authorization.spec.ts
  - Done when: `npx playwright test tests/api/cart-authorization.spec.ts --grep "TC-004-2[7-9]" --project=api` passes (3 tests). RF-27 and RF-28 (plan `TODO: VERIFY`) are verified and recorded.

## Cart page (UI)

- [x] T6 — Add the cart page, the header count and the customer browser session, with the cart page tests
  - Covers: RF-6, RF-7, RF-8, RF-9 / TC-004-06, TC-004-07, TC-004-08, TC-004-09
  - Depends on: T2
  - Files:
    - src/pages/cart.constants.ts (`CART`, `moneyText`)
    - src/pages/cart-page.ts (`CartPage`)
    - src/components/nav-bar.ts (`cartCount`)
    - src/fixtures/test.ts (`cartTest`, `cartPage`)
    - tests/ui/cart-page.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/cart-page.spec.ts --grep "TC-004-0[6-9]" --project=chromium` passes (4 tests), and `npm run check:secrets` exits 0. The line price locator (plan `TODO: VERIFY`) is verified and recorded.

- [x] T7 — Test the cart page against a mocked cart answer
  - Covers: RF-6, RF-7 / TC-004-10
  - Depends on: T6
  - Files: tests/mocked/cart-mocked-answer.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/mocked/cart-mocked-answer.spec.ts --grep "TC-004-10" --project=chromium` passes (1 test)

- [x] T8 — Test adding products from the dashboard and the detail page
  - Covers: RF-1, RF-2, RF-3, RF-4, RF-5 / TC-004-01, TC-004-02, TC-004-04, TC-004-05
  - Depends on: T6
  - Files:
    - src/components/product-list.ts (`addToCart`)
    - src/pages/product-detail-page.ts (`addToCart`)
    - tests/ui/cart-add.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/cart-add.spec.ts --grep "TC-004-0[1245]" --project=chromium` passes (4 tests). RF-4 (plan `TODO: VERIFY`) is verified and recorded.

- [x] T9 — Test removing products and the header count transitions
  - Covers: RF-3, RF-7, RF-10, RF-11, RF-12 / TC-004-03, TC-004-11, TC-004-12, TC-004-13, TC-004-30 (TC-004-30 added by Mode C, spec clarification 7)
  - Depends on: T8
  - Files:
    - src/pages/cart-page.ts (`remove`, remove control fallback, plan D-6)
    - tests/ui/cart-remove.spec.ts (TC-004-11 to 13 and 30; TC-004-13 and TC-004-30 as `test.fail()`, plan D-5)
    - tests/ui/cart-add.spec.ts (TC-004-03)
  - Done when: `npx playwright test tests/ui/cart-remove.spec.ts tests/ui/cart-add.spec.ts --grep "TC-004-(03|1[1-3]|30)" --project=chromium` reports TC-004-03, 11 and 12 passed and TC-004-13 and TC-004-30 as expected failures (exit code 0)

- [x] T10 — Test the cart across reloads, sign-ins and without a session
  - Covers: RF-13, RF-14, RF-15 / TC-004-14, TC-004-15, TC-004-16
  - Depends on: T6
  - Files:
    - src/pages/dashboard-page.ts (`startSession`, plan D-4)
    - tests/ui/cart-session.spec.ts (TC-004-14; TC-004-15 as `test.fail()`, spec clarification 8)
    - tests/ui/cart-guest.spec.ts (TC-004-16, plain `test`)
  - Done when: `npx playwright test tests/ui/cart-session.spec.ts tests/ui/cart-guest.spec.ts --grep "TC-004-1[4-6]" --project=chromium` reports TC-004-14 and 16 passed and TC-004-15 as an expected failure (exit code 0), and `npm run check:secrets` exits 0

## Cross-browser, secrets and traceability

- [x] T11 — Run the suite on all browsers, scan the artifacts and update the traceability matrix
  - Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; no password or token in artifacts)
  - Depends on: T1 to T10
  - Files:
    - docs/traceability.md (regenerated)
    - specs/004-cart/implementation.md
  - Done when:
    - `npx playwright test --grep "TC-004-" --project=api --project=chromium` passes, then `--project=firefox` and `--project=webkit` pass (`--workers=2`, one invocation per project), with TC-004-13, 15, 21, 22, 23 and 30 as the only expected failures;
    - `npm run check:secrets` exits 0 after each run;
    - `npm run test:unit` passes;
    - `npm run spec:check -- --write` passes with no Spec 004 warning.

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-004-01 | T8 |
| TC-004-02 | T8 |
| TC-004-03 | T9 |
| TC-004-04 | T8 |
| TC-004-05 | T8 |
| TC-004-06 | T6 |
| TC-004-07 | T6 |
| TC-004-08 | T6 |
| TC-004-09 | T6 |
| TC-004-10 | T7 |
| TC-004-11 | T9 |
| TC-004-12 | T9 |
| TC-004-13 | T9 |
| TC-004-14 | T10 |
| TC-004-15 | T10 |
| TC-004-16 | T10 |
| TC-004-17 | T1 |
| TC-004-18 | T2 |
| TC-004-19 | T1 |
| TC-004-20 | T2 |
| TC-004-21 | T3 |
| TC-004-22 | T3 |
| TC-004-23 | T3 |
| TC-004-24 | T4 |
| TC-004-25 | T4 |
| TC-004-26 | T4 |
| TC-004-27 | T5 |
| TC-004-28 | T5 |
| TC-004-29 | T5 |
| TC-004-30 | T9 |
