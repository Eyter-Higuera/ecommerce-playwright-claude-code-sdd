# Spec 003 — Product detail

Status: implemented
<!-- Allowed values: draft | approved | test-cases-approved | implemented | validated -->
Source: interview

## Context and goal
Before buying, a customer opens a product to check its name, price and description. A detail page
that shows the wrong product, wrong data or a broken state misleads the customer just before the
cart and checkout. This spec defines the observable product detail behavior of
https://rahulshettyacademy.com/client and its product detail API:
- opening a product from the catalog;
- what the detail page shows;
- navigating back, opening the page directly and reloading it;
- handling unknown and malformed product ids;
- authorizing the product detail API.

As in Spec 002, the catalog belongs to a third party, so expected results are derived from the
catalog and the product API at test time, never from fixed products. Results marked "observed"
were seen on the live site on 2026-10-09.

## Users / actors
- Registered customer with a session (test account A; sessions come from Spec 001).
- Guest (no session).
- API consumer (calls the product detail API with or without a token).

## User stories
- US-1: As a registered customer I want to open a product from the catalog so that I can see its details before buying.
- US-2: As a registered customer I want to return to the catalog from a product so that I can keep shopping.
- US-3: As a registered customer I want a clear message when a product does not exist so that I know the link is wrong.
- US-4: As the shop owner I want the product detail API to reject calls without a valid session and to hide internal errors so that the shop stays private and safe.

## Requirements summary
Overview of the functional requirements below, grouped by block. It is a navigation aid only; the
EARS requirements are the source of truth.

| Block | Requirements | Content |
|---|---|---|
| Detail page | RF-1 to RF-5 | "View" opens the product's own detail route; name, price, description and "Add to Cart" control |
| Navigation and session | RF-6 to RF-8 | "Continue Shopping"; direct URL and reload; no session → login |
| Invalid ids in the UI | RF-9, RF-10 | Unknown id → "Product not found"; malformed id → a readable alert |
| Product detail API | RF-11 to RF-14 | Contract; same data as the catalog; unknown id → 400; malformed id → 4xx without internal details |
| API authorization | RF-15 to RF-17 | 401 without token, with a tampered token and with a malformed token |

## Functional requirements (acceptance criteria in EARS)

Shared definitions:
- *Catalog*: the products returned by the product API of Spec 002 with no search text and no filters, at test time.
- *Product detail route*: a URL containing `#/dashboard/product-details/{id}`, where `{id}` is the product `_id` (observed).
- *Product detail API*: `GET {API_BASE_URL}/product/get-product-detail/{id}`, with the login token in `Authorization` and no `Bearer` prefix (observed, as in Spec 001).
- *Well-formed id*: 24 hexadecimal characters, the format of every catalog `_id` (observed). *Unknown id*: a well-formed id of no product. *Malformed id*: any other value, including the injection-style input of Spec 001.
- *Alert*: a notification with role `alert` (observed: a toast, as in Spec 001 RF-7).

### Detail page
- RF-1: WHEN a logged-in customer activates the "View" control of a product card, THE SYSTEM SHALL navigate to the product detail route of that product. Source: interview Q1, Q4 (observed)
- RF-2: WHILE the product detail route of a catalog product is shown, THE SYSTEM SHALL show the product name as the page's main heading (letter case may differ). Source: interview Q1, Q5 (observed: level-2 heading)
- RF-3: WHILE the product detail route of a catalog product is shown, THE SYSTEM SHALL show the product price as "$ <price>". Source: interview Q1, Q5 (observed)
- RF-4: WHILE the product detail route of a catalog product is shown, THE SYSTEM SHALL show the product description. Source: interview Q1, Q5 (observed)
- RF-5: WHILE the product detail route of a catalog product is shown, THE SYSTEM SHALL show an enabled "Add to Cart" control. Source: interview Q2 (observed)

### Navigation and session
- RF-6: WHEN the customer activates the "Continue Shopping" link on a product detail route, THE SYSTEM SHALL navigate to the dashboard route and list the whole catalog. Source: interview Q6 (observed: `#/dashboard/dash`)
- RF-7: WHEN the product detail route of a catalog product is opened directly or reloaded while a customer is logged in, THE SYSTEM SHALL show that product (RF-2 to RF-4). Source: interview Q6 (observed)
- RF-8: IF the product detail route is opened without a session, THEN THE SYSTEM SHALL redirect to the login route. Source: interview Q6 (observed)

### Invalid ids in the UI
- RF-9: IF the product detail route is opened with an unknown id, THEN THE SYSTEM SHALL show an alert with the text "Product not found" within 30 s. Source: interview Q3 (observed)
- RF-10: IF the product detail route is opened with a malformed id, THEN THE SYSTEM SHALL show an alert whose text is a non-empty message that is not "[object Object]". Source: interview Q3 (observed today: "[object Object]", a known defect; see Known issues)

