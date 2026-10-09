# Plan — Spec 003 Product detail

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/003-product-detail/spec.md · Test cases: specs/003-product-detail/test-cases.md

## Context
This plan automates the 19 test cases of Spec 003: the product detail page, navigation and
session around it, invalid ids, and the product detail API with its authorization. It builds on
Specs 000 to 002.

Main approach:
- **Reuse first.**
  - From Spec 002: the `catalog` fixture, `ProductClient`, the product schemas,
    `DashboardPage.openCatalog()`, `ProductList` (cards and "View"), `requireCatalogInput` and
    `keepAvailableCases` (plan D-6), `testProduct`.
  - From Spec 001: `loggedInTest` with `NO_TRACE`, `tamperToken`, `MALFORMED_AUTHORIZATION`,
    `INJECTION_INPUTS`, `AUTH_API_MESSAGES`, `LOGIN_ROUTE_PATTERN`.
- **One new Page Object**, `ProductDetailPage`, holds the detail route, its content, the
  "Add to Cart" control, the "Continue Shopping" link and the alert. Its `open(id)` always loads the
  route as a new document, because changing only the hash kept the previous product on screen
  (spec edge cases).
- **The detail API extends `ProductClient`** with `getProductDetail(id, authorization?)`, which
  returns the raw `ApiResult` like the other clients (Spec 001 D-4, Spec 002 D-2).
- **The catalog stays the oracle** (Spec 002 D-1). Expected detail data are the catalog product's
  fields; the detail API is compared with the catalog (RF-12), and the page with the detail API
  answer (RF-2 to RF-4).
- **The two known defects** (TC-003-12 and TC-003-16) run as expected failures, as Spec 002 D-5 did
  for TC-002-31 (D-5 below, approved).

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ | No new dependency |
| 2 | Spec first | ✔ | Spec `test-cases-approved`; every test title starts with its TC-003 ID |
| 3 | Separation of concerns | ✔ | Locators in `ProductDetailPage` and `ProductList`; HTTP in `ProductClient`; derived ids in `catalog-data.ts` |
| 4 | Test quality | ✔ | No `waitForTimeout`: web-first assertions and `waitForResponse` on the detail API. Locators by role; one `// TODO: VERIFY` for the description paragraph |
| 5 | Data and secrets | ✔ | Nothing is created on the shop, so no cleanup. Literal ids use `TEST_` or an all-zero id. Sessions from the API with no trace (Spec 001 RF-27) |
| 6 | Language | ✔ | English |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1 to RF-5 | TC-003-01, 02, 03, 04, 06 | ui | tests/ui/product-detail.spec.ts |
| RF-2, RF-3, RF-4 | TC-003-05 | mocked | tests/mocked/product-detail-mocked-answer.spec.ts |
| RF-6, RF-7, RF-9, RF-10 | TC-003-07, 08, 09, 11, 12 | ui | tests/ui/product-detail-navigation.spec.ts |
| RF-8 | TC-003-10 | ui | tests/ui/product-detail-guest.spec.ts |
| RF-11 to RF-14 | TC-003-13 to TC-003-16 | api | tests/api/product-detail-api.spec.ts |
| RF-15 to RF-17 | TC-003-17, 18, 19 | api | tests/api/product-detail-authorization.spec.ts |

Detail per TC (all `Automate: Y`):

