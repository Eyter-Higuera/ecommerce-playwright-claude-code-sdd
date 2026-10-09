# Plan — Spec 002 Catalog and search

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/002-catalog-search/spec.md · Test cases: specs/002-catalog-search/test-cases.md

## Context
This plan automates the 34 test cases of Spec 002: product listing, search, filters, the product
API and its authorization. It builds on the Spec 000 and Spec 001 framework.

Main approach:
- **Reuse first.**
  - `loggedInTest` and `NO_TRACE`: an API session in the browser with no trace (Spec 001 D-1, D-3).
  - `apiSession`, `DashboardPage`, `ApiResult` and `HTTP_STATUS`.
  - `INJECTION_INPUTS`, `tamperToken`, `MALFORMED_AUTHORIZATION` and `AUTH_API_MESSAGES`.
  - The timeouts and the URL builders.
- **The catalog is the oracle (spec clarification 2).**
  - A test-scoped `catalog` fixture reads the unfiltered catalog through the product API.
  - A pure function, `matchingProducts(catalog, criteria)`, computes the expected products for
    any criteria with the spec rules (RF-5, RF-9 to RF-15).
  - UI tests compare the cards with that expectation.
  - API tests compare the live API with the same function, so the oracle itself is checked
    against the shop on every run (TC-002-26 to TC-002-28).
- **New UI pieces.** Two components hang from `DashboardPage`:
  - `ProductList`: cards, names, prices, controls and the result counter.
  - `FilterPanel`: search, price range and the three option groups, limited to the visible panel.
  - Both wait for the product API answer of the last criteria change before any assertion.
- **New API pieces.**
  - `ProductClient.getAllProducts(criteria, authorization?)` returns the raw `ApiResult`, like
    `UserClient` (Spec 001 D-4).
  - zod schemas for the success and the no-results answers.
- **The known defect** (TC-002-31, HTTP 500 for `(`) runs as an expected failure. The pipeline
  stays green, and the test reports when the shop fixes the defect (D-5, approved).

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ | No new dependency. Playwright 1.63 (`locator.filter({ visible: true })`, `test.fail`) and zod already exist |
| 2 | Spec first | ✔ | Spec `test-cases-approved`; every test title starts with its TC-002 ID |
| 3 | Separation of concerns | ✔ | Locators in `ProductList` and `FilterPanel`, HTTP in `ProductClient`, expectations in `catalog-oracle.ts`. Tests only arrange, act and assert |
| 4 | Test quality | ✔ | No `waitForTimeout`: waits target the product API response (D-4) and web-first assertions. One CSS fallback for the product card, justified in the locator strategy |
| 5 | Data and secrets | ✔ | Nothing is created on the shop, so there is no cleanup. Literal inputs use `TEST_`. The session comes from the API with no trace (Spec 001 RF-27). Mocked products are `TEST_` products |
| 6 | Language | ✔ | English |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1, RF-2, RF-3, RF-4 | TC-002-01, TC-002-02, TC-002-03 | ui | tests/ui/catalog-listing.spec.ts |
| RF-1, RF-2, RF-3, RF-4, RF-7 | TC-002-04, TC-002-05 | mocked | tests/mocked/catalog-mocked-answer.spec.ts |
| RF-4, RF-5, RF-6, RF-7, RF-8, RF-16 | TC-002-06 to TC-002-12 | ui | tests/ui/catalog-search.spec.ts |
| RF-7, RF-9 to RF-16 | TC-002-13 to TC-002-24 | ui | tests/ui/catalog-filters.spec.ts |
| RF-5, RF-9 to RF-15, RF-17 to RF-21, RF-25 | TC-002-25 to TC-002-31 | api | tests/api/product-api.spec.ts |
| RF-22, RF-23, RF-24 | TC-002-32, TC-002-33, TC-002-34 | api | tests/api/product-authorization.spec.ts |

Detail per TC (all `Automate: Y`):

