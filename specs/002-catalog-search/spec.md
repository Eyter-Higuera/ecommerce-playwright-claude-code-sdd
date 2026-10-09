# Spec 002 — Catalog and search

Status: implemented
<!-- Allowed values: draft | approved | test-cases-approved | implemented | validated -->
Source: interview

## Context and goal
Customers can only buy what they can find. Every later flow (product detail, cart, checkout)
starts from the catalog. A broken product list, search or filter therefore blocks sales even when
login works. This spec defines the observable catalog behavior of
https://rahulshettyacademy.com/client and its product API:
- listing the products on the dashboard;
- searching by product name;
- filtering by price range, category, sub category and target group ("Search For");
- combining search and filters;
- authorizing the product API.

The demo catalog belongs to a third party and can change at any time. Expected results are
therefore derived from the catalog the product API returns at test time, never from fixed product
names, prices or counts. Results marked "observed" were seen on the live site on 2026-10-09.

## Users / actors
- Registered customer with a session (test account A; sessions come from Spec 001).
- API consumer (calls the product API with or without a token).

## User stories
- US-1: As a registered customer I want to see the available products so that I can choose what to buy.
- US-2: As a registered customer I want to search products by name so that I find a known product quickly.
- US-3: As a registered customer I want to filter products by price, category, sub category and target group so that I only see relevant products.
- US-4: As the shop owner I want the product API to reject calls without a valid session so that only customers with a session use it.

## Requirements summary
Overview of the functional requirements below, grouped by block. It is a navigation aid only; the
EARS requirements are the source of truth.

| Block | Requirements | Content |
|---|---|---|
| Product listing | RF-1 to RF-4 | One card per catalog product; name and price; "View" and "Add To Cart" controls; result counter |
| Search | RF-5 to RF-8 | Name match; empty search shows all; no-results state; injection-style input |
| Filters | RF-9 to RF-16 | Price range; min above max; invalid bounds; category, sub category and "Search For" groups; OR within a group; AND across groups and with search; clearing a filter |
| Product API | RF-17 to RF-21, RF-25 | Unfiltered contract; filtered results; no-results answer; injection-style input; special characters; two price bounds with a non-number |
| API authorization | RF-22 to RF-24 | 401 without token, with a tampered token and with a malformed token |

## Functional requirements (acceptance criteria in EARS)

Shared definitions:
- *Catalog*: the products returned by the product API with no search text and no filters, at test time.
- *Product API*: `POST {API_BASE_URL}/product/get-all-products`, with the criteria `productName`, `minPrice`, `maxPrice`, `productCategory`, `productSubCategory` and `productFor` (observed). The `Authorization` header carries the login token with no `Bearer` prefix (as in Spec 001).
- *Product card*: one product shown in the dashboard list.
- *Result counter*: the text "Showing N results" above the list (observed).
- *Filter groups*: "Categories" (fashion, electronics, household), "Sub Categories" (t-shirts, shirts, shoes, mobiles, laptops) and "Search For" (men, women) (observed).
- *Matching product*: a catalog product that satisfies every active criterion: the search text (RF-5), the price range (RF-9), and, for each filter group with at least one option selected, one of the selected options (RF-12 to RF-14).
- *Injection-style input*: the closed list of Spec 001: `' OR '1'='1`, `<script>alert('TEST')</script>` and `"><img src=x onerror=alert('TEST')>`.

### Product listing
- RF-1: WHEN a logged-in customer opens the dashboard route, THE SYSTEM SHALL show exactly one product card for each catalog product. Source: interview Q1, Q2
- RF-2: THE SYSTEM SHALL show on each product card the product name (letter case may differ; observed: upper case) and the product price of the catalog. Source: interview Q1
- RF-3: THE SYSTEM SHALL show on each product card a "View" control and an "Add To Cart" control. Source: interview Q1 (observed)
- RF-4: WHILE the product list is shown, THE SYSTEM SHALL show the result counter with N equal to the number of product cards. Source: interview Q1 (observed)