| Test case | RF | Layer | Test file |
|-----------|----|-------|-----------|
| TC-003-01 | RF-1 | ui | tests/ui/product-detail.spec.ts |
| TC-003-02 | RF-2, RF-3, RF-4 | ui | tests/ui/product-detail.spec.ts |
| TC-003-03 | RF-5 | ui | tests/ui/product-detail.spec.ts |
| TC-003-04 | RF-1, RF-2 | ui | tests/ui/product-detail.spec.ts |
| TC-003-05 | RF-2, RF-3, RF-4 | mocked | tests/mocked/product-detail-mocked-answer.spec.ts |
| TC-003-06 | RF-1 to RF-4, RF-6 | ui | tests/ui/product-detail.spec.ts |
| TC-003-07 | RF-6 | ui | tests/ui/product-detail-navigation.spec.ts |
| TC-003-08 | RF-7, RF-9, RF-10 | ui | tests/ui/product-detail-navigation.spec.ts |
| TC-003-09 | RF-7 | ui | tests/ui/product-detail-navigation.spec.ts |
| TC-003-10 | RF-8 | ui | tests/ui/product-detail-guest.spec.ts (moved in T9: spec:check reads only `test(...)` calls) |
| TC-003-11 | RF-9 | ui | tests/ui/product-detail-navigation.spec.ts |
| TC-003-12 | RF-10 | ui | tests/ui/product-detail-navigation.spec.ts (expected failure, D-5) |
| TC-003-13 | RF-11 | api | tests/api/product-detail-api.spec.ts |
| TC-003-14 | RF-12 | api | tests/api/product-detail-api.spec.ts |
| TC-003-15 | RF-13, RF-12 | api | tests/api/product-detail-api.spec.ts |
| TC-003-16 | RF-14 | api | tests/api/product-detail-api.spec.ts (expected failure, D-5) |
| TC-003-17 to 19 | RF-15 to RF-17 | api | tests/api/product-detail-authorization.spec.ts |

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| ProductDetailPage (NEW) | src/pages/product-detail-page.ts | `open(id)` loads the detail route as a new document (D-3); name, price, description, "Add to Cart", "Continue Shopping", alert; `continueShopping()` (covers RF-1 to RF-10) | Name: `getByRole('heading', { level: 2 })`; price: `getByRole('heading', { level: 3, name: /^\$/ })` (the header also has a level-3 "Automation" heading); "Add to Cart": `getByRole('button', { name: 'Add to Cart', exact: true })` (the header " Cart" button must not match); "Continue Shopping": `getByRole('link', { name: /Continue Shopping/ })`; alert: `getByRole('alert')`; description: the paragraph under the "product details" heading, `// TODO: VERIFY` a role-based form |
| PRODUCT_DETAIL constants (NEW) | src/pages/product-detail.constants.ts | Texts: "Add to Cart", "Continue Shopping", "Product not found", "[object Object]", the price format `$ <price>` | — |
| ProductList (REUSED, extended) | src/components/product-list.ts | Adds `cardNamed(name)`: the card whose heading is the product name (covers RF-1, TC-003-01, 04, 06) | `cards.filter({ has: getByRole('heading', { name, exact: true }) })`, name compared as stored |
| DashboardPage (REUSED) | src/pages/dashboard-page.ts | `openCatalog()` before "View"; the result counter for "Continue Shopping" (RF-6) | — |

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|
| ProductClient (REUSED, extended) | src/api/product-client.ts | `getProductDetail(id: string, authorization?: string): Promise<ApiResult>` → `GET {API_BASE_URL}/product/get-product-detail/{id}`, id URL-encoded; `undefined` sends no `Authorization` header (covers RF-11 to RF-17) |
| productSchema (REUSED, extended) | src/api/schemas/product.schema.ts | Adds an optional `productDescription` string, so the catalog fixture keeps the description for RF-12. Spec 002 contracts are unchanged (the field stays optional there) |
| productDetailSchema (NEW) | src/api/schemas/product.schema.ts | RF-11: message literal "Product Details fetched Successfully"; `data` = `productSchema` with a required non-empty `productDescription` |
| PRODUCT_API_MESSAGES (REUSED, extended) | src/api/product-messages.ts | `DETAIL_FETCHED`, `PRODUCT_NOT_FOUND` |
| URL builders (REUSED, extended) | src/config/urls.ts | `PRODUCT_DETAIL_PATH = 'product/get-product-detail'`, `buildProductDetailUrl(apiBaseUrl, id)`; `PRODUCT_DETAIL_ROUTE = '#/dashboard/product-details'`, `buildProductDetailRoute(baseUrl, id)`, `productDetailRoutePattern(id)` |