| Test case | RF | Layer | Test file |
|-----------|----|-------|-----------|
| TC-002-01 | RF-1, RF-2 | ui | tests/ui/catalog-listing.spec.ts |
| TC-002-02 | RF-3 | ui | tests/ui/catalog-listing.spec.ts |
| TC-002-03 | RF-4 | ui | tests/ui/catalog-listing.spec.ts |
| TC-002-04 | RF-1, RF-3, RF-4, RF-7 | mocked | tests/mocked/catalog-mocked-answer.spec.ts |
| TC-002-05 | RF-2 | mocked | tests/mocked/catalog-mocked-answer.spec.ts |
| TC-002-06 to TC-002-12 | RF-4 to RF-8, RF-16 | ui | tests/ui/catalog-search.spec.ts |
| TC-002-13 to TC-002-24 | RF-7, RF-9 to RF-16 | ui | tests/ui/catalog-filters.spec.ts |
| TC-002-25 | RF-17 | api | tests/api/product-api.spec.ts |
| TC-002-26 | RF-18, RF-5 | api | tests/api/product-api.spec.ts |
| TC-002-27 | RF-18, RF-9, RF-10, RF-11, RF-25 | api | tests/api/product-api.spec.ts |
| TC-002-28 | RF-18, RF-12 to RF-15 | api | tests/api/product-api.spec.ts |
| TC-002-29 | RF-19 | api | tests/api/product-api.spec.ts |
| TC-002-30 | RF-20 | api | tests/api/product-api.spec.ts |
| TC-002-31 | RF-21 | api | tests/api/product-api.spec.ts (expected failure, D-5) |
| TC-002-32 to TC-002-34 | RF-22 to RF-24 | api | tests/api/product-authorization.spec.ts |

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| DashboardPage (REUSED, extended) | src/pages/dashboard-page.ts | Adds `products: ProductList` and `filters: FilterPanel`; `open()` unchanged (covers RF-1 to RF-16) | — |
| ProductList (NEW) | src/components/product-list.ts | Cards, card names, card prices, "View" and "Add To Cart" per card, result counter; `names()`, `prices()` read the visible cards (covers RF-1 to RF-4, RF-7) | Card: `locator('.card-body')` (CSS fallback, see Locator strategy); name: `getByRole('heading')` inside a card; controls: `getByRole('button', { name: CATALOG.VIEW })`, `getByRole('button', { name: CATALOG.ADD_TO_CART })`; counter: `getByText(CATALOG.RESULT_COUNTER)`; price: `// TODO: VERIFY` |
| FilterPanel (NEW) | src/components/filter-panel.ts | The visible filter panel only; `search(text)`, `setPriceRange(min, max)`, `clearPriceRange()`, `toggleOption(group, option)`. Each action resolves after the product API answers the final criteria (D-4) (covers RF-5 to RF-16) | Panel: `page.locator('form').filter({ visible: true })` scoped by `has: getByPlaceholder(CATALOG.SEARCH_PLACEHOLDER)`; inputs: `getByPlaceholder('search' / 'Min Price' / 'Max Price')`; options: `getByRole('checkbox')` inside the container whose text is the option, `// TODO: VERIFY` (no linked label) |
| DialogRecorder (NEW, extracted) | src/components/dialog-recorder.ts | Records and dismisses browser dialogs. `LoginPage.recordDialogs()` delegates to it unchanged; `DashboardPage` uses it for TC-002-12 (covers RF-8) | — |
| CATALOG constants (NEW) | src/pages/catalog.constants.ts | Button names, placeholders, the counter pattern `/Showing (\d+) results/` and a `resultCounter(n)` builder, group and option names | — |

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|
| ProductClient (NEW) | src/api/product-client.ts | `getAllProducts(criteria: ProductCriteria, authorization?: string): Promise<ApiResult>` → `POST {API_BASE_URL}/product/get-all-products`. As in `UserClient`, `undefined` sends no `Authorization` header and the value is never logged (covers RF-17 to RF-24) |
| ApiRequestContext (REUSED, extended) | src/api/api-result.ts | `post` options gain an optional `headers`. Existing callers are unchanged. `HTTP_STATUS.FIRST_SERVER_ERROR` is reused for RF-20 and RF-21 |
| productSchema, productListSchema, noProductsSchema (NEW) | src/api/schemas/product.schema.ts | Product: non-empty `_id`, `productName`, `productCategory`, `productSubCategory`, `productFor`, numeric `productPrice` (extra fields allowed). Success: message literal "All Products fetched Successfully", non-empty `data`, `count` = `data.length` (`superRefine`). No results: `data` empty, message "No Products Found" (covers RF-17, RF-19) |
| PRODUCT_API_MESSAGES (NEW) | src/api/product-messages.ts | `ALL_FETCHED`, `NO_PRODUCTS`. The 401 messages reuse `AUTH_API_MESSAGES.NO_TOKEN` and `SESSION_TIMEOUT` |
| URL builders (REUSED, extended) | src/config/urls.ts | `PRODUCT_LIST_PATH = 'product/get-all-products'`, `buildProductListUrl(apiBaseUrl)` |

