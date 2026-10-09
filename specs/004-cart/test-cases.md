# Test Cases — Spec 004 Cart

Source spec: specs/004-cart/spec.md · Ticket: N/A · Status: approved
<!-- Allowed values: draft | approved -->

## Summary
- 30 test cases for 28 RFs. Several TCs cover more than one RF when one scenario
  proves the positive case of one RF and the negative case of another.
- Layers: ui 16, mocked 1, api 13.
- Automated: 30; manual: 0.
- Smoke: 2 TCs (7%), all P1: TC-004-01, TC-004-17.
- Every test registers its own `TEST_` customer and empties its cart at the end (spec clarification
  2); the fixed accounts A and B are never used. Products and prices come from the catalog read in
  the same test; only the mocked TC uses its own `TEST_` products.
- UI tests get their session through the API and type no password; the browser holds the auth
  token, so they record no trace (Spec 001 RF-27).
- Expected to fail today (known defects of the spec): TC-004-13, TC-004-15, TC-004-21, TC-004-22, TC-004-23, TC-004-30.

## Coverage matrix
| RF | Positive | Negative | Boundary | Security | Total |
|----|----------|----------|----------|----------|-------|
| RF-1 | TC-004-01 | TC-004-08 | — | — | 2 |
| RF-2 | TC-004-02 | TC-004-12 | — | — | 2 |
| RF-3 | TC-004-01, TC-004-03 | TC-004-08 | TC-004-03 | — | 3 |
| RF-4 | TC-004-04 | TC-004-16 | TC-004-05 | — | 3 |
| RF-5 | TC-004-05 | TC-004-03 | TC-004-05 | — | 2 |
| RF-6 | TC-004-06, TC-004-10 | TC-004-08 | TC-004-10 | — | 3 |
| RF-7 | TC-004-07, TC-004-10 | TC-004-30 | TC-004-10 | — | 3 |
| RF-8 | TC-004-08, TC-004-12 | TC-004-06 | TC-004-08 | — | 3 |
| RF-9 | TC-004-09 | TC-004-14 | — | — | 2 |
| RF-10 | TC-004-11, TC-004-20 | TC-004-14, TC-004-30 | — | — | 4 |
| RF-11 | TC-004-12 | TC-004-11 | TC-004-12 | — | 2 |
| RF-12 | TC-004-13 | TC-004-11 | — | — | 2 |
| RF-13 | TC-004-14 | TC-004-16 | — | — | 2 |
| RF-14 | TC-004-15 | TC-004-16 | — | — | 2 |
| RF-15 | TC-004-16 | TC-004-14 | — | TC-004-16 | 2 |
| RF-16 | TC-004-17 | TC-004-24 | — | TC-004-27 | 3 |
| RF-17 | TC-004-18 | TC-004-19 | — | TC-004-27 | 3 |
| RF-18 | TC-004-19 | TC-004-18 | TC-004-19 | TC-004-27 | 3 |
| RF-19 | TC-004-20 | TC-004-26 | — | TC-004-27 | 3 |
| RF-20 | TC-004-21 | TC-004-17 | TC-004-21 | TC-004-21 | 2 |
| RF-21 | TC-004-22 | TC-004-24 | — | TC-004-22 | 2 |
| RF-22 | TC-004-23 | TC-004-24 | TC-004-23 | — | 2 |
| RF-23 | TC-004-24 | TC-004-17 | — | TC-004-24 | 2 |
| RF-24 | TC-004-25 | TC-004-18 | — | TC-004-25 | 2 |
| RF-25 | TC-004-26 | TC-004-20 | — | TC-004-26 | 2 |
| RF-26 | TC-004-27 | TC-004-17 | — | TC-004-27 | 2 |
| RF-27 | TC-004-28 | TC-004-17 | — | TC-004-28 | 2 |
| RF-28 | TC-004-29 | TC-004-17 | — | TC-004-29 | 2 |

## Test cases

