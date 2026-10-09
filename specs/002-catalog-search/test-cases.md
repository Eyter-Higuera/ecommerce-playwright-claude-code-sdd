# Test Cases — Spec 002 Catalog and search

Source spec: specs/002-catalog-search/spec.md · Ticket: N/A · Status: approved
<!-- Allowed values: draft | approved -->

## Summary
- 34 test cases for 25 RFs. Several TCs cover more than one RF when one scenario
  proves the positive case of one RF and the negative case of another.
- Layers: ui 22, mocked 2, api 10.
- Automated: 34; manual: 0.
- Smoke: 3 TCs (9%), all P1: TC-002-01, TC-002-06, TC-002-25.
- Expected results are computed from the catalog read through the product API in the same test
  (spec clarification 2). No product name, price or count is hard-coded; only the mocked TCs use
  their own `TEST_` products.
- UI tests get their session through the API and type no password. They hold the auth token in the
  browser, so they record no trace (Spec 001 RF-27).
- TC-002-31 is expected to fail today: the shop answers HTTP 500 for `(` (spec Known issues).

## Coverage matrix
| RF | Positive | Negative | Boundary | Security | Total |
|----|----------|----------|----------|----------|-------|
| RF-1 | TC-002-01 | TC-002-04 | TC-002-04 | — | 2 |
| RF-2 | TC-002-01, TC-002-05 | TC-002-04 | TC-002-05 | — | 3 |
| RF-3 | TC-002-02 | TC-002-04 | — | — | 2 |
| RF-4 | TC-002-03, TC-002-06 | TC-002-11 | TC-002-04 | — | 4 |
| RF-5 | TC-002-06, TC-002-26 | TC-002-08 | TC-002-07, TC-002-09 | — | 5 |
| RF-6 | TC-002-10 | TC-002-11 | — | — | 2 |
| RF-7 | TC-002-04, TC-002-08, TC-002-11, TC-002-23 | TC-002-06 | TC-002-04 | — | 5 |
| RF-8 | TC-002-12 | TC-002-06 | — | TC-002-12 | 2 |
| RF-9 | TC-002-13 | TC-002-14 | TC-002-13, TC-002-14, TC-002-27 | — | 3 |
| RF-10 | TC-002-15 | TC-002-13 | TC-002-15, TC-002-27 | — | 3 |
| RF-11 | TC-002-16 | TC-002-13 | TC-002-16, TC-002-27 | — | 3 |
| RF-12 | TC-002-17, TC-002-21, TC-002-28 | TC-002-20 | — | — | 4 |
| RF-13 | TC-002-18, TC-002-28 | TC-002-20 | — | — | 3 |
| RF-14 | TC-002-19, TC-002-21, TC-002-28 | TC-002-20 | — | — | 4 |
| RF-15 | TC-002-21, TC-002-22, TC-002-28 | TC-002-23 | — | — | 4 |
| RF-16 | TC-002-10, TC-002-24 | TC-002-22 | — | — | 3 |
| RF-17 | TC-002-25 | TC-002-32 | — | — | 2 |
| RF-18 | TC-002-26, TC-002-27, TC-002-28 | TC-002-29 | TC-002-27 | — | 4 |
| RF-19 | TC-002-29 | TC-002-25 | — | — | 2 |
| RF-20 | TC-002-30 | TC-002-25 | — | TC-002-30 | 2 |
| RF-21 | TC-002-31 | TC-002-25 | — | TC-002-31 | 2 |
| RF-22 | TC-002-32 | TC-002-25 | — | TC-002-32 | 2 |
| RF-23 | TC-002-33 | TC-002-25 | — | TC-002-33 | 2 |
| RF-24 | TC-002-34 | TC-002-25 | — | TC-002-34 | 2 |
| RF-25 | TC-002-27 | TC-002-25 | TC-002-27 | — | 2 |

## Test cases

### TC-002-01 — dashboard shows one card per catalog product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-2 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test |
| Steps           | **Given** the catalog from the product API **When** the dashboard is opened **Then** the cards match the catalog |
| Expected result | Number of cards equals the catalog size; each catalog product appears once, with its name (compared ignoring letter case) and its price |
| Automate        | Y |

### TC-002-02 — product cards show View and Add To Cart controls
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-3 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test |
| Steps           | **Given** the dashboard with the catalog **When** each card is inspected **Then** it offers both controls |
| Expected result | Every card has a visible "View" button and a visible "Add To Cart" button |
| Automate        | Y |