### Search
- RF-5: WHEN the customer submits a search text, THE SYSTEM SHALL show only the catalog products whose name starts with the text, with the same letter case and without trimming spaces. Source: interview Q5; clarification 7 (observed: "ZARA" finds "ZARA COAT 3"; "zara", "ORIGINAL" and " ZARA" find nothing)
- RF-6: WHEN the customer submits an empty search text, THE SYSTEM SHALL show every product that matches the active filters. Source: interview Q5 (observed)
- RF-7: IF no catalog product matches the search text and the active filters, THEN THE SYSTEM SHALL show no product card and the result counter "Showing 0 results". Source: interview Q4; clarification 8 (observed)
- RF-8: IF the search text contains injection-style input, THEN THE SYSTEM SHALL open no browser dialog and show no product card. Source: interview Q6 (observed)

### Filters
- RF-9: WHEN the customer applies a price range with a minimum and a maximum, THE SYSTEM SHALL show only the catalog products whose price is greater than or equal to the minimum and less than or equal to the maximum. Source: interview Q1 (observed: bounds are inclusive)
- RF-10: IF the minimum of the price range is greater than the maximum, THEN THE SYSTEM SHALL show the no-results state of RF-7. Source: interview Q4 (observed: no product card)
- RF-11: IF a price bound typed in the filter panel is not a number, or only one bound is given, THEN THE SYSTEM SHALL ignore the price range and show the matching products for the other active criteria. Source: interview Q4; clarifications 9 and 11 (observed)
- RF-12: WHEN the customer selects one or more options of the "Categories" group, THE SYSTEM SHALL show only the catalog products whose category is one of the selected options. Source: interview Q1, Q3 (observed)
- RF-13: WHEN the customer selects one or more options of the "Sub Categories" group, THE SYSTEM SHALL show only the catalog products whose sub category is one of the selected options. Source: interview Q1, Q3
- RF-14: WHEN the customer selects one or more options of the "Search For" group, THE SYSTEM SHALL show only the catalog products whose target group is one of the selected options. Source: interview Q1, Q3 (observed)
- RF-15: WHEN a search text, a price range and options of several filter groups are active together, THE SYSTEM SHALL show only the matching products. Source: interview Q3 (observed: AND across groups, OR within a group)
- RF-16: WHEN the customer clears a search text, a price range or a selected option, THE SYSTEM SHALL show the matching products for the criteria that remain active. Source: interview Q3 (observed)

### Product API
- RF-17: WHEN the product API is called with a valid token and no criteria, THE SYSTEM SHALL answer HTTP 200 with the message "All Products fetched Successfully", a non-empty `data` array whose products each have a non-empty `_id`, `productName`, `productCategory`, `productSubCategory` and `productFor` and a numeric `productPrice`, and a `count` equal to the length of `data`. Source: interview Q1, Q2 (observed)
- RF-18: WHEN the product API is called with a valid token and search or filter criteria, THE SYSTEM SHALL answer HTTP 200 with exactly the matching products, applying the rules of RF-5, RF-9, RF-10 and RF-12 to RF-15, ignoring a single price bound (RF-11), and RF-25. Source: interview Q1, Q3, Q5; clarification 11
- RF-19: IF no catalog product matches the criteria sent to the product API, THEN THE SYSTEM SHALL answer HTTP 200 with an empty `data` array and the message "No Products Found". Source: interview Q4 (observed)
- RF-20: IF the product API is called with injection-style input in `productName`, THEN THE SYSTEM SHALL answer with an HTTP status below 500 and no product. Source: interview Q6 (observed: 200 "No Products Found")
- RF-21: IF the product API is called with a `productName` that contains pattern special characters such as `(`, `[` or `*`, THEN THE SYSTEM SHALL answer with an HTTP status below 500. Source: interview Q6; clarification 10 (observed: `(` answers 500, a known defect; see Known issues)
- RF-25: IF the product API is called with both price bounds present and at least one of them is not a number, THEN THE SYSTEM SHALL answer HTTP 200 with an empty `data` array and the message "No Products Found". Source: clarification 11 (observed: `TEST_abc` to `TEST_xyz`, numeric strings such as `"11500"`, and empty strings)

