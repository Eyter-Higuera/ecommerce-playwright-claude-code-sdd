# Test Cases — Spec 003 Product detail

Source spec: specs/003-product-detail/spec.md · Ticket: N/A · Status: approved
<!-- Allowed values: draft | approved -->

## Summary
- 19 test cases for 17 RFs. Several TCs cover more than one RF when one scenario
  proves the positive case of one RF and the negative case of another.
- Layers: ui 11, mocked 1, api 7.
- Automated: 19; manual: 0.
- Smoke: 2 TCs (11%), all P1: TC-003-01, TC-003-13.
- Expected results come from the catalog and the product detail API read in the same test (spec
  non-functional requirements); every catalog product is checked. Only the mocked TC uses its own
  `TEST_` product.
- UI tests get their session through the API and type no password. They hold the auth token in the
  browser, so they record no trace (Spec 001 RF-27).
- TC-003-12 and TC-003-16 are expected to fail today: the known defects of the spec (RF-10 and
  RF-14).

## Coverage matrix
| RF | Positive | Negative | Boundary | Security | Total |
|----|----------|----------|----------|----------|-------|
| RF-1 | TC-003-01 | TC-003-06 | TC-003-04 | — | 3 |
| RF-2 | TC-003-02, TC-003-05 | TC-003-06 | TC-003-04, TC-003-05 | — | 4 |
| RF-3 | TC-003-02, TC-003-05 | TC-003-06 | TC-003-05 | — | 3 |
| RF-4 | TC-003-02, TC-003-05 | TC-003-06 | TC-003-05 | — | 3 |
| RF-5 | TC-003-03 | TC-003-10 | — | — | 2 |
| RF-6 | TC-003-07 | TC-003-06 | — | — | 2 |
| RF-7 | TC-003-08, TC-003-09 | TC-003-10 | — | — | 3 |
| RF-8 | TC-003-10 | TC-003-08 | — | TC-003-10 | 2 |
| RF-9 | TC-003-11 | TC-003-08 | — | — | 2 |
| RF-10 | TC-003-12 | TC-003-08 | — | — | 2 |
| RF-11 | TC-003-13 | TC-003-15 | — | — | 2 |
| RF-12 | TC-003-14 | TC-003-15 | — | — | 2 |
| RF-13 | TC-003-15 | TC-003-13 | TC-003-15 | — | 2 |
| RF-14 | TC-003-16 | TC-003-15 | TC-003-16 | TC-003-16 | 2 |
| RF-15 | TC-003-17 | TC-003-13 | — | TC-003-17 | 2 |
| RF-16 | TC-003-18 | TC-003-13 | — | TC-003-18 | 2 |
| RF-17 | TC-003-19 | TC-003-13 | — | TC-003-19 | 2 |

## Test cases

### TC-003-01 — View on each catalog card opens that product's detail route
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard open |
| Test data       | Catalog read through the product API in the same test; every product on the first page (at most 9) |
| Steps           | **Given** the dashboard **When** "View" is activated on each card in turn (back to the dashboard between cards) **Then** each opens its own detail route |
| Expected result | For each card: URL contains `#/dashboard/product-details/{_id}` of that product |
| Automate        | Y |

### TC-003-02 — detail page shows the name, price and description of each catalog product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2, RF-3, RF-4 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Catalog read through the product API in the same test; every catalog product, each detail route opened on a fresh page load |
| Steps           | **Given** a catalog product **When** its detail route is shown **Then** its data is displayed |
| Expected result | Main heading = product name (ignoring letter case); price text "$ <productPrice>"; description = `productDescription` |
| Automate        | Y |

### TC-003-03 — detail page shows an enabled Add to Cart control
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** a catalog product **When** its detail route is shown **Then** the control is offered |
| Expected result | "Add to Cart" button visible and enabled; it is not activated (its effect belongs to the cart spec) |
| Automate        | Y |

### TC-003-04 — two products with the same price open different detail pages
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-2 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard open |
| Test data       | Catalog read through the product API in the same test; two catalog products with the same price (observed today: two at 11500) |
| Steps           | **Given** two cards with equal prices **When** "View" is activated on each **Then** each detail shows its own product |
| Expected result | Different detail routes (their own `_id`) and different names; no product is shown for the other |
| Automate        | Y |

### TC-003-05 — detail page shows the name, price and description of the API answer
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2, RF-3, RF-4 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); product detail API answer replaced by a mocked response |
| Test data       | Mocked detail answer: `test_detail_product`, price 0, description `TEST_description`; route opened with a well-formed id |
| Steps           | **Given** a product detail API that returns a TEST_ product **When** its detail route is opened **Then** the page shows exactly that data |
| Expected result | Heading `test_detail_product` (ignoring letter case); price "$ 0" (lower price boundary); description `TEST_description` |
| Automate        | Y |

### TC-003-06 — viewing a second product after Continue Shopping shows the second product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-2, RF-3, RF-4, RF-6 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard open |
| Test data       | Catalog read through the product API in the same test; two catalog products A and B with different names |
| Steps           | **Given** the detail of A **When** "Continue Shopping" and then "View" on B are activated **Then** only B's data is shown |
| Expected result | Detail route of B; heading, price and description of B; nothing of A remains |
| Automate        | Y |

### TC-003-07 — Continue Shopping returns to the dashboard with the whole catalog
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** a detail page **When** "Continue Shopping" is activated **Then** the catalog is listed again |
| Expected result | URL contains `#/dashboard`; one card per catalog product; "Showing N results" with N = catalog size |
| Automate        | Y |

### TC-003-08 — opening the detail URL directly shows the product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7, RF-9, RF-10 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** a logged-in customer **When** the product detail route is opened by URL **Then** the product is shown |
| Expected result | Heading, price and description of the product; no alert is shown |
| Automate        | Y |