### TC-002-03 — result counter equals the number of product cards
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test |
| Steps           | **Given** the dashboard with the catalog **When** the list is shown **Then** the counter matches the cards |
| Expected result | "Showing N results" is visible with N equal to the number of cards and to the catalog size |
| Automate        | Y |

### TC-002-04 — empty product API answer shows no card and Showing 0 results
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-3, RF-4, RF-7 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open; product API answer replaced by a mocked response |
| Test data       | Mocked product API answer: HTTP 200, empty `data`, message "No Products Found" |
| Steps           | **Given** a product API that returns no product **When** the dashboard is opened **Then** the empty state is shown |
| Expected result | No product card, no "View" or "Add To Cart" control; "Showing 0 results" visible |
| Automate        | Y |

### TC-002-05 — cards show the name and price of each product in the API answer
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open; product API answer replaced by a mocked response |
| Test data       | Mocked product API answer with two products: `TEST_Catalog_Alpha` (price 101) and `test_catalog_beta` (price 202) |
| Steps           | **Given** a product API that returns two TEST_ products **When** the dashboard is opened **Then** each card pairs its own name and price |
| Expected result | Two cards; the `TEST_Catalog_Alpha` card shows 101 and the `test_catalog_beta` card shows 202 (names compared ignoring letter case); no price is swapped |
| Automate        | Y |

### TC-002-06 — search with the start of a product name shows only matching products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5, RF-4 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; search text = the first word of a catalog product name, as stored |
| Steps           | **Given** the dashboard **When** the search text is submitted **Then** only catalog products whose name starts with it are shown |
| Expected result | Cards equal the catalog products whose name starts with the text (same letter case); counter matches the cards |
| Automate        | Y |

### TC-002-07 — search with a complete product name shows that product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; search text = a complete catalog product name, as stored |
| Steps           | **Given** the dashboard **When** a complete product name is submitted **Then** that product is shown |
| Expected result | The named product is shown, plus only other products whose name starts with the same text |
| Automate        | Y |

### TC-002-08 — search in another letter case or from the middle of a name shows no product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5, RF-7 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; search texts = a catalog name with its letter case changed, and the last word of a multi-word catalog name; each text must not start any catalog name |
| Steps           | **Given** the dashboard **When** each text is submitted **Then** nothing matches |
| Expected result | For each text: no product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-09 — search with surrounding or only spaces shows no product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; search texts = a matching prefix with one leading space, and a single space |
| Steps           | **Given** the dashboard **When** each text is submitted **Then** spaces are not trimmed |
| Expected result | For each text: no product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-10 — clearing the search text shows all products again
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6, RF-16 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; a matching prefix, then an empty search |
| Steps           | **Given** a search that shows a subset **When** an empty search text is submitted **Then** the full list returns |
| Expected result | Cards equal the whole catalog; counter equals the catalog size |
| Automate        | Y |

### TC-002-11 — search without matches shows no card and Showing 0 results
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7, RF-4 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Search text `TEST_no_such_product` |
| Steps           | **Given** the dashboard **When** a text that no product starts with is submitted **Then** the empty state is shown |
| Expected result | No product card; "Showing 0 results"; still on the dashboard route |
| Automate        | Y |

### TC-002-12 — injection-style search opens no dialog and shows no card
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Closed injection list of Spec 001: `' OR '1'='1`, `<script>alert('TEST')</script>`, `"><img src=x onerror=alert('TEST')>` |
| Steps           | **Given** the dashboard **When** each injection-style text is submitted **Then** it is treated as plain text |
| Expected result | For each input: no browser dialog; no product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-13 — price range equal to a catalog price includes its products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; minimum = maximum = the price P of a catalog product |
| Steps           | **Given** the dashboard **When** the range P to P is applied **Then** the bounds are inclusive |
| Expected result | Cards equal the catalog products priced exactly P (at least one) |
| Automate        | Y |

### TC-002-14 — price range just above or below a price excludes its products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; for the lowest catalog price L: range L+1 to L+1, and range L-1 to L-1 |
| Steps           | **Given** the dashboard **When** each range next to L is applied **Then** products priced L are excluded |
| Expected result | For each range: cards equal the catalog products inside it; no product priced L is shown |
| Automate        | Y |