## Fixtures and test data
- **Fixtures (src/fixtures/test.ts):**
  - `productClient` (NEW).
  - `catalog` (NEW, test-scoped). It calls `getAllProducts(EMPTY_CRITERIA, apiSession.token)` and
    parses the answer with `productListSchema`. An empty catalog or a non-200 answer fails with a
    clear message naming only the status, so RF-1 and RF-17 fail visibly (spec edge case).
  - UI tests use `loggedInTest` with `test.use(NO_TRACE)`, because the browser holds the token
    (Spec 001 RF-27). The `catalog` fixture shares `apiSession` with `storageState`, so there is
    one login per test (Spec 001 D-6).
- **Oracle (src/data/catalog-oracle.ts, NEW):**
  - `ProductCriteria` mirrors the API body: `productName`, `minPrice`, `maxPrice` and the three
    option lists. `EMPTY_CRITERIA` is the body the shop sends on load.
  - `matchingProducts(catalog, criteria)` applies these rules:
    - a case-sensitive, untrimmed prefix on the name (RF-5);
    - the price rule models the API body: a single bound (the other `null`) is ignored (RF-11);
      two numeric bounds give an inclusive range, so a minimum above the maximum matches nothing
      (RF-9, RF-10); two bounds with a non-number match nothing (RF-25, added in T4 by Mode C).
      UI tests pass the criteria the panel sends: a non-numeric typed bound is sent as `null`;
    - OR inside each non-empty option list, AND across all criteria (RF-12 to RF-15).
  - Expected and actual products are compared by name, ignoring letter case, as sorted lists,
    because the list order is not guaranteed (spec Out of scope).
- **Derived inputs (src/data/catalog-data.ts, NEW):**
  - `FILTER_OPTIONS`: the groups and their options as in the spec.
  - `NO_MATCH_NAME = 'TEST_no_such_product'`, `NON_NUMERIC_BOUNDS = ['TEST_abc', 'TEST_xyz']`, and
    `PATTERN_SPECIAL_NAMES = ['(', '[', 'TEST_*(']`.
  - Builders over the catalog:
    - `firstWord(product)`, `completeName(product)`;
    - `flippedCase(catalog)`: a name with its letter case changed that starts no catalog name;
    - `lastWord(catalog)`: from a multi-word name, and starting no catalog name;
    - `lowestPrice`, `highestPrice`;
    - `optionWithoutProducts(catalog, group)`, `optionWithProducts(catalog, group)`.
  - A builder returns `undefined` when the catalog cannot provide the input (D-6).
  - `testProduct(overrides)`: mocked `TEST_` products for TC-002-04 and TC-002-05.
- **Reused from Spec 001 (src/data/auth-data.ts):** `INJECTION_INPUTS`, `tamperToken`,
  `MALFORMED_AUTHORIZATION`.
- **Accounts:** account A only, through `apiSession`. No password is typed. Nothing is created on
  the shop, so no cleanup is needed.

## Mocking strategy
- **Mocked UI (TC-002-04, TC-002-05).**
  - `page.route('**/product/get-all-products', …)` fulfills HTTP 200 with JSON built from
    `testProduct()`: an empty list with "No Products Found", and two `TEST_` products with
    distinct prices.
  - The dashboard and the session are real (`loggedInTest`, `NO_TRACE`).
  - The test first waits for the mocked answer, so it proves that the mock reached the app.
- **Real environment.** Everything else, including the `catalog` fixture of the mocked tests'
  neighbours.
- **No unit tests in this spec.** No TC targets framework code. The oracle is checked against the
  live API by TC-002-26 to TC-002-28 (see Risks).

