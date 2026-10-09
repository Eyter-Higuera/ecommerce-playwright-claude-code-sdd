# Spec 004 — Cart

Status: validated
<!-- Allowed values: draft | approved | test-cases-approved | implemented | validated -->
Source: interview

## Context and goal
The cart holds what a customer intends to buy and feeds checkout, so wrong products, wrong prices or
wrong totals there turn directly into wrong orders and lost revenue. This spec defines the observable
cart behavior of https://rahulshettyacademy.com/client and its cart API:
- adding products from the catalog and from the product detail page;
- the cart page, its totals and its empty state;
- removing products;
- keeping the cart across reloads and sessions;
- protecting each customer's cart from other customers and from tampered data.

The cart lives on the server and belongs to an account, so tests change real data. Unlike Specs 001
to 003, each test works with its own freshly registered `TEST_` customer (interview Q2). Results
marked "observed" were seen on the live site on 2026-10-09.

## Users / actors
- Registered customer with a session: a `TEST_` customer registered through the API for the test.
- A second `TEST_` customer, for isolation between carts.
- Guest (no session).
- API consumer (calls the cart API with or without a token).

## User stories
- US-1: As a registered customer I want to add products to my cart so that I can buy them together.
- US-2: As a registered customer I want to see my cart with correct prices and totals so that I know what I will pay.
- US-3: As a registered customer I want to remove products from my cart so that I only buy what I want.
- US-4: As a registered customer I want my cart to be kept between visits so that I do not lose my selection.
- US-5: As the shop owner I want each cart to accept only real catalog products at catalog prices, and only from its owner, so that orders cannot be manipulated.

## Requirements summary
Overview of the functional requirements below, grouped by block. It is a navigation aid only; the
EARS requirements are the source of truth.

| Block | Requirements | Content |
|---|---|---|
| Adding products | RF-1 to RF-5 | From a card and from the detail page; "Product Added To Cart" alert; header count; same product twice |
| Cart page | RF-6 to RF-9 | One line per product with name and catalog price; Subtotal and Total; empty state; "Continue Shopping" |
| Removing products | RF-10 to RF-12 | Remove control; last product removed; accessible name of the remove control |
| Session | RF-13 to RF-15 | Reload; sign out and back in; no session → login |
| Cart API | RF-16 to RF-19 | Add, list, count and remove contracts; empty-cart answers |
| Cart data integrity | RF-20 to RF-22 | Catalog price kept; unknown product rejected; missing product rejected |
| Isolation and authorization | RF-23 to RF-28 | Another customer's cart cannot be read or changed; 401 without token, with a tampered token and with a malformed token |

## Functional requirements (acceptance criteria in EARS)

Shared definitions:
- *Catalog*: the products returned by the product API of Spec 002 with no criteria, at test time.
- *Cart route*: a URL containing `#/dashboard/cart` (observed).
- *Header Cart control*: the header button "Cart", which shows the number of products in the cart after its label when the cart is not empty (observed: "Cart 1").
- *Cart line*: one product shown on the cart route, with its name and price.
- *Cart API* (observed): `POST {API_BASE_URL}/user/add-to-cart` with `{ _id: <userId>, product: <product> }`; `GET {API_BASE_URL}/user/get-cart-products/{userId}`; `GET {API_BASE_URL}/user/get-cart-count/{userId}`; `DELETE {API_BASE_URL}/user/remove-from-cart/{userId}/{productId}`. The login token goes in `Authorization` with no `Bearer` prefix, as in Spec 001.
- *Owner*: the customer whose `userId` and token are used; *another customer*: a different registered `TEST_` customer.

### Adding products
- RF-1: WHEN a logged-in customer activates "Add To Cart" on a product card, THE SYSTEM SHALL add that product to the customer's cart. Source: interview Q1 (observed)
- RF-2: WHEN a product is added to the cart from the UI, THE SYSTEM SHALL show an alert with the text "Product Added To Cart" within 30 s. Source: interview Q1 (observed)
- RF-3: WHILE the cart holds N products with N ≥ 1, THE SYSTEM SHALL show N in the header Cart control; WHILE the cart is empty, it SHALL show no number. Source: interview Q1 (observed)
- RF-4: WHEN a logged-in customer activates "Add to Cart" on a product detail route (Spec 003), THE SYSTEM SHALL add that product to the customer's cart. Source: interview Q1 (TODO: VERIFY live during implementation)
- RF-5: IF a product that is already in the cart is added again, THEN THE SYSTEM SHALL keep a single cart line for it and leave the number of products unchanged. Source: interview Q4 (observed)