### TC-002-15 — minimum above maximum shows no product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; minimum = highest catalog price, maximum = lowest catalog price - 1 |
| Steps           | **Given** the dashboard **When** a range with minimum above maximum is applied **Then** nothing matches |
| Expected result | No product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-16 — non-numeric or single price bound is ignored
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-11 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; cases: minimum `TEST_abc` with maximum `TEST_xyz`; minimum only (highest catalog price + 1); maximum only (lowest catalog price - 1) |
| Steps           | **Given** the dashboard **When** each invalid range is applied **Then** the price range is ignored |
| Expected result | For each case: cards equal the whole catalog |
| Automate        | Y |

### TC-002-17 — each Categories option alone shows exactly its catalog products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; options fashion, electronics, household |
| Steps           | **Given** the dashboard **When** each option is selected alone **Then** only its products are shown |
| Expected result | For each option: cards equal the catalog products of that category (empty set → "Showing 0 results") |
| Automate        | Y |

### TC-002-18 — each Sub Categories option alone shows exactly its catalog products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; options t-shirts, shirts, shoes, mobiles, laptops |
| Steps           | **Given** the dashboard **When** each option is selected alone **Then** only its products are shown |
| Expected result | For each option: cards equal the catalog products of that sub category (empty set → "Showing 0 results") |
| Automate        | Y |

### TC-002-19 — each Search For option alone shows exactly its catalog products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-14 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; options men, women |
| Steps           | **Given** the dashboard **When** each option is selected alone **Then** only its products are shown |
| Expected result | For each option: cards equal the catalog products for that target group (empty set → "Showing 0 results") |
| Automate        | Y |

### TC-002-20 — a filter option without catalog products shows no card
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12, RF-13, RF-14 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; per group, one option that no catalog product has (observed today: fashion, shirts, men) |
| Steps           | **Given** the dashboard **When** an option without products is selected **Then** nothing is shown |
| Expected result | For each chosen option: no product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-21 — two options of the same group show the products of either option
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12, RF-14, RF-15 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; Categories: an option with products plus one without; Search For: men and women |
| Steps           | **Given** the dashboard **When** two options of one group are selected **Then** they combine with OR |
| Expected result | Cards equal the union of the catalog products of both options |
| Automate        | Y |

### TC-002-22 — search, price and options of several groups show only products matching all
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; target product T: search = first word of its name, range = its price to its price, its category, sub category and target group selected |
| Steps           | **Given** the dashboard **When** all criteria for T are applied **Then** they combine with AND |
| Expected result | Cards equal the catalog products that satisfy every criterion (T included) |
| Automate        | Y |

### TC-002-23 — a combination that no product satisfies shows no card
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15, RF-7 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Decision table |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; search = first word of a catalog name, plus a Categories option that this product does not have |
| Steps           | **Given** the dashboard **When** criteria that each match on their own but not together are applied **Then** nothing matches |
| Expected result | No product card; "Showing 0 results" |
| Automate        | Y |

### TC-002-24 — clearing criteria one at a time restores the matching products
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Account A session established through the API (Spec 001); no trace recorded (Spec 001 RF-27); dashboard route open |
| Test data       | Catalog read through the product API in the same test; the criteria of the AND case: search, price range, one Categories option |
| Steps           | **Given** several active criteria **When** the option, then the price range, then the search text are cleared **Then** each step widens the list |
| Expected result | After each step the cards equal the catalog products matching the remaining criteria; at the end, the whole catalog |
| Automate        | Y |

### TC-002-25 — product API without criteria returns the catalog contract
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-17 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @smoke @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Empty criteria (empty name, null prices, empty option lists) |
| Steps           | **Given** a valid token **When** the product API is called without criteria **Then** the catalog is returned |
| Expected result | HTTP 200; message "All Products fetched Successfully"; non-empty `data`; each product has non-empty `_id`, `productName`, `productCategory`, `productSubCategory`, `productFor` and a numeric `productPrice`; `count` equals the length of `data` |
| Automate        | Y |

### TC-002-26 — product API name search matches the start of the name in the same letter case
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18, RF-5 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Catalog read through the product API in the same test; texts: first word, complete name, changed letter case, last word of a multi-word name, prefix with a leading space |
| Steps           | **Given** a valid token **When** the product API is called with each text **Then** only names that start with it match |
| Expected result | For each text: HTTP 200 and `data` equals the catalog products whose name starts with the text, same letter case (empty for the last three) |
| Automate        | Y |