## Fixtures and test data
- **Fixtures (REUSED):** `catalog` (now with descriptions), `productClient`, `apiSession`,
  `dashboardPage`, `loggedInTest`. New fixture `productDetailPage` in src/fixtures/test.ts.
- **Guest test (TC-003-10):** the plain `test` (no stored token), plus the `catalog` fixture,
  which reads the catalog through the API outside the browser.
- **Derived data (src/data/catalog-data.ts, REUSED, extended):**
  - `UNKNOWN_PRODUCT_ID = '000000000000000000000000'`, `MALFORMED_PRODUCT_ID = 'TEST_not_an_id'`;
  - `unknownIdLike(catalog)`: a catalog `_id` with its last 4 hex characters changed, checked
    against the catalog so it matches no product;
  - `idOfLength(id, length)`: a catalog `_id` cut to 23 or padded to 25 hex characters;
  - `productsWithSamePrice(catalog)`: two products with one price, or `undefined` (D-6);
  - `twoNamedProducts(catalog)`: two products with different names (TC-003-06);
  - `detailFields(product)`: the six fields RF-12 compares.
- **Mocked product (TC-003-05):** `testProduct({ productName: 'test_detail_product', productPrice: 0, productDescription: 'TEST_description' })`, answered as `{ data, message }`.
- **Reused from Spec 001:** `INJECTION_INPUTS`, `tamperToken`, `MALFORMED_AUTHORIZATION`.
- **Accounts:** account A only, through `apiSession`. No password is typed and nothing is created,
  so no cleanup is needed.

## Mocking strategy
- **Mocked UI (TC-003-05):** `page.route('**/product/get-product-detail/**', …)` fulfills HTTP 200
  with the `TEST_` product. The route is opened with a well-formed id; the session and the page are
  real. The test waits for the mocked answer before asserting.
- **Real environment:** everything else, including the invalid-id UI tests (TC-003-11, 12), which
  use the live 400 and 500 answers.
- **No unit tests:** no TC targets framework code.

## Locator strategy
- **Verified live on 2026-10-09:**
  - The detail route is `#/dashboard/product-details/{_id}`.
  - The name is the only level-2 heading. The price is a level-3 heading "$ 11500"; the header also
    has a level-3 "Automation" heading, so the price locator requires the `$`.
  - The detail "Add to Cart" button's name is exactly "Add to Cart". The header button " Cart" does
    not match an exact name.
  - "Continue Shopping❯" is a link to `#/dashboard`.
  - Both invalid-id alerts are toasts with role `alert`; the text is in `aria-label` ("Product not
    found", "[object Object]"), as in Spec 001.
- **Not yet verified (`// TODO: VERIFY`):**
  - a role-based locator for the description paragraph (the paragraph after the "product details"
    level-6 heading);
  - whether the name heading's text keeps the stored letter case (the comparison ignores case
    anyway).

## Test file layout, tags and browsers
- `tests/ui/product-detail.spec.ts`: `loggedInTest`, `NO_TRACE`.
  - Describe "positive": 01, 02, 03. Describe "boundary": 04. Describe "negative (state)": 06.
  - TC-003-01 is `@smoke @regression @ui @critical`, TC-003-02 is `@regression @ui @critical`,
    the rest are `@regression @ui`.
- `tests/ui/product-detail-navigation.spec.ts`: `NO_TRACE` at file level.
  - Logged in (`loggedInTest`): 07, 08, 09 (positive), 11, 12 (negative).
  - Guest (plain `test`): 10 (security), `@regression @ui @critical`.
- `tests/mocked/product-detail-mocked-answer.spec.ts`: `loggedInTest`, `NO_TRACE`; 05 (boundary),
  `@regression @mocked`.
- `tests/api/product-detail-api.spec.ts`: describes positive (13, 14), negative (15),
  security (16). TC-003-13 is `@smoke @regression @api @critical`; the rest are `@regression @api`.