## Locator strategy
- **Verified live on 2026-10-09:**
  - Search, Min Price and Max Price are text inputs with placeholders `search`, `Min Price` and
    `Max Price`, and no label.
  - The filter panel is rendered twice (desktop and mobile); only one is visible. Each control is
    scoped to the visible `form` with `filter({ visible: true })`.
  - The option check boxes have no accessible name. Their option text is in the parent element.
    The locator is the check box inside the element whose text is exactly the option.
    `// TODO: VERIFY` a stable form during implementation; a CSS fallback must be justified in a
    comment.
  - The buttons " View" and " Add To Cart" carry a leading icon glyph, so they are matched with
    `/^\W*View$/` and `/^\W*Add To Cart$/`.
  - The result counter is "Showing N results" with trailing spaces and a separator.
- **Product card.** No role or test id was found, so the card is `locator('.card-body')`, the only
  CSS fallback, justified in a comment. Everything inside a card is located by role or text.
- **Not yet verified (`// TODO: VERIFY`):**
  - whether the card name is a heading (`h5` observed);
  - the price text format (for example "$ 11500"); `prices()` parses the number from it;
  - which event triggers the request for each control: Enter on search, change on the price
    inputs, and the checkbox click (observed: one request per field change).

## Test file layout, tags and browsers
- `tests/ui/catalog-listing.spec.ts`: `loggedInTest`, `NO_TRACE`; describe "positive".
  - TC-002-01: `@smoke @regression @ui @critical`.
  - TC-002-02, TC-002-03: `@regression @ui`.
- `tests/mocked/catalog-mocked-answer.spec.ts`: `loggedInTest`, `NO_TRACE`.
  - TC-002-05 in describe "positive", TC-002-04 in describe "boundary".
  - Tags `@regression @mocked`.
- `tests/ui/catalog-search.spec.ts`: `loggedInTest`, `NO_TRACE`.
  - Describes: positive (06, 10), boundary (07, 09), negative (08, 11), security (12).
  - TC-002-06 is `@smoke @regression @ui @critical`, TC-002-12 is `@regression @ui @critical`,
    the rest are `@regression @ui`.
- `tests/ui/catalog-filters.spec.ts`: `loggedInTest`, `NO_TRACE`.
  - Describes: price boundary (13, 14), price negative (15, 16), options positive (17, 18, 19, 21),
    options negative (20), combinations positive (22, 24), combinations negative (23).
  - Tags `@regression @ui`.
- `tests/api/product-api.spec.ts`: `api` project (no trace).
  - Describes: positive (25, 26, 28), boundary (27), negative (29), security (30, 31).
  - TC-002-25 is `@smoke @regression @api @critical`, TC-002-30 is `@regression @api @critical`,
    the rest are `@regression @api`.
- `tests/api/product-authorization.spec.ts`: `api` project; describe "security".
  - TC-002-32 and TC-002-33 are `@regression @api @critical`, TC-002-34 is `@regression @api`.
- **Browsers.** UI and mocked tests run on chromium, firefox and webkit (msedge only on explicit
  local request). API tests run in the `api` project. The smoke subset adds TC-002-01 and
  TC-002-06 on chromium and TC-002-25 on `api`.
- **Multi-value cases loop inside one test** (Spec 001 D-7). Loops over several options or ranges
  call `test.slow()` (as TC-001-11 does): TC-002-08, 09, 12, 14, 16, 17, 18, 20 and 24.

## Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| D-1 | Expected results come from `matchingProducts(catalog, criteria)` applied to the `catalog` fixture. API tests compare the live API with the same function | It follows spec clarification 2, with no hard-coded products. Because TC-002-26 to TC-002-28 compare the oracle with the live API, a wrong oracle shows up as an API failure, not as a silent false pass in the UI | Expected lists computed inside each test, which duplicates the rules in 20 places. Comparing the UI with a filtered API call only, which would not test the RF rules at all |
| D-2 | `ProductClient` returns a raw `ApiResult`; `post` gains an optional `headers` | Negative and 401 tests must read every status and body (as in Spec 001 D-4). The extension is backward compatible | A separate request wrapper per client, which duplicates `ApiResult` |
| D-3 | Names are compared ignoring letter case, as sorted lists. Prices are compared as numbers | The UI shows names in upper case (observed, RF-2), and the list order is not part of the spec | Exact text comparison, which fails on the display case. Ordered comparison, which tests an order the shop does not promise |
| D-4 | Each `FilterPanel` action waits for the product API response whose request body equals the final criteria (`page.waitForResponse` with a body predicate), then asserts with web-first assertions | Every field change sends its own request (observed: minimum, then maximum). Waiting for "any" response could assert on an intermediate list | `waitForTimeout` (forbidden). Waiting for the counter text alone, which can already match from an intermediate state |
| D-5 | **Approved by the user (2026-10-09).** TC-002-31 is declared `test.fail()` with an annotation that points to the spec Known issue (HTTP 500 for `(`). Every name is checked with `expect.soft`, so all of them are reported | Playwright passes an expected failure while the 500 persists, keeping the pipeline green and the defect visible in the report. When the shop fixes it, the test "unexpectedly passes" and fails the run, which is the signal to remove the marker. The assertion itself stays as strict as RF-21 | A plain failing test, which blocks every promotion. `test.skip` or `fixme`, which hides the defect and never reports the fix. Weakening the assertion to accept 500, which the spec forbids |
| D-6 | When the catalog cannot provide a derived input, the case is dropped with a `catalog-gap` annotation. If no case of the TC remains, the test calls `test.skip(true, reason)` | The catalog is third-party data (spec edge cases). Missing data is not a defect, and a skip with a reason shows up in reports and in spec:check as `skipped` instead of a false failure | Failing the test, which would block promotions because of someone else's catalog. Hard-coding a fallback product, which breaks spec clarification 2 |
| D-7 | `DashboardPage` gets `products` and `filters` components instead of a new `CatalogPage` | The catalog is the dashboard route (`#/dashboard/dash`), and Spec 001 tests already open it through `DashboardPage` | A second Page Object for the same route, which would split one page in two |
| D-8 | Dialog recording is extracted to `DialogRecorder` and reused by `LoginPage` and `DashboardPage` | TC-002-12 needs the same check as TC-001-11 (RF-8). Extracting it avoids a second copy | Copying `recordDialogs()` into `DashboardPage` |
| D-9 | The catalog snapshot is read once per test, right before the UI or API action | It keeps the window for third-party catalog changes to seconds, and keeps tests independent | A worker-scoped snapshot, which is faster but widens the window and shares state |

## Risks
- **Third-party catalog changes during a run.** A product added or removed between the snapshot
  and the UI read gives a false failure. Mitigation: a per-test snapshot (D-9); CI retries 2; a
  re-run is expected to pass (spec edge case).
- **Thin catalog (3 products, all electronics, mobiles and women).** Some positive option cases
  can only prove an empty result. Mitigation: each option is checked against the oracle whatever
  its size, and D-6 handles inputs the catalog cannot provide.
- **Request races in the UI.** Several requests per action could finish out of order.
  Mitigation: D-4 waits for the answer to the final criteria. If the shop renders a stale answer
  after it, the assertion fails and is reported as a possible defect, not weakened.
- **The oracle encodes the spec rules.** A mistake in it could make UI tests agree with a wrong
  expectation. Mitigation: D-1 cross-checks it against the live API on every run. A difference
  stops the task and is reported as a possible defect, never fixed by editing the oracle to match.
- **Loops on firefox and webkit under load** (TC-001-11 precedent). Mitigation: `test.slow()` on
  multi-case tests; run the suite per project locally with `--workers=2`.
- **No traces for catalog UI tests (RF-27).** Debugging relies on screenshots, the HTML report
  and the API answers recorded as test steps (statuses and product names only, never the token).
- **Expected failure (D-5).** If it is not approved, TC-002-31 fails on every run and blocks the
  promotion chain until the shop fixes the defect.

## Out of scope
- Product detail ("View" navigation), "Add To Cart" behavior, pagination, list order, guest
  access, images, ratings and descriptions, admin features (spec Out of scope).
- Accessibility of the filter panel (no RF). The missing labels are recorded here as an
  observation only.
- Unit tests for the oracle (no TC targets it; D-1 checks it live).
- Any change to `.gitlab-ci.yml` or the CI scripts: the new tests are picked up by the existing
  smoke and regression gates through their tags.