### TC-002-27 — product API price range uses inclusive bounds and ignores invalid bounds
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18, RF-9, RF-10, RF-11, RF-25 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Catalog read through the product API in the same test; ranges: P to P; P+1 to P+1; P-1 to P-1; highest to lowest-1; minimum only; maximum only; `TEST_abc` to `TEST_xyz` |
| Steps           | **Given** a valid token **When** the product API is called with each range **Then** the range rules hold |
| Expected result | HTTP 200 for each; inclusive bounds; minimum above maximum gives no product; a single bound returns the whole catalog; `TEST_abc` to `TEST_xyz` (both bounds present, not numbers) gives no product and "No Products Found" (RF-25) |
| Automate        | Y |

### TC-002-28 — product API combines filter groups with OR within a group and AND across groups
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18, RF-12, RF-13, RF-14, RF-15 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Catalog read through the product API in the same test; each option alone, two options of one group, and a target product's name prefix with its category, sub category and target group |
| Steps           | **Given** a valid token **When** the product API is called with each combination **Then** the combination rules hold |
| Expected result | For each combination: HTTP 200 and `data` equals the catalog products that satisfy it |
| Automate        | Y |

### TC-002-29 — product API without matches answers No Products Found
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-19 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Name `TEST_no_such_product` |
| Steps           | **Given** a valid token **When** the product API is called with a name that nothing matches **Then** the empty answer is returned |
| Expected result | HTTP 200; empty `data`; message "No Products Found" |
| Automate        | Y |

### TC-002-30 — product API with injection-style names answers below 500 with no product
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-20 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Closed injection list of Spec 001 |
| Steps           | **Given** a valid token **When** the product API is called with each injection-style name **Then** it is treated as plain text |
| Expected result | For each input: HTTP status below 500; empty `data` or no `data` |
| Automate        | Y |

### TC-002-31 — product API with pattern special characters answers below 500
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-21 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Names `(`, `[` and `TEST_*(` |
| Steps           | **Given** a valid token **When** the product API is called with each name **Then** no server error occurs |
| Expected result | For each name: HTTP status below 500. Observed today: `(` answers 500 (spec Known issues), so this TC is expected to fail until the shop fixes it |
| Automate        | Y |

### TC-002-32 — product API without Authorization answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-22 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | None |
| Test data       | Empty criteria; no `Authorization` header |
| Steps           | **Given** no token **When** the product API is called **Then** access is denied |
| Expected result | HTTP 401; message "Access denied. No token provided."; no `data` |
| Automate        | Y |

### TC-002-33 — product API with a tampered token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (`api` project) |
| Preconditions   | Token of account A from an API login |
| Test data       | Token of account A with its last 4 characters replaced |
| Steps           | **Given** a tampered token **When** the product API is called **Then** access is denied |
| Expected result | HTTP 401; message "Session Timeout"; no `data` |
| Automate        | Y |

### TC-002-34 — product API with a malformed token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-24 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (`api` project) |
| Preconditions   | None |
| Test data       | Malformed token value of Spec 001 (`MALFORMED_AUTHORIZATION`) |
| Steps           | **Given** a malformed token **When** the product API is called **Then** access is denied |
| Expected result | HTTP 401; message "Session Timeout"; no `data` |
| Automate        | Y |

## Out of scope for testing
- Product detail ("View"), "Add To Cart", pagination, list order, guest access, product images,
  ratings and descriptions, and admin features (spec Out of scope).
- Known issue that is not a requirement: the product API reads `productName` as a pattern, so
  `.*` returns every product. It has no test case. The HTTP 500 for `(` is covered by
  TC-002-31 because RF-21 requires a status below 500.
- Accessibility of the filter panel: the spec has no accessibility RF for the catalog.
- Load, performance and penetration testing (docs/test-plan.md §2).

## Notes for the plan
- Catalog snapshot: read the catalog through the product API in each test and derive every
  input (prefixes, prices, options) from it. Compare names ignoring letter case, because the UI
  shows them in upper case (observed).
- Derived inputs must be valid for the current catalog (for example, a changed-case text must not
  start any catalog name). Decide what a test does when the catalog cannot provide an input, such
  as TC-002-20 when every option of a group has products, or a multi-word name for TC-002-08.
- TC-002-31 is expected to fail (observed HTTP 500). Decide how to mark it so the pipeline stays
  green, the defect stays visible, and the test reports when the shop fixes it.
- The filter panel is rendered twice (desktop and mobile); only the visible one counts. The
  filter check boxes have no linked labels; TODO: VERIFY a role-based locator.
- Each change of a price bound or option sends a new product API request (observed). Wait for
  the answer of the last request before asserting.
- Sessions come from the Spec 001 API-session fixture; UI tests use `NO_TRACE`.
- Smoke additions: TC-002-01, TC-002-06 and TC-002-25.

## Open questions
None.