### TC-004-01 — Add To Cart on a product card adds it to the cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-3 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** the dashboard with an empty cart **When** "Add To Cart" is activated on the product's card **Then** the product is in the cart |
| Expected result | Cart API lists exactly that product; header Cart control shows 1. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-02 — adding a product shows the Product Added To Cart alert
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** the dashboard **When** a product is added from its card **Then** the customer is told |
| Expected result | Alert "Product Added To Cart" within 30 s. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-03 — header count follows the number of products in the cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-3, RF-5 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; two catalog products |
| Steps           | **Given** an empty cart **When** two products are added, then one and then the other are removed **Then** the header count follows |
| Expected result | Header Cart control: no number → 1 → 2 → 1 → no number |
| Automate        | Y |

### TC-004-04 — Add to Cart on the product detail page adds the product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** the product detail route of a product (Spec 003) **When** "Add to Cart" is activated **Then** the product is in the cart |
| Expected result | Cart API lists exactly that product; header Cart control shows 1. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-05 — adding a product already in the cart keeps a single line
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5, RF-4 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product, added from its card and then from its detail page |
| Steps           | **Given** a cart with the product **When** the same product is added again **Then** nothing is duplicated |
| Expected result | Cart route shows one line for the product; header count 1; cart API count 1. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-06 — cart page lists each product with its catalog price
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6, RF-8 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; two catalog products added through the cart API with their catalog data |
| Steps           | **Given** a cart with two products **When** the cart route is opened **Then** each product is listed |
| Expected result | Two cart lines; each shows its product name (ignoring letter case) and "$ <catalog price>". The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-07 — Subtotal and Total equal the sum of the line prices
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; two catalog products, preferably two with the same price (observed today: two at 11500) |
| Steps           | **Given** a cart with two products **When** the cart route is opened **Then** the totals add up |
| Expected result | Subtotal = Total = sum of the two catalog prices (e.g. $23000). The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-08 — empty cart page shows the empty message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8, RF-1, RF-3, RF-6 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | None (empty cart) |
| Steps           | **Given** a customer with an empty cart **When** the cart route is opened **Then** the empty state is shown |
| Expected result | "No Products in Your Cart !"; no cart line, no total; header Cart control shows no number |
| Automate        | Y |

### TC-004-09 — Continue Shopping returns from the cart to the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | None (empty cart) |
| Steps           | **Given** the cart route **When** "Continue Shopping" is activated **Then** the dashboard is shown |
| Expected result | URL contains `#/dashboard`; the product list is shown |
| Automate        | Y |

### TC-004-10 — cart page shows the names, prices and totals of the cart answer
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6, RF-7 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace); cart products answer replaced by a mocked response |
| Test data       | Mocked cart answer with two TEST_ products: `TEST_Cart_Zero` at price 0 and `test_cart_big` at price 999999 |
| Steps           | **Given** a cart answer with two TEST_ products **When** the cart route is opened **Then** the page shows exactly that data |
| Expected result | Two lines with their names (ignoring letter case) and "$ 0" and "$ 999999"; Subtotal = Total = $999999 |
| Automate        | Y |

### TC-004-11 — removing one of two products updates the lines and count
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10, RF-11, RF-12 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; two catalog products in the cart |
| Steps           | **Given** a cart with two products **When** the remove control of one line is activated **Then** only the other remains |
| Expected result | One line (the other product); header count 1; cart API lists only it. The totals after a removal are checked by TC-004-30. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-12 — removing the last product shows the empty state
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-11, RF-8, RF-2 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product in the cart |
| Steps           | **Given** a cart with one product **When** its remove control is activated **Then** the cart is empty |
| Expected result | "No Products in Your Cart !"; header Cart control shows no number; no "Product Added To Cart" alert |
| Automate        | Y |