### Cart page
- RF-6: WHILE the cart route is shown for a non-empty cart, THE SYSTEM SHALL show one cart line per product in the cart, with the product name (letter case may differ) and its catalog price as "$ <price>". Source: interview Q1 (observed)
- RF-7: WHILE the cart route is shown for a non-empty cart, THE SYSTEM SHALL show a Subtotal and a Total, each equal to the sum of the prices of the cart lines. Source: interview Q1, Q4 (observed: "Subtotal $11500", "Total $11500")
- RF-8: WHILE the cart route is shown for an empty cart, THE SYSTEM SHALL show "No Products in Your Cart !" and no cart line. Source: interview Q1 (observed)
- RF-9: WHEN the customer activates "Continue Shopping" on the cart route, THE SYSTEM SHALL navigate to the dashboard route. Source: interview Q1 (observed)

### Removing products
- RF-10: WHEN the customer activates the remove control of a cart line, THE SYSTEM SHALL remove that product: its line disappears, the Subtotal and Total drop by its price, and the header count drops by one. Source: interview Q1 (observed)
- RF-11: WHEN the last product of the cart is removed, THE SYSTEM SHALL show the empty state of RF-8. Source: interview Q1 (observed)
- RF-12: THE SYSTEM SHALL give the remove control of each cart line an accessible name that names the remove action. Source: interview Q5 (observed today: no accessible name, a known defect; see Known issues)

### Session
- RF-13: WHEN the cart route is reloaded, THE SYSTEM SHALL show the same cart lines. Source: interview Q6
- RF-14: WHEN a customer signs out and logs in again, THE SYSTEM SHALL show the same cart as before signing out. Source: interview Q6
- RF-15: IF the cart route is opened without a session, THEN THE SYSTEM SHALL redirect to the login route. Source: interview Q6

### Cart API
- RF-16: WHEN the owner adds a catalog product through the cart API, THE SYSTEM SHALL answer HTTP 200 with the message "Product Added To Cart". Source: interview Q1 (observed)
- RF-17: WHEN the owner lists a non-empty cart through the cart API, THE SYSTEM SHALL answer HTTP 200 with the message "Cart Data Found", a `products` array with one entry per product in the cart, and a `count` equal to its length; the cart count endpoint SHALL answer the same `count` and message. Source: interview Q1 (observed)
- RF-18: WHEN the owner lists or counts an empty cart through the cart API, THE SYSTEM SHALL answer HTTP 200 with the message "No Product in Cart" and no product. Source: interview Q1 (observed)
- RF-19: WHEN the owner removes a product of the cart through the cart API, THE SYSTEM SHALL answer HTTP 200 with the message "Product Removed from cart", and the product SHALL no longer be listed. Source: interview Q1 (observed)

### Cart data integrity
- RF-20: IF a catalog product is added through the cart API with a price that differs from its catalog price, THEN THE SYSTEM SHALL either reject the request with an HTTP 4xx status or keep the catalog price in the cart. Source: interview Q3 (observed today: the sent price is kept, a known defect; see Known issues)
- RF-21: IF a product whose `_id` is not in the catalog is added through the cart API, THEN THE SYSTEM SHALL answer with an HTTP 4xx status and leave the cart unchanged. Source: interview Q3 (observed today: accepted, a known defect)
- RF-22: IF the cart API is asked to add without a product, THEN THE SYSTEM SHALL answer with an HTTP 4xx status. Source: interview Q3 (observed: HTTP 500, later HTTP 200; a known defect)

### Isolation and authorization
- RF-23: IF a customer adds a product to another customer's cart through the cart API, THEN THE SYSTEM SHALL answer HTTP 400 with the message "Not Authorized!" and leave the other cart unchanged. Source: interview Q6 (observed)
- RF-24: IF a customer lists another customer's cart through the cart API, THEN THE SYSTEM SHALL answer with an HTTP 4xx status and none of the other customer's products. Source: interview Q6 (TODO: VERIFY live with two customers)
- RF-25: IF a customer removes a product from another customer's cart through the cart API, THEN THE SYSTEM SHALL answer with an HTTP 4xx status and leave the other cart unchanged. Source: interview Q6 (TODO: VERIFY live with two customers)
- RF-26: IF a cart API endpoint is called without an `Authorization` header, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Access denied. No token provided.". Source: interview Q6 (observed for add and remove)
- RF-27: IF a cart API endpoint is called with a tampered token (a valid token whose last 4 characters are replaced), THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout". Source: interview Q6 (as in Spec 001; TODO: VERIFY live)
- RF-28: IF a cart API endpoint is called with a malformed token, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout". Source: interview Q6 (as in Spec 001; TODO: VERIFY live)

