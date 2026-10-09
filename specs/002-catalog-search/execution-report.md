# Execution Report — Spec 002 Catalog and search

Spec: specs/002-catalog-search/spec.md · Tasks: specs/002-catalog-search/tasks.md ·
Log: specs/002-catalog-search/implementation.md

This report is updated each time a task is completed. A task row reflects the task's
`Done when:` command; a file row reflects the tests that exercise that file.

Legend: ✅ = passed · ❌ = failed

## Summary
| Tasks completed | Passed | Failed |
|-----------------|--------|--------|
| 15 / 15 | ✅ 15 | ❌ 0 |

## Results
| Task / File | Purpose | Passed | Failed |
|-------------|---------|:------:|:------:|
| **T1 — Add the product API client, schemas and catalog fixture, with the contract test** | Done when: TC-002-25 passes (1 test); Spec 001 API tests still pass (14 tests) | ✅ | |
| tests/api/product-api.spec.ts | TC-002-25: no criteria → 200, "All Products fetched Successfully", non-empty products with the required fields, count = length | ✅ | |
| src/api/product-client.ts, src/api/api-result.ts | Product API client (raw result); optional `headers` on `post` | ✅ | |
| src/api/schemas/product.schema.ts, src/api/product-messages.ts | RF-17 and RF-19 contracts and messages | ✅ | |
| src/fixtures/test.ts, src/data/catalog-oracle.ts | `productClient`, `catalog` snapshot; `ProductCriteria`, `EMPTY_CRITERIA` | ✅ | |
| **T2 — Test the product API authorization** | Done when: TC-002-32 to TC-002-34 pass (3 tests) | ✅ |  |
| tests/api/product-authorization.spec.ts | TC-002-32: no header → 401 "Access denied. No token provided." · TC-002-33: tampered token → 401 "Session Timeout" · TC-002-34: non-token value → 401 "Session Timeout"; never a product list | ✅ |  |
| **T3 — Add the name rule of the oracle and test the API name search** | Done when: TC-002-26 and TC-002-29 pass (2 tests) | ✅ |  |
| tests/api/product-api.spec.ts | TC-002-26: first word and complete name find exactly the oracle's products; changed case, last word and leading space find none · TC-002-29: `TEST_no_such_product` → 200, empty data, "No Products Found" | ✅ |  |
| src/data/catalog-oracle.ts | `matchingProducts` (RF-5 name rule), `productNames` (case-insensitive sorted comparison) | ✅ |  |
| src/data/catalog-data.ts, src/fixtures/catalog-gaps.ts | Derived name inputs; `keepAvailableCases` (plan D-6 catalog gaps) | ✅ |  |
| **T4 — Add the price rules of the oracle and test the API price range** | Done when: TC-002-27 passes (1 test). First run failed on non-numeric bounds; resolved by Mode C (RF-25, clarification 11) | ✅ | |
| tests/api/product-api.spec.ts | TC-002-27: 7 ranges around L and H match the oracle with the right message: L to L inclusive, L±1, minimum above maximum → none, single bound → whole catalog, `TEST_abc`/`TEST_xyz` → "No Products Found" (RF-25) | ✅ | |
| src/data/catalog-oracle.ts, src/data/catalog-data.ts, src/api/product-messages.ts | Price rule on the API body; `resultSize`; `NON_NUMERIC_BOUNDS`, `lowestPrice`, `highestPrice`; `productListMessage` | ✅ | |
| **T5 — Add the option rules of the oracle and test the API filter combinations** | Done when: TC-002-28 passes (1 test) | ✅ |  |
| tests/api/product-api.spec.ts | TC-002-28: 13 combinations (each option alone, two options of a group, AND of one product's criteria) equal the oracle's products with the right message | ✅ |  |
| src/data/catalog-oracle.ts, src/data/catalog-data.ts | OR within an option list, AND across criteria; `FILTER_OPTIONS`, option builders, `targetCriteria` | ✅ |  |
| **T6 — Test injection-style names and pattern special characters in the API** | Done when: TC-002-30 passes and TC-002-31 is an expected failure (exit code 0) | ✅ |  |
| tests/api/product-api.spec.ts | TC-002-30: 3 injection-style names → status below 500, no product · TC-002-31: `(`, `[`, `TEST_*(` → HTTP 500 (known defect, expected failure per plan D-5) | ✅ |  |
| src/data/catalog-data.ts | `PATTERN_SPECIAL_NAMES` | ✅ |  |
| **T7 — Add the product list component and test the dashboard listing** | Done when: TC-002-01 to TC-002-03 pass (3 tests) | ✅ |  |
| tests/ui/catalog-listing.spec.ts | TC-002-01: one card per catalog product with its name and price · TC-002-02: every card has View and Add To Cart · TC-002-03: "Showing N results" equals cards and catalog size | ✅ |  |
| src/components/product-list.ts, src/pages/catalog.constants.ts, src/pages/dashboard-page.ts | `ProductList` (cards, counter, controls, entries); `CATALOG` texts; `dashboardPage.products` | ✅ |  |
| src/data/catalog-oracle.ts | `cardEntries` (expected cards) | ✅ |  |
| **T8 — Test the listing against mocked product API answers** | Done when: TC-002-04 and TC-002-05 pass (2 tests) | ✅ |  |
| tests/mocked/catalog-mocked-answer.spec.ts | TC-002-04: empty answer → no card, no card control, "Showing 0 results" · TC-002-05: two TEST_ products → two cards, each with its own name and price | ✅ |  |
| src/data/catalog-data.ts, src/components/product-list.ts | `testProduct`, `productListAnswer`; page-wide card controls | ✅ |  |
| **T9 — Add the filter panel search and test the positive search flow** | Done when: TC-002-06, 07, 10 and 11 pass (4 tests) | ✅ |  |
| tests/ui/catalog-search.spec.ts | TC-002-06: first word → only names starting with it · TC-002-07: complete name → that product · TC-002-10: empty search → whole catalog again · TC-002-11: `TEST_no_such_product` → no card, "Showing 0 results" | ✅ |  |
| src/components/filter-panel.ts, src/pages/dashboard-page.ts, src/pages/catalog.constants.ts | `FilterPanel` (visible panel, search, plan D-4 wait), `openCatalog()`, panel texts | ✅ |  |
| **T10 — Test searches in another letter case, from the middle of a name, or with spaces** | Done when: TC-002-08 and TC-002-09 pass (2 tests) | ✅ |  |
| tests/ui/catalog-search.spec.ts | TC-002-08: changed letter case and last word → no card, "Showing 0 results" · TC-002-09: leading space and a single space → no card, "Showing 0 results" | ✅ |  |
| src/data/catalog-data.ts | `ONLY_SPACES` | ✅ |  |
| **T11 — Extract the dialog recorder and test injection-style search** | Done when: TC-002-12 passes (1 test); TC-001-11 still passes | ✅ |  |
| tests/ui/catalog-search.spec.ts | TC-002-12: 3 injection-style searches → no dialog, no card, "Showing 0 results" | ✅ |  |
| src/components/dialog-recorder.ts, src/pages/login-page.ts, src/pages/dashboard-page.ts | `DialogRecorder` shared by `LoginPage.recordDialogs` (TC-001-10/11 re-run) and `DashboardPage.recordDialogs` | ✅ |  |
| **T12 — Add the price range to the filter panel and test the price filters** | Done when: TC-002-13 to TC-002-16 pass (4 tests) | ✅ |  |
| tests/ui/catalog-filters.spec.ts | TC-002-13: L to L lists the products priced L · TC-002-14: L+1 and L-1 ranges exclude them · TC-002-15: minimum above maximum → "Showing 0 results" · TC-002-16: minimum only, maximum only and non-numeric bounds → whole catalog | ✅ |  |
| src/components/filter-panel.ts | `setPriceRange` (Enter commits the maximum), `clearPriceRange`, non-numeric typed bound sent as `null` | ✅ |  |
| **T13 — Add the option groups to the filter panel and test each option** | Done when: TC-002-17 to TC-002-20 pass (4 tests) | ✅ |  |
| tests/ui/catalog-filters.spec.ts | TC-002-17/18/19: each Categories, Sub Categories and Search For option alone lists exactly its catalog products (or "Showing 0 results") · TC-002-20: fashion, shirts, men → no card | ✅ |  |
| src/components/filter-panel.ts | `optionCheckbox`, `toggleOption` | ✅ |  |
| **T14 — Test combined criteria and clearing them** | Done when: TC-002-21 to TC-002-24 pass (4 tests) | ✅ |  |
| tests/ui/catalog-filters.spec.ts | TC-002-21: two options of a group → union (OR) · TC-002-22: search + price + 3 options of one product → AND, product included · TC-002-23: search "ADIDAS" + price 55000 → no card · TC-002-24: clearing option, price, search widens the list back to the whole catalog | ✅ |  |
| src/data/catalog-data.ts, src/components/filter-panel.ts, src/fixtures/catalog-gaps.ts | `conflictingCriterion`, `addCriterion`, `requireCatalogInput` | ✅ |  |
| **T15 — Run the suite on all browsers, scan the artifacts and update the traceability matrix** | Done when: TC-002 green on api, chromium, firefox and webkit (TC-002-31 expected failure only); check:secrets after each run; test:unit; spec:check --write with no Spec 002 warning | ✅ |  |
| TC-002 on api + chromium | 34 passed (TC-002-31 expected failure) · 0 flaky | ✅ |  |
| TC-002 on firefox | 24 passed · 0 flaky (first run: TC-002-14 and TC-002-23 failed on an out-of-order answer; fixed in `FilterPanel.setPriceRange`) | ✅ |  |
| TC-002 on webkit | 24 passed · 0 flaky | ✅ |  |
| Full suite on api + chromium (Specs 000 to 002) | 74 passed | ✅ |  |
| npm run check:secrets | Passed after each of the 4 runs | ✅ |  |
| npm run test:unit | 26 files, 100 passed | ✅ |  |
| docs/traceability.md | Regenerated: 314 rows; 56 Spec 002 rows, all automated; spec:check 0 warnings | ✅ |  |