### TC-003-09 — reloading the detail page keeps the product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Catalog read through the product API in the same test; one catalog product |
| Steps           | **Given** a detail page **When** the page is reloaded **Then** the same product is shown |
| Expected result | Same detail route; heading, price and description of the product |
| Automate        | Y |

### TC-003-10 — detail URL without a session redirects to the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8 |
| Priority        | P1 |
| Type            | Security |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | No session (no stored token) |
| Test data       | Catalog read through the product API in the same test (read with an API token, outside the browser); one catalog product |
| Steps           | **Given** a guest **When** a product detail route is opened **Then** access is refused |
| Expected result | URL contains `#/auth/login`; no product heading, no "Add to Cart" control |
| Automate        | Y |

### TC-003-11 — detail route with an unknown id shows the Product not found alert
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Well-formed unknown id `000000000000000000000000` |
| Steps           | **Given** a logged-in customer **When** the detail route of an unknown id is opened on a fresh page **Then** the customer is told |
| Expected result | Alert "Product not found" within 30 s |
| Automate        | Y |

### TC-003-12 — detail route with a malformed id shows a readable alert
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27) |
| Test data       | Malformed id `TEST_not_an_id` |
| Steps           | **Given** a logged-in customer **When** the detail route of a malformed id is opened on a fresh page **Then** a readable message is shown |
| Expected result | An alert within 30 s whose text is non-empty and is not "[object Object]". Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it |
| Automate        | Y |

### TC-003-13 — product detail API returns the contract for every catalog product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-11 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @smoke @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Catalog read through the product API in the same test; every catalog `_id` |
| Steps           | **Given** a valid token **When** the product detail API is called for each catalog product **Then** the contract holds |
| Expected result | HTTP 200; message "Product Details fetched Successfully"; `data._id` = requested id; non-empty name, category, sub category, target group and description; numeric price |
| Automate        | Y |

### TC-003-14 — product detail API returns the same data as the catalog
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Catalog read through the product API in the same test; every catalog product |
| Steps           | **Given** the catalog **When** the product detail API is called for each product **Then** both agree |
| Expected result | `productName`, `productPrice`, `productCategory`, `productSubCategory`, `productFor` and `productDescription` equal the catalog values |
| Automate        | Y |

### TC-003-15 — product detail API with an unknown id answers 400 Product not found
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-12 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Well-formed unknown ids: `000000000000000000000000`, and a catalog `_id` with its last 4 hex characters changed so that it matches no catalog product |
| Steps           | **Given** a valid token **When** the product detail API is called with each unknown id **Then** the product is not found |
| Expected result | For each id: HTTP 400; message "Product not found"; no `data` |
| Automate        | Y |

### TC-003-16 — product detail API with malformed ids answers 4xx without internal details
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-14 |
| Priority        | P2 |
| Type            | Security |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Malformed ids: `TEST_not_an_id`; 23 and 25 hex characters (around the 24-character format); the closed injection list of Spec 001 |
| Steps           | **Given** a valid token **When** the product detail API is called with each malformed id **Then** the error is a clean client error |
| Expected result | For each id: HTTP status 400 to 499; `message` is a string that contains neither "CastError" nor "ObjectId". Observed today: the defect in the spec Known issues, so this TC is expected to fail until the shop fixes it |
| Automate        | Y |

### TC-003-17 — product detail API without Authorization answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | None |
| Test data       | Catalog read through the product API in the same test (read with the token); one catalog `_id`; no `Authorization` header on the detail call |
| Steps           | **Given** no token **When** the product detail API is called **Then** access is denied |
| Expected result | HTTP 401; message "Access denied. No token provided."; no `data` |
| Automate        | Y |

### TC-003-18 — product detail API with a tampered token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | One catalog `_id`; token of account A with its last 4 characters replaced |
| Steps           | **Given** a tampered token **When** the product detail API is called **Then** access is denied |
| Expected result | HTTP 401; message "Session Timeout"; no `data` |
| Automate        | Y |

### TC-003-19 — product detail API with a malformed token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-17 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | One catalog `_id`; malformed token value of Spec 001 (`MALFORMED_AUTHORIZATION`) |
| Steps           | **Given** a malformed token **When** the product detail API is called **Then** access is denied |
| Expected result | HTTP 401; message "Session Timeout"; no `data` |
| Automate        | Y |

## Out of scope for testing
- The effect of "Add to Cart", "Share It" links, images and ratings, the browser Back button,
  pagination and admin features (spec Out of scope).
- Known issue that is not a requirement: for an unknown or malformed id, the page stays on an empty
  product with a lone "$" and an "Add to Cart" control. It has no test case.
- Load, performance and penetration testing (docs/test-plan.md §2).

## Notes for the plan
- Reuse Spec 002: the `catalog` fixture, `ProductList` ("View" per card), `DashboardPage`,
  `loggedInTest` with `NO_TRACE`, `ApiResult`, `tamperToken`, `MALFORMED_AUTHORIZATION` and
  `INJECTION_INPUTS`.
- TC-003-12 and TC-003-16 are expected to fail (known defects). Decide how to mark them, as Spec 002
  plan D-5 did for TC-002-31.
- Each detail check starts from a fresh page load or from "View": changing only the URL hash kept
  the previous product on screen (spec edge cases).
- TC-003-01 and TC-003-02 loop over every catalog product (at most 9 in the UI); they need the slow
  budget. TC-003-04 needs two products with the same price; decide what it does when the catalog
  has none (as Spec 002 plan D-6).
- The 23 and 25 hex-character ids of TC-003-16 are derived from a catalog `_id`.
- Smoke additions: TC-003-01 and TC-003-13.

## Open questions
None.