## Non-functional requirements
- Test customers: every test registers its own customer through the shop's registration API, with `TEST_` names and a unique `TEST_`-style email, and a generated password that is never written to files, logs or reports (interview Q2). The shop offers no way to delete an account, so these accounts remain; each test empties its customer's cart at the end.
- Fixed accounts A and B (Spec 001) are not used for cart tests, so their carts stay untouched.
- Products come from the catalog read in the same test (Spec 002 clarification 2); expected prices and totals are computed from catalog prices.
- No auth token or password reaches a trace, report or attachment (Spec 001 RF-27).
- Browsers: UI requirements run on chromium, firefox and webkit (regression); the smoke subset runs on chromium and the `api` project.
- Time budgets: the 30 s navigation and API budgets of Spec 000 apply.
- Stability: transient alerts are asserted only where an RF names them (RF-2), within 30 s.
- Language: everything in English.

## Edge cases
- Two catalog products with the same price (observed): totals must count both lines.
- The same product added twice (RF-5), from the card and from the detail page.
- Removing the only product (RF-11) and removing one of several (RF-10).
- A product removed from the catalog by a third party while it is in a cart: not controllable; a re-run is expected to pass.
- Registration fails (the shop rejects it or is down): the test cannot start and fails with a clear message naming the registration step, never a password.
- The empty-cart answers have no `count` field (observed); RF-18 is judged on the message and the absence of products.

## Known issues (observed, not requirements of this spec)
- Possible defect (RF-20, revenue-critical): the cart API keeps the price sent by the client. A catalog product priced 11500 was added at 1 and listed at 1.
- Possible defect (RF-21): the cart API accepts a product that is not in the catalog.
- Possible defect (RF-22): adding without a product is not answered with a client error: HTTP 500 in the first probe, HTTP 200 in the T3 run (2026-10-09).
- Possible defect (RF-10, RF-7, revenue-critical, found in T9): after one product is removed, the cart page shows the old total plus the price of the remaining line (two products at 11500: $23000, then $34500 instead of $11500) until the page is reloaded. The server cart is right.
- Possible defect (RF-14, revenue-critical, found in T10): every new login empties the customer's cart on the server (a second API login alone did it); Sign Out is not the cause.
- Possible defect (RF-12, accessibility): the remove control is an icon-only button with no accessible name.
- Removing a product that is not in the cart, or with a malformed id, answers HTTP 200 "Product Removed from cart". No requirement covers this lenient answer.
- The registration API answers a duplicate email with "User already exisits with this Email Id!" (sic); registration is not under test in this spec.

## Out of scope
- "Buy Now" and "Checkout" (planned for the checkout spec).
- Quantities (the shop has none; interview Q4).
- Registration and account management as features (only used as test setup).
- Fixed accounts A and B, and their carts.
- Product images, ratings and stock texts ("In Stock") beyond their presence.

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
1. Scope: adding products, the cart page, removing products and the cart API (interview Q1).
2. Test data isolation: each test registers its own `TEST_` customer and empties its cart at the end; the fixed accounts are not used (interview Q2).
3. Data integrity: the cart must keep catalog prices, reject unknown products and reject a missing product. All three fail today and are known defects (interview Q3).
4. The same product added twice keeps a single line; the observed behavior is adopted (interview Q4).
5. The remove control must have an accessible name; it fails today and is a known defect (interview Q5).
6. Session and isolation: persistence across reload and sign-in, isolation between customers, and no session → login are in scope; "Buy Now" and "Checkout" are not (interview Q6).
7. Totals after a removal (2026-10-09, found in T9, Mode C approved by the user): RF-10 is unchanged. The observed wrong totals are a known defect; TC-004-11 keeps the line, count and server checks, and the new TC-004-30 checks the totals as an expected failure.
8. Cart across sign-ins (2026-10-09, found in T10, approved by the user): RF-14 is kept. The shop empties the cart on every new login, a known defect; TC-004-15 is an expected failure.