- `tests/api/product-detail-authorization.spec.ts`: describe "security"; 17 and 18 are
  `@regression @api @critical`, 19 is `@regression @api`.
- **Browsers.** UI and mocked tests run on chromium, firefox and webkit; API tests run in the `api`
  project. The smoke subset adds TC-003-01 on chromium and TC-003-13 on `api`.
- **Loops:** TC-003-01 and TC-003-02 loop over every catalog product and call `test.slow()`.

## Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| D-1 | Expected detail data come from the catalog fixture: RF-12 compares the detail API with the catalog, and RF-2 to RF-4 compare the page with the catalog product (which RF-12 proves equal to the detail answer) | It reuses the Spec 002 oracle and needs no hard-coded product (spec non-functional requirements) | Comparing the page only with the detail API answer read in the same test, which would miss a detail API that returns the wrong product |
| D-2 | `productSchema` gains an optional `productDescription` | The catalog fixture strips unknown fields, and RF-12 needs the catalog description. Keeping it optional leaves the Spec 002 contracts as they are | A second catalog fixture with its own schema, which would read the catalog twice per test |
| D-3 | `ProductDetailPage.open(id)` first navigates to `about:blank`, then to the detail route, so the route always loads as a new document. The stored session survives (local storage of the shop's origin) | Changing only the URL hash kept the previous product on screen (observed), which would let a stale page pass | Reloading after each `goto`, which loads the page twice. `TODO: VERIFY` that `about:blank` keeps the session on all three browsers |
| D-4 | "View" is clicked on the card found by its heading (`ProductList.cardNamed`), and the test waits for the detail API response of that `_id` before asserting | The card order is not guaranteed (Spec 002 D-3); the response wait ties the page to the requested product | Clicking cards by index, which depends on the list order |
| D-5 | **Approved by the user (2026-10-09).** TC-003-12 and TC-003-16 are declared `test.fail()` with an `issue` annotation that points to the spec Known issues; TC-003-16 checks each id with `expect.soft` | Same reasoning as Spec 002 D-5: the pipeline stays green, the defects stay visible, and each test fails the run as "unexpectedly passed" once the shop fixes its defect. The assertions stay as strict as RF-10 and RF-14 | Plain failing tests (block every promotion); `skip`/`fixme` (hide the defects and never report the fix) |
| D-6 | When the catalog has no two products with the same price (TC-003-04) or no two differently named products (TC-003-06), the test skips with a `catalog-gap` annotation through `requireCatalogInput` | As Spec 002 D-6: third-party data gaps are not defects | Failing the test, or hard-coding products |
| D-7 | The invalid-id UI tests assert the alert by its accessible name, within the 30 s API budget | The toast is transient (about 1.3 s observed in Spec 001), and its text is in `aria-label`. A web-first assertion catches it as soon as it appears | Reading the toast text after a fixed wait (forbidden, and flaky) |

## Risks
- **Transient toasts (RF-9, RF-10).** A slow answer could show the toast after a short check.
  Mitigation: the alert assertion uses the 30 s API budget and starts before the page load
  completes (D-7).
- **Catalog changes during a run.** Mitigation: per-test catalog read; CI retries 2.
- **Stale page on hash changes.** Mitigation: D-3 for direct opens; "View" from a freshly loaded
  dashboard for card navigation (TC-003-06 covers the state transition on purpose).
- **More than 9 products.** TC-003-01 can only click cards on the first page; products beyond it
  are still covered by TC-003-02 (direct route) and the API tests.
- **Expected failures (D-5).** If not approved, TC-003-12 and TC-003-16 fail on every run and block
  the promotion chain until the shop fixes the defects.
- **No traces for detail UI tests (RF-27).** Debugging relies on screenshots and the HTML report.

## Out of scope
- The effect of "Add to Cart", "Share It", images and ratings, the browser Back button, pagination
  and admin features (spec Out of scope).
- The empty-product state for invalid ids (spec Known issues; no requirement).
- Any change to `.gitlab-ci.yml` or the CI scripts: the new tests are picked up by the existing
  gates through their tags.