### API authorization
- RF-22: IF the product API is called without an `Authorization` header, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Access denied. No token provided." and no product. Source: interview Q6 (observed)
- RF-23: IF the product API is called with a tampered token (a valid token whose last 4 characters are replaced), THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout" and no product. Source: interview Q6 (observed)
- RF-24: IF the product API is called with a malformed token, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout" and no product. Source: interview Q6 (observed)

## Non-functional requirements
- Test data: expected results come from the catalog read through the product API in the same test. No product name, price or count is hard-coded. No data is created on the shop, so no cleanup is needed.
- Accounts: test account A only, with an API-established session (Spec 001). No real password is typed in these tests, and no auth token reaches a trace, report or attachment (Spec 001 RF-27).
- Browsers: UI requirements run on chromium, firefox and webkit (regression); the smoke subset runs on chromium and the `api` project.
- Time budgets: the 30 s navigation and API budgets of Spec 000 apply.
- Stability: assertions target stable states (product cards, result counter, HTTP status and body), never transient notifications.
- Language: everything in English.

## Edge cases
- Catalog shape: the observed catalog has 3 products, all in "electronics", "mobiles" and "women", two of them with the same price. Requirements are checked against whatever catalog exists. An option with no products (for example "men") proves the no-results path, and an option that every product has proves "all products".
- Catalog changes during a run (a product added or removed by a third party): a test compares UI and API within seconds, so a change between the two reads can cause a false failure. A re-run is expected to pass.
- Empty catalog: RF-1 and RF-17 fail, because a catalog without products blocks every later flow.
- Two products with the same price: a price range of exactly that price returns both (inclusive bounds).
- Price range with equal minimum and maximum (boundary).
- Search text with only spaces.
- Desktop and mobile layouts render the filter panel twice; only the visible panel counts.

## Known issues (observed, not requirements of this spec)
- The product API matches `productName` as a pattern from the start of the name: `.*` returns every product.
- Possible defect: a `productName` with an unbalanced `(` or `[` makes the product API answer HTTP 500 (observed for `(`, `[` and `TEST_*(` on 2026-10-09, T6). The UI then shows "Showing 0 results" with no error message. RF-21 requires a status below 500, so its test is expected to fail until the shop fixes it.

## Out of scope
- Product detail page ("View"); planned for the product detail spec.
- "Add To Cart" behavior; planned for the cart spec.
- Pagination and the order of the product list (not guaranteed by the shop).
- Guest access to the dashboard (Spec 001 RF-23).
- Product images, ratings and descriptions in the UI.
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
1. Scope: product listing, search by text, filters and the product API (interview Q1).
2. Expected results come from the current catalog via the API, never from fixed products (interview Q2).
3. Search and filters combine with AND across groups and OR within a group (interview Q3; observed).
4. No matches: an empty list with a no-results state (interview Q4; refined by clarifications 8 and 9).
5. An empty search shows everything (interview Q5; the matching rule is refined by clarification 7).
6. Security: the product API requires a valid token; injection-style search input opens no dialog and causes no server error. Pagination and sort order are out of scope (interview Q6).
7. Search matching (2026-10-09, approved by the user): the observed rule is adopted. The name must start with the text, letter case must match and spaces are not trimmed (RF-5).
8. No-results state in the UI (2026-10-09, approved by the user): no product card and "Showing 0 results". Only the API sends "No Products Found" (RF-7, RF-19).
9. Invalid price bounds (2026-10-09, approved by the user): a non-numeric bound or a single bound is ignored. A minimum above the maximum still gives no results (RF-10, RF-11).
10. Pattern special characters (2026-10-09, approved by the user): RF-21 stays a requirement. The observed HTTP 500 for `(` is recorded as a possible defect under Known issues.
11. Non-numeric price bounds in the API (2026-10-09, found in T4, Mode C approved by the user): the UI sends a non-numeric bound as no bound, so RF-11 holds there. The API ignores a single bound, but with both bounds present any non-number matches nothing. The observed API behavior is adopted as RF-25, and RF-11 now names the filter panel.