### Product detail API
- RF-11: WHEN the product detail API is called with the `_id` of a catalog product and a valid token, THE SYSTEM SHALL answer HTTP 200 with the message "Product Details fetched Successfully" and a `data` object whose `_id` equals the requested id, with a non-empty `productName`, `productCategory`, `productSubCategory`, `productFor` and `productDescription` and a numeric `productPrice`. Source: interview Q1 (observed)
- RF-12: WHEN the product detail API answers for a catalog product, THE SYSTEM SHALL return the same `productName`, `productPrice`, `productCategory`, `productSubCategory`, `productFor` and `productDescription` as the catalog. Source: interview Q5
- RF-13: IF the product detail API is called with an unknown id and a valid token, THEN THE SYSTEM SHALL answer HTTP 400 with the message "Product not found" and no `data`. Source: interview Q3 (observed)
- RF-14: IF the product detail API is called with a malformed id and a valid token, THEN THE SYSTEM SHALL answer with an HTTP 4xx status whose `message` is a string that names no internal error (such as "CastError" or "ObjectId"). Source: interview Q3 (observed today: HTTP 500 with the database error, a known defect; see Known issues)

### API authorization
- RF-15: IF the product detail API is called without an `Authorization` header, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Access denied. No token provided." and no `data`. Source: interview Q1 (observed)
- RF-16: IF the product detail API is called with a tampered token (a valid token whose last 4 characters are replaced), THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout" and no `data`. Source: interview Q1 (observed)
- RF-17: IF the product detail API is called with a malformed token, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout" and no `data`. Source: interview Q1 (observed)

## Non-functional requirements
- Test data: every product is taken from the catalog read through the API in the same test; every product of the catalog is checked (interview Q4). Unknown and malformed ids use the `TEST_` prefix or a fixed all-zero well-formed id. No data is created on the shop, so no cleanup is needed.
- Accounts: test account A only, with an API-established session (Spec 001). No password is typed, and no auth token reaches a trace, report or attachment (Spec 001 RF-27).
- Browsers: UI requirements run on chromium, firefox and webkit (regression); the smoke subset runs on chromium and the `api` project.
- Time budgets: the 30 s navigation and API budgets of Spec 000 apply.
- Stability: transient alerts are asserted only where an RF names them (RF-9, RF-10), within 30 s.
- Language: everything in English.

## Edge cases
- Product names, prices or descriptions that repeat across products (observed: two products priced 11500): each detail route must still show its own product (RF-1).
- Name letter case: the list shows names in upper case; the detail compares ignoring letter case (RF-2).
- The dashboard shows at most 9 products on a page (observed); products beyond the first page are reached only through the API and the direct route (RF-7, RF-11).
- Catalog changes during a run: as in Spec 002, a product removed between the catalog read and the detail call can cause a false failure; a re-run is expected to pass.
- Opening a second detail route in the same page by changing only the URL hash kept the previous product on screen (observed). Each detail check therefore starts from a fresh page load or from "View".

## Known issues (observed, not requirements of this spec)
- Possible defect (RF-14): a malformed id makes the product detail API answer HTTP 500 with the internal database error ("CastError", "Cast to ObjectId failed …"). This also discloses internal details.
- Possible defect (RF-10): the UI then shows the alert "[object Object]".
- For an unknown or malformed id, the page stays on an empty product: an empty name, a lone "$" and an "Add to Cart" control. No requirement covers this state.

## Out of scope
- The effect of "Add to Cart" (planned for the cart spec; only its presence is checked here, interview Q2).
- The "Share It" links, product images and ratings.
- The browser Back button from the detail page (interview Q6).
- Pagination of the catalog and products beyond the first page in the UI.
- Creating, editing or deleting products (admin features).

## Done criteria
- Every RF has approved test cases.
- All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit.
- test-reviewer PASS.
- `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- The pipeline on `eyter_dev` is green.
- User validation.

## Open questions
None.

## Resolved clarifications
1. Scope: "View" to detail navigation, detail content, the product detail API, "Continue Shopping" and direct access (interview Q1).
2. "Add to Cart" on the detail page: only its presence is checked; its effect belongs to the cart spec (interview Q2).
3. Invalid ids (interview Q3): for an unknown id the observed behavior is adopted (API 400 "Product not found", UI alert "Product not found"). For a malformed id the spec requires an API 4xx without internal details and a readable UI alert. Both fail today and are known defects.
4. Every catalog product is checked through "View" and its detail page (interview Q4).
5. Detail content is checked against the detail API, and the detail API against the catalog (interview Q5).
6. Navigation and session: "Continue Shopping", direct URL and reload, and no session → login. The browser Back button is out of scope (interview Q6).