### TC-004-13 — the remove control has an accessible name
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product in the cart |
| Steps           | **Given** a cart line **When** its remove control is inspected through the accessibility tree **Then** it names the remove action |
| Expected result | The remove control of the line has a non-empty accessible name that names the remove action (e.g. "Remove", "Delete"). Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-14 — reloading the cart page keeps its lines
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-9, RF-10, RF-15 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product in the cart |
| Steps           | **Given** the cart route with one product **When** the page is reloaded **Then** the cart is the same |
| Expected result | Still on the cart route; the same line and total. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-15 — signing out and back in keeps the cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-14 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; one catalog product in the cart |
| Steps           | **Given** a cart with one product **When** the customer signs out and a new session of the same customer is started **Then** the cart is still there |
| Expected result | Cart route shows the same line; header count 1. Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it (observed: every new login empties the cart). The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-16 — cart route without a session redirects to the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15, RF-4, RF-13, RF-14 |
| Priority        | P1 |
| Type            | Security |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | No session (no stored token) |
| Test data       | None |
| Steps           | **Given** a guest **When** the cart route is opened **Then** access is refused |
| Expected result | URL contains `#/auth/login`; no cart line and no total |
| Automate        | Y |

### TC-004-17 — cart API adds a catalog product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16, RF-20, RF-23, RF-26, RF-27, RF-28 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @smoke @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Catalog read through the product API in the same test; one catalog product, sent with its catalog data |
| Steps           | **Given** an empty cart **When** the product is added through the cart API **Then** it is accepted |
| Expected result | HTTP 200; message "Product Added To Cart"; the cart then lists the product. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-18 — cart API lists and counts the products of the cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-17, RF-24, RF-18 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Catalog read through the product API in the same test; two catalog products in the cart |
| Steps           | **Given** a cart with two products **When** the cart is listed and counted **Then** both answers agree |
| Expected result | List: HTTP 200, "Cart Data Found", `products` with the two products, `count` 2; count endpoint: "Cart Data Found", `count` 2. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-19 — cart API answers No Product in Cart for an empty cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18, RF-17 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | None (empty cart) |
| Steps           | **Given** an empty cart **When** it is listed and counted **Then** both answers say it is empty |
| Expected result | Both: HTTP 200; message "No Product in Cart"; no product |
| Automate        | Y |

### TC-004-20 — cart API removes a product from the cart
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-19, RF-10, RF-25 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Catalog read through the product API in the same test; two catalog products in the cart |
| Steps           | **Given** a cart with two products **When** one is removed through the cart API **Then** it is gone |
| Expected result | HTTP 200; "Product Removed from cart"; the list shows only the other product, `count` 1. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-21 — cart API keeps the catalog price when a different price is sent
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-20 |
| Priority        | P1 |
| Type            | Security |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Catalog read through the product API in the same test; one catalog product sent with price 0, 1 and catalog price − 1 (one at a time, cart emptied between them) |
| Steps           | **Given** an empty cart **When** the product is added with each altered price **Then** the price cannot be changed by the client |
| Expected result | For each price: either an HTTP 4xx status, or HTTP 200 and the cart lists the product at its catalog price. Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-22 — cart API rejects a product that is not in the catalog
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-21 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | A catalog product with `_id` `000000000000000000000000` and name `TEST_ghost` |
| Steps           | **Given** an empty cart **When** the unknown product is added **Then** it is refused |
| Expected result | HTTP 4xx; the cart stays empty. Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-23 — cart API rejects an add request without a product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-22 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Body `{ _id: <userId> }` with no `product` |
| Steps           | **Given** a valid token **When** the add request has no product **Then** it is a client error |
| Expected result | HTTP status 400 to 499. Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it |
| Automate        | Y |

### TC-004-24 — adding to another customer's cart is refused
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23, RF-16, RF-21, RF-22 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Decision table |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Two fresh TEST_ customers, each with an empty cart and its own token |
| Test data       | Catalog read through the product API in the same test; one catalog product; customer 1 sends customer 2's userId |
| Steps           | **Given** two customers **When** customer 1 adds a product to customer 2's cart **Then** it is refused |
| Expected result | HTTP 400; message "Not Authorized!"; customer 2's cart stays empty |
| Automate        | Y |

### TC-004-25 — listing another customer's cart is refused
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-24 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Decision table |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Two fresh TEST_ customers; customer 2 has one product in the cart |
| Test data       | Catalog read through the product API in the same test; one catalog product in customer 2's cart |
| Steps           | **Given** two customers **When** customer 1 lists customer 2's cart with its own token **Then** nothing is disclosed |
| Expected result | HTTP 4xx; no product of customer 2 in the answer. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-26 — removing from another customer's cart is refused
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-25, RF-19 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Decision table |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Two fresh TEST_ customers; customer 2 has one product in the cart |
| Test data       | Catalog read through the product API in the same test; one catalog product in customer 2's cart |
| Steps           | **Given** two customers **When** customer 1 removes customer 2's product with its own token **Then** it is refused |
| Expected result | HTTP 4xx; customer 2's cart still lists the product. The cart is emptied at the end of the test |
| Automate        | Y |

### TC-004-27 — cart endpoints without Authorization answer 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-26, RF-16, RF-17, RF-18, RF-19 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Add, list, count and remove calls with the customer's userId and no `Authorization` header |
| Steps           | **Given** no token **When** each cart endpoint is called **Then** access is denied |
| Expected result | For each endpoint: HTTP 401; message "Access denied. No token provided." |
| Automate        | Y |

### TC-004-28 — cart endpoints with a tampered token answer 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | The customer's token with its last 4 characters replaced, on add, list, count and remove |
| Steps           | **Given** a tampered token **When** each cart endpoint is called **Then** access is denied |
| Expected result | For each endpoint: HTTP 401; message "Session Timeout" |
| Automate        | Y |

### TC-004-29 — cart endpoints with a malformed token answer 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-28 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its token and userId from an API login |
| Test data       | Malformed token value of Spec 001 (`MALFORMED_AUTHORIZATION`) on add, list, count and remove |
| Steps           | **Given** a malformed token **When** each cart endpoint is called **Then** access is denied |
| Expected result | For each endpoint: HTTP 401; message "Session Timeout" |
| Automate        | Y |

### TC-004-30 — totals are recomputed after removing a product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10, RF-7 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | A fresh TEST_ customer registered through the API, with an empty cart; its session placed in the browser through the API (no password typed, no trace) |
| Test data       | Catalog read through the product API in the same test; two catalog products in the cart (observed today: two at 11500) |
| Steps           | **Given** a cart with two products **When** one line is removed **Then** the totals drop by its price without a reload |
| Expected result | Subtotal = Total = price of the remaining product (e.g. $11500). Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it (observed: $34500 until a reload). The cart is emptied at the end of the test |
| Automate        | Y |

## Out of scope for testing
- "Buy Now", "Checkout", quantities, registration and account management as features, the fixed
  accounts' carts, images, ratings and stock texts (spec Out of scope).
- Known issue that is not a requirement: removing a product that is not in the cart, or with a
  malformed id, answers HTTP 200 "Product Removed from cart". It has no test case.
- Load, performance and penetration testing (docs/test-plan.md §2).

## Notes for the plan
- Test customers: a fixture registers a `TEST_` customer through `POST /auth/register` and logs it
  in through the API; the generated password must never reach a file, log, report or trace. The
  cart is emptied in the fixture teardown, also when the test fails.
- TC-004-13, TC-004-15, TC-004-21, TC-004-22, TC-004-23, TC-004-30 are expected to fail (known defects). Decide how to mark them, as Spec 002
  plan D-5 did.
- TC-004-24 to TC-004-26 need two customers in one test.
- TC-004-15 signs out in the UI and starts a new session of the same customer. Decide whether the
  new session comes from the API (no password typed) or from the login form (Spec 001 `enterSecret`).
- `TODO: VERIFY` live: "Add to Cart" on the detail page (TC-004-04, 05), the two-customer list and
  remove answers (TC-004-25, 26), and the tampered and malformed token answers (TC-004-28, 29). A
  difference from the spec is reported as a possible defect.
- The remove control has no accessible name (RF-12), so the other UI tests need a justified
  fallback locator for it.
- Smoke additions: TC-004-01 and TC-004-17.

## Open questions
None.
