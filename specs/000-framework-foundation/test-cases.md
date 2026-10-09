# Test Cases — Spec 000 Framework foundation

Source spec: specs/000-framework-foundation/spec.md · Ticket: N/A · Status: approved
<!-- Allowed values: draft | approved -->

## Summary
- 132 test cases for 89 RFs (TC-000-111, 112, 113 and 117 removed by clarification 14). Several TCs cover more than one RF when one scenario proves
  the positive case of one RF and the negative case of another (decision tables and partitions).
- Layers: unit 115, api 1, mocked 2, ui 1, integration 13.
- Automated: 119; manual: 13.
- Smoke: 2 TCs (2%), both P1.
- "unit" TCs run in Vitest with no real network: they inspect config, run CLIs (tsc, ESLint,
  Playwright `--list`, spec:check, check:secrets) on local fixtures, or test helpers with stubs.
- "integration" TCs with `Automate: N` are pipeline-level or need the shared site to fail on
  purpose; they are executed and recorded during validation.

## Coverage matrix
| RF | Positive | Negative | Boundary | Security | Total |
|----|----------|----------|----------|----------|-------|
| RF-1 | TC-000-01 | TC-000-02 | — | — | 2 |
| RF-2 | TC-000-04 | TC-000-05 | — | — | 2 |
| RF-3 | TC-000-03 | TC-000-02 | — | — | 2 |
| RF-4 | TC-000-06 | TC-000-07 | — | — | 2 |
| RF-5 | TC-000-08 | TC-000-09 | — | — | 2 |
| RF-6 | TC-000-10 | TC-000-11 | TC-000-11 | — | 2 |
| RF-7 | TC-000-12 | TC-000-13 | — | — | 2 |
| RF-8 | TC-000-14 | TC-000-15 | — | — | 2 |
| RF-9 | TC-000-16 | TC-000-17 | — | — | 2 |
| RF-10 | TC-000-17 | TC-000-18 | — | — | 2 |
| RF-11 | TC-000-19 | TC-000-14 | — | — | 2 |
| RF-12 | TC-000-20 | TC-000-21 | — | — | 2 |
| RF-13 | TC-000-22 | TC-000-28 | — | — | 2 |
| RF-14 | TC-000-23 | TC-000-12 | — | — | 2 |
| RF-15 | TC-000-24 | TC-000-25 | TC-000-25 | — | 2 |
| RF-16 | TC-000-26 | TC-000-27 | TC-000-27 | — | 2 |
| RF-17 | TC-000-22 | TC-000-28 | TC-000-28 | — | 2 |
| RF-18 | TC-000-29 | TC-000-30 | — | TC-000-29, TC-000-30 | 2 |
| RF-19 | TC-000-31 | TC-000-32 | TC-000-32 | — | 2 |
| RF-20 | TC-000-33 | TC-000-34 | — | TC-000-33 | 2 |
| RF-21 | TC-000-35 | TC-000-36 | — | TC-000-35 | 2 |
| RF-22 | TC-000-37 | TC-000-36 | — | TC-000-36, TC-000-37 | 2 |
| RF-23 | TC-000-38 | TC-000-39 | TC-000-39 | — | 2 |
| RF-24 | TC-000-38 | TC-000-39 | — | TC-000-39 | 2 |
| RF-25 | TC-000-40 | TC-000-41 | — | — | 2 |
| RF-26 | TC-000-37 | TC-000-36 | — | — | 2 |
| RF-27 | TC-000-42 | TC-000-43 | — | — | 2 |
| RF-28 | TC-000-44 | TC-000-45 | TC-000-45 | — | 2 |
| RF-29 | TC-000-46 | TC-000-47 | — | — | 2 |
| RF-30 | TC-000-48 | TC-000-49 | — | — | 2 |
| RF-31 | TC-000-50 | TC-000-51 | TC-000-51, TC-000-97 | — | 3 |
| RF-32 | TC-000-50 | TC-000-52 | — | — | 2 |
| RF-33 | TC-000-50 | TC-000-53 | TC-000-54 | — | 3 |
| RF-34 | TC-000-50 | TC-000-55 | — | — | 2 |
| RF-35 | TC-000-50 | TC-000-56 | — | — | 2 |
| RF-36 | TC-000-50 | TC-000-57 | — | — | 2 |
| RF-37 | TC-000-54 | TC-000-58 | — | — | 2 |
| RF-38 | TC-000-61 | TC-000-62 | TC-000-61 | — | 2 |
| RF-39 | TC-000-50 | TC-000-63 | TC-000-64 | — | 3 |
| RF-40 | TC-000-50 | TC-000-51 | — | — | 2 |
| RF-41 | TC-000-65 | TC-000-50 | — | — | 2 |
| RF-42 | TC-000-58 | TC-000-59 | TC-000-58 | — | 2 |
| RF-43 | TC-000-58 | TC-000-60 | — | — | 2 |
| RF-44 | TC-000-66 | TC-000-67 | — | — | 2 |
| RF-45 | TC-000-67 | TC-000-68 | TC-000-67 | — | 2 |
| RF-46 | TC-000-69 | TC-000-70 | — | — | 2 |
| RF-47 | TC-000-71 | TC-000-72 | — | — | 2 |
| RF-48 | TC-000-72 | TC-000-71 | TC-000-72 | — | 2 |
| RF-49 | TC-000-40 | TC-000-41 | TC-000-41 | — | 2 |
| RF-50 | TC-000-73 | TC-000-74 | — | — | 2 |
| RF-51 | TC-000-75 | TC-000-74 | — | — | 2 |
| RF-52 | TC-000-76 | TC-000-78 | TC-000-77 | — | 3 |
| RF-53 | TC-000-76 | TC-000-78 | TC-000-79 | — | 3 |
| RF-54 | TC-000-80 | TC-000-81 | — | — | 2 |
| RF-55 | TC-000-80 | TC-000-81 | — | TC-000-81 | 2 |
| RF-56 | TC-000-80 | TC-000-82 | TC-000-83 | — | 3 |
| RF-57 | TC-000-80 | TC-000-84 | TC-000-85 | — | 3 |
| RF-58 | TC-000-86, TC-000-88 | TC-000-87 | — | — | 3 |
| RF-59 | TC-000-88 | TC-000-89 | — | — | 2 |
| RF-60 | TC-000-90 | TC-000-91 | — | — | 2 |
| RF-61 | TC-000-90 | TC-000-91 | — | — | 2 |
| RF-62 | TC-000-90 | TC-000-91 | TC-000-91 | — | 2 |
| RF-63 | TC-000-90 | TC-000-92 | — | — | 2 |
| RF-64 | TC-000-93 | TC-000-94, TC-000-116 | — | TC-000-93, TC-000-94, TC-000-116 | 3 |
| RF-65 | TC-000-86 | TC-000-95 | — | TC-000-95 | 2 |
| RF-66 | TC-000-86 | TC-000-89 | — | — | 2 |
| RF-67 | TC-000-86 | TC-000-89 | — | — | 2 |
| RF-68 | TC-000-96 | TC-000-53 | TC-000-96 | — | 2 |
| RF-69 | TC-000-98, TC-000-109 | TC-000-87, TC-000-110 | — | — | 4 |
| RF-70 | TC-000-99, TC-000-109 | TC-000-87, TC-000-110 | — | — | 4 |
| RF-71 | TC-000-100, TC-000-109 | TC-000-87, TC-000-101 | — | — | 4 |
| RF-72 | TC-000-103, TC-000-104, TC-000-109 | TC-000-101, TC-000-102 | — | — | 5 |
| RF-73 | TC-000-101 | TC-000-102, TC-000-110 | — | TC-000-101 | 3 |
| RF-74 | TC-000-103 | TC-000-106, TC-000-107 | TC-000-107 | — | 3 |
| RF-75 | TC-000-105 | TC-000-103 | TC-000-105 | — | 2 |
| RF-76 | TC-000-103, TC-000-109 | TC-000-101 | — | TC-000-101 | 3 |
| RF-77 | TC-000-103, TC-000-109 | TC-000-108 | — | TC-000-108 | 3 |
| RF-78 | TC-000-86, TC-000-118 | TC-000-87 | — | — | 3 |
| RF-79 | TC-000-114, TC-000-118 | TC-000-116 | — | TC-000-114 | 3 |
| RF-80 | TC-000-115 | TC-000-87 | — | — | 2 |
| RF-81 | TC-000-116 | TC-000-101 | — | TC-000-116 | 2 |
| RF-82 | TC-000-04, TC-000-86 | TC-000-05 | — | — | 3 |
| RF-83 | TC-000-119 | TC-000-110, TC-000-87 | — | — | 3 |
| RF-84 | TC-000-120, TC-000-121, TC-000-127 | TC-000-125 | TC-000-122, TC-000-135 | — | 6 |
| RF-85 | TC-000-123, TC-000-124, TC-000-127 | TC-000-123 | — | — | 3 |
| RF-86 | TC-000-126, TC-000-127 | — | TC-000-126 | — | 2 |
| RF-87 | — | TC-000-125 | — | — | 1 |
| RF-88 | TC-000-128, TC-000-133 | TC-000-130, TC-000-134 | TC-000-129 | TC-000-130, TC-000-131, TC-000-136 | 7 |
| RF-89 | TC-000-132, TC-000-133 | — | — | — | 2 |

## Test cases

### TC-000-01 — npm ci installs dependencies and three browsers in one command
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | Clean checkout; Node 20 or later; no `node_modules/`; empty Playwright browser cache |
| Test data       | None |
| Steps           | **Given** a clean checkout on Node 20 or later **When** the engineer runs `npm ci` **Then** dependencies and the chromium, firefox and webkit binaries are installed |
| Expected result | Exit code 0; `npx playwright --version` prints the installed version; chromium, firefox and webkit launch without any further install command |
| Automate        | N — needs a clean machine and a full browser download; verified manually at validation and after each Node or Playwright upgrade |

### TC-000-02 — npm ci on Node 18 fails naming the required Node version
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-3 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | Node 18.x active locally |
| Test data       | Node 18.x (below the lower bound 20) |
| Steps           | **Given** Node 18 is the active runtime **When** the engineer runs `npm ci` **Then** installation stops |
| Expected result | Non-zero exit code; message names the required Node version `>=20`; no browsers downloaded |
| Automate        | N — requires switching the local Node major version; verified manually once at validation |

### TC-000-03 — package manifest enforces Node 20 or later
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-3 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `package.json`, `.npmrc` |
| Steps           | **Given** the repository manifests **When** the unit test reads the Node engine constraint and the engine-strict setting **Then** Node 20 is the enforced lower bound |
| Expected result | `engines.node` equals `>=20` and engine-strict is enabled |
| Automate        | Y |

### TC-000-04 — CI Playwright image version equals installed @playwright/test version
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out with lockfile |
| Test data       | `.github/workflows/ci.yml`, `package-lock.json` |
| Steps           | **Given** the CI definition and the lockfile **When** the unit test compares the image tag version with the locked @playwright/test version **Then** both versions are equal |
| Expected result | Image tag version string equals the locked @playwright/test version |
| Automate        | Y |

### TC-000-05 — CI image version check reports a mismatch naming both versions
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Image tag `v1.40.0-jammy`, installed version `1.48.0` (synthetic) |
| Steps           | **Given** an image tag and an installed version that differ **When** the version check runs **Then** it reports a mismatch |
| Expected result | Check fails with a message containing `1.40.0` and `1.48.0` |
| Automate        | Y |

### TC-000-06 — typecheck passes on the repository code
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Dependencies installed |
| Test data       | Repository sources |
| Steps           | **Given** the repository sources **When** `npm run typecheck` runs **Then** no type error is reported |
| Expected result | Exit code 0 |
| Automate        | Y |

### TC-000-07 — typecheck fails on a strict-mode type error
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Dependencies installed |
| Test data       | Fixture `typecheck/invalid` with `const n: number = "TEST_text"` and an implicit `any` parameter |
| Steps           | **Given** the invalid fixture **When** the type checker runs on it in strict mode **Then** both errors are reported |
| Expected result | Non-zero exit code; output lists the fixture file and line of each error |
| Automate        | Y |

### TC-000-08 — test:unit exits 0 when all unit tests pass
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Dependencies installed |
| Test data       | Fixture `vitest/passing` with one passing `*.test.ts` |
| Steps           | **Given** the passing fixture project **When** Vitest runs on it **Then** the run succeeds |
| Expected result | Exit code 0; 1 test passed |
| Automate        | Y |

### TC-000-09 — test:unit exits non-zero when a unit test fails
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-5 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Dependencies installed |
| Test data       | Fixture `vitest/failing` with one failing `*.test.ts` |
| Steps           | **Given** the failing fixture project **When** Vitest runs on it **Then** the run fails |
| Expected result | Non-zero exit code; output names the failing test |
| Automate        | Y |

### TC-000-10 — unit test with a mocked HTTP dependency makes no network request
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Network guard active |
| Test data       | Stubbed HTTP client returning `{ token: "TEST_token" }` |
| Steps           | **Given** a unit under test whose HTTP client is mocked **When** the unit test runs **Then** it passes without network access |
| Expected result | Test passes; no "Network access is disabled" error |
| Automate        | Y |

### TC-000-11 — unit test sending a real request fails, localhost included
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Network guard active |
| Test data       | `http://localhost:9/TEST_path` (boundary: local host) and `https://example.com/TEST_path` |
| Steps           | **Given** a unit test that calls each URL **When** the request is sent **Then** the test fails |
| Expected result | Each call fails with "Network access is disabled in unit tests: <url>" showing that URL |
| Automate        | Y |

### TC-000-12 — unit suite runs with no environment variables and no .env file
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7, RF-14 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | No `.env` in the working directory of the spawned run |
| Test data       | Empty environment (RF-13 variables unset) |
| Steps           | **Given** an empty environment and no `.env` **When** the unit suite is spawned **Then** loading configuration raises no error |
| Expected result | Exit code 0; no "Missing required environment variable" message |
| Automate        | Y |

### TC-000-13 — reading a credential in a unit context raises the missing-variable error
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-7 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Empty environment |
| Test data       | TEST_USER_EMAIL unset |
| Steps           | **Given** an empty environment **When** the configuration accessor is asked for TEST_USER_EMAIL **Then** no silent default is returned |
| Expected result | Error "Missing required environment variable: TEST_USER_EMAIL" |
| Automate        | Y |

### TC-000-14 — each browser project lists the UI tests and no API test
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8, RF-11 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid BASE_URL and API_BASE_URL placeholders |
| Test data       | `--list --project=<browser>` for chromium, firefox, webkit |
| Steps           | **Given** each browser project **When** Playwright lists tests for it **Then** only UI tests appear |
| Expected result | The UI sanity test is listed under that project; no `@api` test is listed |
| Automate        | Y |

### TC-000-15 — an unknown browser project is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list --project=TEST_opera` |
| Steps           | **Given** a project name that does not exist **When** Playwright lists tests for it **Then** the run is rejected |
| Expected result | Non-zero exit code; message names `TEST_opera` as an unknown project |
| Automate        | Y |

### TC-000-16 — msedge project runs only when explicitly requested
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list --project=msedge` |
| Steps           | **Given** the msedge project requested explicitly **When** Playwright lists tests **Then** the UI tests appear under msedge |
| Expected result | UI sanity test listed under `msedge` |
| Automate        | Y |

### TC-000-17 — a run without --project includes api and three browsers but not msedge
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9, RF-10 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list` with no `--project` |
| Steps           | **Given** no project selected **When** Playwright lists tests **Then** the default projects are used |
| Expected result | Projects listed: `api`, `chromium`, `firefox`, `webkit`; `msedge` absent |
| Automate        | Y |

### TC-000-18 — selecting one project does not run the other default projects
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list --project=webkit` |
| Steps           | **Given** only webkit selected **When** Playwright lists tests **Then** only webkit appears |
| Expected result | No test listed under `api`, `chromium` or `firefox` |
| Automate        | Y |

### TC-000-19 — API tests run once, in the api project only
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-11 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list` with no `--project` |
| Steps           | **Given** a default run **When** Playwright lists tests **Then** the API sanity test appears once |
| Expected result | The `@api` sanity test is listed exactly once, under `api` |
| Automate        | Y |

### TC-000-20 — --grep @smoke selects only smoke tests
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list --grep @smoke` |
| Steps           | **Given** smoke and non-smoke (`@mocked`) tests exist **When** Playwright lists with `--grep @smoke` **Then** only smoke tests appear |
| Expected result | Every listed test is tagged `@smoke`; the UI and API sanity tests are listed; mocked tests are excluded |
| Automate        | Y |

### TC-000-21 — --grep with an unused tag finds no tests
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | `--list --grep @TEST_none` |
| Steps           | **Given** a tag no test uses **When** Playwright lists with that grep **Then** nothing is selected |
| Expected result | Non-zero exit code; "No tests found" |
| Automate        | Y |

### TC-000-22 — configuration accessor returns all six variables
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-17 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Injected env: BASE_URL=`https://TEST_host/client`, API_BASE_URL=`https://TEST_host/api`, TEST_USER_EMAIL=`TEST_a@example.test`, TEST_USER_PASSWORD=`TEST_pass_a`, TEST_USER_2_EMAIL=`TEST_b@example.test`, TEST_USER_2_PASSWORD=`TEST_pass_b` |
| Steps           | **Given** the injected environment **When** each variable is read through the accessor **Then** each value is returned |
| Expected result | Six values returned exactly as injected |
| Automate        | Y |

### TC-000-23 — .env file values are loaded when present
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-14 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Empty process environment |
| Test data       | Fixture `env/dotenv` with TEST_ placeholder values for the six variables |
| Steps           | **Given** a `.env` fixture and an empty environment **When** configuration is loaded from the fixture **Then** values come from the file |
| Expected result | Accessor returns the fixture values |
| Automate        | Y |

### TC-000-24 — process environment takes precedence over .env
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Process env TEST_USER_EMAIL=`TEST_env@example.test`; `.env` TEST_USER_EMAIL=`TEST_file@example.test` |
| Steps           | **Given** the variable set in both sources **When** it is read **Then** the process value wins |
| Expected result | Returns `TEST_env@example.test` |
| Automate        | Y |

### TC-000-25 — empty process value overrides a .env value and is reported missing
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | Decision table / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Process env TEST_USER_EMAIL=`""`; `.env` TEST_USER_EMAIL=`TEST_file@example.test` |
| Steps           | **Given** an empty process value and a filled `.env` value **When** the variable is read **Then** the `.env` value is not used |
| Expected result | Error "Missing required environment variable: TEST_USER_EMAIL" |
| Automate        | Y |

### TC-000-26 — valid base URLs let the Playwright run start
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | BASE_URL=`https://TEST_host/client`, API_BASE_URL=`http://TEST_host/api` |
| Steps           | **Given** absolute http/https URLs **When** `playwright test --list` runs **Then** the run starts |
| Expected result | Exit code 0; tests listed |
| Automate        | Y |

### TC-000-27 — missing or malformed base URL stops the run before any test
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | For BASE_URL and API_BASE_URL each: unset, `""`, `"   "`, `TEST_host/client` (no scheme), `ftp://TEST_host` |
| Steps           | **Given** each invalid value **When** `playwright test --list` runs **Then** the run stops before any test |
| Expected result | Non-zero exit code; message names the invalid variable; no test listed or executed |
| Automate        | Y |

### TC-000-28 — missing credential fails only the test that reads it
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-17 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | TEST_USER_EMAIL unset, `""` and `"   "`; fixture `env/two-tests` (one test reads it, one does not) |
| Steps           | **Given** each missing-value partition **When** the fixture run executes **Then** only the reading test fails |
| Expected result | Reading test fails with "Missing required environment variable: TEST_USER_EMAIL"; the other test passes |
| Automate        | Y |

### TC-000-29 — .env.example lists the six variables with placeholders only
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.env.example` |
| Steps           | **Given** the committed `.env.example` **When** the unit test parses it **Then** it contains only placeholders |
| Expected result | Exactly the six RF-13 variables; each value is empty, a `<...>` placeholder or the public site URL |
| Automate        | Y |

### TC-000-30 — .env is ignored by git while .env.example is tracked
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | Paths `.env`, `.env.example` |
| Steps           | **Given** the git ignore rules **When** git checks both paths **Then** only `.env` is ignored |
| Expected result | `.env` ignored; `.env.example` not ignored |
| Automate        | Y |

### TC-000-31 — .env.example in sync with RF-13 passes
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-19 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | Repository `.env.example` |
| Steps           | **Given** the real `.env.example` **When** the sync check runs **Then** no drift is found |
| Expected result | Check passes |
| Automate        | Y |

### TC-000-32 — .env.example drift fails naming the variable
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-19 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture missing TEST_USER_2_PASSWORD; fixture with extra TEST_EXTRA |
| Steps           | **Given** each drifted fixture **When** the sync check runs **Then** it fails |
| Expected result | Fails naming `TEST_USER_2_PASSWORD` (missing) and `TEST_EXTRA` (unexpected) |
| Automate        | Y |

### TC-000-33 — passwords and auth token are redacted as sensitive values
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-20 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | TEST_USER_PASSWORD=`TEST_pass_a`, TEST_USER_2_PASSWORD=`TEST_pass_b`, token `TEST_token_123` |
| Steps           | **Given** a text containing the three values **When** the redaction helper processes it **Then** none of them remains |
| Expected result | All three values replaced by `[REDACTED]` |
| Automate        | Y |

### TC-000-34 — emails are not classified as sensitive values
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-20 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | TEST_USER_EMAIL=`TEST_a@example.test` |
| Steps           | **Given** a text containing the email **When** the redaction helper processes it **Then** the email is not treated as a secret |
| Expected result | Sensitive set has exactly 3 entries (2 passwords + token); email left unchanged |
| Automate        | Y |

### TC-000-35 — framework failure messages never contain email values
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-21 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Emails `TEST_a@example.test`, `TEST_b@example.test`; messages of RF-17, RF-55, RF-56, RF-57 |
| Steps           | **Given** every framework failure message builder **When** each builds its message with the emails set **Then** no email is printed |
| Expected result | No message contains either email; messages name variables instead |
| Automate        | Y |

### TC-000-36 — failing smoke run leaks no email or password to console or artifacts
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-21, RF-22, RF-26 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | Local `.env` with account A; TEST_USER_PASSWORD temporarily set to `TEST_wrong_pass` |
| Test data       | `TEST_wrong_pass` |
| Steps           | **Given** an invalid password **When** the smoke suite runs and then `npm run check:secrets` runs **Then** the failure is reported without values |
| Expected result | Console shows the status code and `TEST_USER_EMAIL` but no email or password value; `check:secrets` exits 0 |
| Automate        | N — needs an intentionally failing run against the shared site; executed manually at validation |

### TC-000-37 — smoke artifacts pass the secrets scan in every pipeline
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-22, RF-26 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | eyter_dev pipeline with credentials configured |
| Test data       | Account A from GitHub secrets |
| Steps           | **Given** the smoke jobs have finished **When** the `check:secrets` job runs **Then** no sensitive value is found |
| Expected result | `check:secrets` job passes with exit code 0 |
| Automate        | N — enforced by the `check:secrets` job in every eyter_dev pipeline (RF-58), not by a titled test |

### TC-000-38 — secrets scan passes on clean artifacts
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23, RF-24 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture `secrets/clean` (report, JUnit, trace zip without sensitive values) |
| Steps           | **Given** clean artifact folders **When** `check:secrets` runs on them **Then** nothing is found |
| Expected result | Exit code 0 |
| Automate        | Y |

### TC-000-39 — secrets scan finds values inside trace archives and URL-encoded
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23, RF-24 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | TEST_USER_PASSWORD=`TEST_P@ss` in the injected env |
| Test data       | Fixture `secrets/leaky`: trace zip containing `TEST_P@ss`; HTML file containing `TEST_P%40ss` |
| Steps           | **Given** leaky artifact folders **When** `check:secrets` runs on them **Then** both leaks are found |
| Expected result | Non-zero exit; output names both files and `TEST_USER_PASSWORD`; output never contains `TEST_P@ss` or `TEST_P%40ss` |
| Automate        | Y |

### TC-000-40 — tracing is off for api and on-first-retry for UI projects
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-25, RF-49 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | Resolved Playwright config |
| Steps           | **Given** the resolved config **When** each project trace setting is inspected **Then** api and UI settings differ |
| Expected result | `api`: trace `off`; chromium, firefox, webkit, msedge: trace `on-first-retry` |
| Automate        | Y |

### TC-000-41 — retried runs keep UI traces and record none for api
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-25, RF-49 |
| Priority        | P1 |
| Type            | Security |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | `CI=true`; no network needed (`about:blank`) |
| Test data       | Fixture `retries/trace`: api test and UI test that fail once then pass; UI test that passes first time |
| Steps           | **Given** the fixture run with retries **When** the run finishes **Then** traces exist only for retried UI tests |
| Expected result | Trace zip present for the retried UI test (kept although the retry passed); none for the api test; none for the UI test that passed first time |
| Automate        | Y |

### TC-000-42 — lint passes code without waitForTimeout
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture using `await expect(locator).toBeVisible()` |
| Steps           | **Given** compliant code **When** ESLint runs on it **Then** no error is reported |
| Expected result | 0 errors |
| Automate        | Y |

### TC-000-43 — lint rejects waitForTimeout
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture with `await page.waitForTimeout(1000)` |
| Steps           | **Given** the hard wait **When** ESLint runs on it **Then** an error is reported |
| Expected result | 1 error on that line; non-zero exit |
| Automate        | Y |

### TC-000-44 — lint passes awaited Playwright calls
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-28 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture with awaited `page.goto`, `locator.click`, `request.get`, `expect(...).toBeVisible()` |
| Steps           | **Given** awaited calls **When** ESLint runs **Then** no error is reported |
| Expected result | 0 errors |
| Automate        | Y |

### TC-000-45 — lint rejects each kind of unawaited Playwright promise
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-28 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture with unawaited `page.click`, `locator.fill`, `request.get`, `expect(locator).toBeVisible()` |
| Steps           | **Given** four unawaited calls **When** ESLint runs **Then** each is reported |
| Expected result | 4 errors, one per line; non-zero exit |
| Automate        | Y |

### TC-000-46 — lint accepts files with a single test framework import
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-29 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | One fixture importing only `@playwright/test`; one importing only `vitest` |
| Steps           | **Given** each fixture **When** ESLint runs **Then** no error is reported |
| Expected result | 0 errors in both |
| Automate        | Y |

### TC-000-47 — lint rejects mixed Playwright and Vitest imports
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-29 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture importing both `@playwright/test` and `vitest` |
| Steps           | **Given** the mixed file **When** ESLint runs **Then** an error is reported |
| Expected result | 1 error naming the forbidden import; non-zero exit |
| Automate        | Y |

### TC-000-48 — lint covers source, tests, scripts and root config
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-30 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | ESLint config loaded |
| Test data       | Paths in `src/`, `tests/`, `scripts/`, `playwright.config.ts` |
| Steps           | **Given** each path **When** ESLint is asked whether it is ignored **Then** none is ignored |
| Expected result | All four paths linted |
| Automate        | Y |

### TC-000-49 — lint ignores generated folders
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-30 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | ESLint config loaded |
| Test data       | Paths in `node_modules/`, `playwright-report/`, `test-results/`, `reports/`, `coverage/`, `dist/` |
| Steps           | **Given** each generated path **When** ESLint is asked whether it is ignored **Then** all are ignored |
| Expected result | All six paths ignored |
| Automate        | Y |

### TC-000-50 — spec:check passes a fully traceable fixture
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-39, RF-40, RF-41 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture `spec-check/valid`: spec 900 (`test-cases-approved`), unique TCs, every RF covered, one test per Automate Y TC |
| Steps           | **Given** the valid fixture **When** spec:check runs on it **Then** no violation is found |
| Expected result | Exit code 0; no "No specs found" message |
| Automate        | Y |

### TC-000-51 — spec:check rejects titles without a valid TC ID
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-31, RF-40 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Titles `logs in`, `TC-1-3 logs in` (malformed), ID only in the `describe` title |
| Steps           | **Given** each invalid title **When** spec:check runs **Then** each is reported |
| Expected result | Non-zero exit; each offending test named |
| Automate        | Y |

### TC-000-52 — spec:check rejects a TC referencing a nonexistent RF
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-32 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | TC-900-01 with Requirement RF-99 (spec 900 has RF-1..RF-3) |
| Steps           | **Given** the orphan reference **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names `TC-900-01` and `RF-99` |
| Automate        | Y |

### TC-000-53 — spec:check fails when an implemented spec has an Automate Y TC without test
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-33, RF-68 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 900 with status `implemented`; TC-900-02 `Automate: Y`, no test titled `TC-900-02` |
| Steps           | **Given** the untested TC of an implemented spec **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names `TC-900-02` |
| Automate        | Y |

### TC-000-54 — a skipped test satisfies its TC and is reported as skipped
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-33, RF-37 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | TC-900-03 `Automate: Y` whose only test is `test.skip` |
| Steps           | **Given** a skipped test **When** spec:check runs **Then** it warns without failing |
| Expected result | Exit code 0; warning names `TC-900-03`; status `skipped` |
| Automate        | Y |

### TC-000-55 — spec:check rejects two tests with the same TC ID
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-34 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Tests `TC-900-01 first` and `TC-900-01 second` |
| Steps           | **Given** the duplicate IDs **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; both test titles named |
| Automate        | Y |

### TC-000-56 — spec:check rejects a TC ID defined twice in test-cases.md
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-35 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | `test-cases.md` of spec 900 defining `TC-900-02` twice |
| Steps           | **Given** the duplicated definition **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names `TC-900-02` and the file |
| Automate        | Y |

### TC-000-57 — spec:check rejects a TC ID of a nonexistent spec
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-36 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | No spec 999 in the fixture |
| Test data       | Test `TC-999-01 TEST_title` |
| Steps           | **Given** the unknown spec ID **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names the test and `TC-999-01` |
| Automate        | Y |

### TC-000-58 — --write creates the traceability file with all four statuses
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-37, RF-42, RF-43 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | No `docs/traceability.md` in the fixture |
| Test data       | Fixture spec with status `implemented` and an automated, a skipped, an `Automate: N` and an untested `Automate: Y` TC |
| Steps           | **Given** a missing traceability file **When** spec:check runs with `--write` **Then** the file is created |
| Expected result | File created with one row per Spec/RF/TC/test file/status; statuses `automated`, `skipped`, `manual`, `missing`; the non-skipped test is not `skipped` |
| Automate        | Y |

### TC-000-59 — spec:check without --write leaves the traceability file unchanged
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-42 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Existing `docs/traceability.md` in the fixture |
| Test data       | Fixture `spec-check/valid` |
| Steps           | **Given** an existing file **When** spec:check runs without `--write` **Then** the file is not touched |
| Expected result | File content byte-identical before and after |
| Automate        | Y |

### TC-000-60 — --write fails with a reason when the file cannot be written
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-43 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | In the fixture, `docs/traceability.md` is a folder, so it cannot be written as a file. This fails the same way on Windows, on Linux and as root; a read-only file does not, because root ignores that permission (change approved during T32) |
| Test data       | Fixture `spec-check/valid` |
| Steps           | **Given** an unwritable traceability path **When** spec:check runs with `--write` **Then** it fails |
| Expected result | Non-zero exit; message names `docs/traceability.md` and the reason |
| Automate        | Y |

### TC-000-61 — specs without test cases pass while draft or approved
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-38 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 901 `draft` and spec 902 `approved`, neither with `test-cases.md` |
| Steps           | **Given** specs before test-case approval **When** spec:check runs **Then** they pass |
| Expected result | Exit code 0 |
| Automate        | Y |

### TC-000-62 — spec without test cases fails once test cases are approved
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-38 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 903 `test-cases-approved` without `test-cases.md` |
| Steps           | **Given** the inconsistent spec **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names spec 903 |
| Automate        | Y |

### TC-000-63 — spec:check rejects an RF without TC after test-case approval
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-39 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 904 `test-cases-approved`; RF-5 has no TC |
| Steps           | **Given** the orphan RF **When** spec:check runs **Then** it fails |
| Expected result | Non-zero exit; message names `RF-5` |
| Automate        | Y |

### TC-000-64 — orphan RFs are not checked before test-case approval
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-39 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 905 `approved` with `test-cases.md` (draft) leaving RF-2 uncovered |
| Steps           | **Given** an orphan RF in an approved spec **When** spec:check runs **Then** it is not reported |
| Expected result | Exit code 0; no message about `RF-2` |
| Automate        | Y |

### TC-000-65 — spec:check with no specs prints No specs found and passes
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-41 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Empty fixture `specs/` folder |
| Steps           | **Given** an empty specs folder **When** spec:check runs **Then** it passes |
| Expected result | Prints "No specs found"; exit code 0 |
| Automate        | Y |

### TC-000-66 — generated values start with TEST_
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-44 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Base name `user`, worker ID 0 |
| Steps           | **Given** the data factory **When** it generates a value **Then** the prefix is present |
| Expected result | Value matches `^TEST_` |
| Automate        | Y |

### TC-000-67 — 10,000 values across 4 workers are unique and all prefixed
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-44, RF-45 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | 2,500 values for each worker ID 0, 1, 2, 3 |
| Steps           | **Given** four worker IDs **When** 10,000 values are generated **Then** none collides or lacks the prefix |
| Expected result | 10,000 distinct values; 0 values without `TEST_` |
| Automate        | Y |

### TC-000-68 — values generated in the same millisecond still differ
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-45 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Clock frozen at one timestamp |
| Test data       | Worker ID 0, two consecutive calls |
| Steps           | **Given** a frozen clock **When** two values are generated **Then** they are not equal |
| Expected result | Two different values, both containing worker ID 0 |
| Automate        | Y |

### TC-000-69 — HTML and JUnit reporters write to the agreed paths
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-46 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Valid URL placeholders |
| Test data       | Resolved Playwright config |
| Steps           | **Given** the resolved config **When** reporters are inspected **Then** both are configured |
| Expected result | HTML to `playwright-report/`; JUnit to `reports/junit.xml` |
| Automate        | Y |

### TC-000-70 — reports are produced when a test fails
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-46 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | No network needed |
| Test data       | Fixture `reports/failing` with one failing test |
| Steps           | **Given** a failing fixture run **When** the run finishes **Then** both reports exist |
| Expected result | `playwright-report/index.html` exists; `reports/junit.xml` contains 1 failure |
| Automate        | Y |

### TC-000-71 — CI=true enables 2 retries
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-47, RF-48 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | `CI=true` |
| Steps           | **Given** CI mode **When** the config is resolved **Then** retries are enabled |
| Expected result | `retries` equals 2 |
| Automate        | Y |

### TC-000-72 — retries stay off when CI is unset or false
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-47, RF-48 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Decision table / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | `CI` unset; `CI=false` |
| Steps           | **Given** each non-CI value **When** the config is resolved **Then** retries are off |
| Expected result | `retries` equals 0 in both cases |
| Automate        | Y |

### TC-000-73 — a test passing on retry is marked flaky
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-50 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | `CI=true`; no network needed |
| Test data       | Fixture `reports/flaky`: test fails once then passes |
| Steps           | **Given** the flaky fixture **When** the run finishes **Then** the test is flaky |
| Expected result | HTML report and JUnit mark the test as flaky |
| Automate        | Y |

### TC-000-74 — stable tests are not flaky and the count is 0
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-50, RF-51 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | `CI=true` |
| Test data       | Fixture `reports/stable`: test passes first time |
| Steps           | **Given** a stable run **When** the run and the flaky summary finish **Then** nothing is flaky |
| Expected result | No flaky mark; summary prints "Flaky tests: 0" |
| Automate        | Y |

### TC-000-75 — CI flaky summary prints the flaky count
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-51 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Report fixture with 1 flaky test out of 3 |
| Steps           | **Given** the report fixture **When** the flaky summary runs **Then** the count is printed |
| Expected result | Prints "Flaky tests: 1" |
| Automate        | Y |

### TC-000-76 — login page shows email, password and Login button
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-52, RF-53 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | BASE_URL configured; target site reachable |
| Test data       | None (no credentials used) |
| Steps           | **Given** the login route of BASE_URL **When** the sanity test opens it **Then** the login form is usable |
| Expected result | Email input, password input and Login button visible, found by accessible role and name |
| Automate        | Y |

### TC-000-77 — login URL has a single slash with or without trailing slash
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-52 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | `https://TEST_host/client` and `https://TEST_host/client/` |
| Steps           | **Given** each BASE_URL form **When** the login URL is built **Then** both give the same URL |
| Expected result | Both produce `https://TEST_host/client/#/auth/login` |
| Automate        | Y |

### TC-000-78 — unavailable login page fails with a clear message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-52, RF-53 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Login route mocked |
| Test data       | Mocked response HTTP 503 |
| Steps           | **Given** the page answers 503 **When** the login page is opened **Then** the elements are not checked |
| Expected result | Fails with "Login page unavailable: <URL> (503)" |
| Automate        | Y |

### TC-000-79 — login page timeout fails with a timeout message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-53 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Login route mocked to never respond; navigation budget injected as 1 s for this test |
| Test data       | No response |
| Steps           | **Given** a page that never answers **When** the budget expires **Then** the test fails |
| Expected result | Fails with "Login page unavailable: <URL> (timeout)"; the production budget constant equals 30,000 ms |
| Automate        | Y |

### TC-000-80 — API login with account A returns 200 and a token
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-54, RF-55, RF-56, RF-57 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @smoke @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | API_BASE_URL and account A configured; API reachable |
| Test data       | TEST_USER_EMAIL / TEST_USER_PASSWORD from env |
| Steps           | **Given** account A **When** `POST {API_BASE_URL}/auth/login` is sent **Then** login succeeds |
| Expected result | HTTP 200; JSON body with a non-empty string `token`; no failure message |
| Automate        | Y |

### TC-000-81 — non-200 login response names the variable, not its value
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-54, RF-55 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub responses 401, 429, 500; TEST_USER_EMAIL=`TEST_a@example.test` |
| Steps           | **Given** each stub **When** the login response check runs **Then** it fails |
| Expected result | Message contains the status code and `TEST_USER_EMAIL`; never `TEST_a@example.test` |
| Automate        | Y |

### TC-000-82 — non-JSON login response fails with the no-valid-token message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-56 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub: status 200, `text/html`, body `<html>TEST_maintenance</html>` |
| Steps           | **Given** an HTML body **When** the check runs **Then** it fails |
| Expected result | "Login response has no valid token (status 200, content-type text/html)" |
| Automate        | Y |

### TC-000-83 — empty, null, missing or non-string token fails
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-56 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub JSON bodies: `{"token":""}`, `{"token":null}`, `{}`, `{"token":123}` |
| Steps           | **Given** each body **When** the check runs **Then** each fails |
| Expected result | "Login response has no valid token (status 200, content-type application/json)" for all four |
| Automate        | Y |

### TC-000-84 — unreachable login API fails with the error type and URL
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-57 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub errors ECONNREFUSED, ENOTFOUND, timeout; API_BASE_URL=`https://TEST_host/api` |
| Steps           | **Given** each network error **When** the login request fails **Then** the error is classified |
| Expected result | "Login API unreachable: <error type> (https://TEST_host/api)" for each |
| Automate        | Y |

### TC-000-85 — API request budget is 30 seconds
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-57 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Timeout constant |
| Steps           | **Given** the API timeout constant **When** it is read **Then** it matches the spec |
| Expected result | Equals 30,000 ms |
| Automate        | Y |

### TC-000-86 — CI definition declares the gates, reports and artifacts
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-58, RF-65, RF-66, RF-67, RF-78, RF-82 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** the unit test inspects its jobs as text **Then** all declarations are present |
| Expected result | Push trigger on the four promotion branches; the checks job runs spec:check, lint and typecheck; the `unit-tests` job runs test:unit; `eyter-dev-api` and `eyter-dev-ui-chromium` run the @smoke suite on `api` and chromium only for `eyter_dev`; every job marks the workspace as a safe git directory after checkout and before `npm ci`; every Playwright job prints the flaky count and keeps `playwright-report/`, `reports/` (JUnit included) and `test-results/` for 7 days |
| Automate        | Y |

### TC-000-87 — each push gate runs only on its own branch
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-58, RF-69, RF-70, RF-71, RF-78, RF-80, RF-83 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` triggers and job conditions |
| Steps           | **Given** the workflow triggers and job conditions **When** they are inspected **Then** each push gate targets only its own branch |
| Expected result | Only `push` and `workflow_dispatch` trigger the workflow; the shared `checks` and `unit-tests` jobs have no branch condition; each branch API and UI job (the push gates) is conditioned on exactly one branch; together the gates cover `eyter_dev`, `release`, `main` and `production` |
| Automate        | Y |

### TC-000-88 — push to eyter_dev runs a green workflow run with test report
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-59 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | GitHub secrets configured |
| Test data       | A commit without violations |
| Steps           | **Given** a clean commit **When** it is pushed to eyter_dev **Then** the workflow run passes |
| Expected result | All jobs green; run passed; the artifacts contain `reports/junit.xml` with the smoke results |
| Automate        | N — requires a real GitHub Actions run; observed at validation |

### TC-000-89 — a failing job fails the workflow run and keeps evidence
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-59, RF-66, RF-67 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | GitHub secrets configured |
| Test data       | A commit with one deliberately failing smoke assertion (reverted afterwards) |
| Steps           | **Given** a failing smoke test **When** the workflow runs **Then** it fails with evidence |
| Expected result | Run failed; the failing test is listed in `reports/junit.xml`; report and test-results artifacts downloadable once `check:secrets` passed |
| Automate        | N — requires a real GitHub Actions run and a temporary failing commit; executed once at validation |

### TC-000-90 — SUITE and BROWSER values select the right tests
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-60, RF-61, RF-62, RF-63 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | SUITE ∈ {smoke, regression} × BROWSER ∈ {chromium, firefox, webkit, all} |
| Steps           | **Given** each valid combination **When** the CI selector runs **Then** the matching Playwright arguments are produced |
| Expected result | `--grep @smoke` or `--grep @regression`; the chosen browser project(s) (all = three); `api` project once |
| Automate        | Y |

### TC-000-91 — unsupported SUITE or BROWSER fails naming allowed values
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-60, RF-61, RF-62 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | BROWSER=`msedge`, BROWSER=`""`, SUITE=`Smoke`, SUITE=`TEST_suite` |
| Steps           | **Given** each unsupported value **When** the CI selector runs **Then** it fails |
| Expected result | Non-zero exit; message names the variable and its allowed values |
| Automate        | Y |

### TC-000-92 — a suite with zero tests fails the pipeline
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-63 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | SUITE=regression with a stubbed test count of 0 |
| Steps           | **Given** an empty selection **When** the CI selector runs **Then** it fails |
| Expected result | "No tests found for SUITE=regression"; non-zero exit |
| Automate        | Y |

### TC-000-93 — credential values are stored as GitHub encrypted secrets
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-64 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | Admin access to the GitHub repository |
| Test data       | BASE_URL, API_BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD, PROMOTION_TOKEN |
| Steps           | **Given** the repository secrets **When** they are listed by name (`gh secret list`) **Then** all seven exist |
| Expected result | All seven names listed; no value is shown or stored in the repository |
| Automate        | N — GitHub settings review; the framework has no access to repository settings |

### TC-000-94 — job logs leak no credential values
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-64 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | A finished GitHub Actions run with the secrets in use |
| Test data       | Job logs of the eyter_dev run |
| Steps           | **Given** a finished run **When** its job logs are reviewed **Then** no credential value appears |
| Expected result | Secret values appear only as `***`; no step prints the environment |
| Automate        | N — requires a real GitHub Actions run; executed once at validation |

### TC-000-95 — CI script check flags environment printing
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-65 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture CI scripts containing `printenv`, `env`, `set -x` |
| Steps           | **Given** each forbidden command **When** the CI script check runs on the fixture **Then** each is flagged |
| Expected result | 3 findings naming the command and line |
| Automate        | Y |

### TC-000-96 — spec:check warns for an Automate Y TC without test before implementation
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-68, RF-42 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Spec 900 with status `test-cases-approved`; TC-900-02 `Automate: Y`, no test titled `TC-900-02` |
| Steps           | **Given** the untested TC of a spec not yet implemented **When** spec:check runs **Then** it warns without failing |
| Expected result | Exit code 0; no error; a warning names `TC-900-02`; its traceability status is `missing` |
| Automate        | Y |

### TC-000-97 — spec:check accepts TC IDs with three-digit sequence numbers
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-31 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Fixture TC-900-100 in test-cases.md and a test titled `TC-900-100 TEST_case`; a test titled `TC-900-1 TEST_case` |
| Steps           | **Given** a 3-digit and a 1-digit sequence number **When** spec:check runs **Then** only the 1-digit one is rejected |
| Expected result | `TC-900-100` is accepted and traced; `TC-900-1` is reported as not starting with a TC ID |
| Automate        | Y |

### TC-000-98 — CI definition runs the release gate
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-69 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the CI definition **When** the jobs of a `release` push are inspected **Then** they form the release gate |
| Expected result | On `release` pushes, `release-api` runs `npx playwright test --grep @regression --project=api`, and `release-ui-chromium`, `release-ui-firefox` and `release-ui-webkit` run the @regression suite on their browser; each job runs check:secrets after its tests |
| Automate        | Y |

### TC-000-99 — CI definition runs the main gate
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-70 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the CI definition **When** the jobs of a `main` push are inspected **Then** they form the main gate |
| Expected result | On `main` pushes, `main-api` runs `npx playwright test --grep @smoke --project=api`, and `main-ui-chromium`, `main-ui-firefox` and `main-ui-webkit` run the @smoke suite on their browser; each job runs check:secrets after its tests |
| Automate        | Y |

### TC-000-100 — CI definition runs the production sanity gate
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-71 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the CI definition **When** the jobs of a `production` push are inspected **Then** they form the sanity gate |
| Expected result | On `production` pushes, `production-api` runs `npx playwright test --grep @smoke --project=api` and `production-ui-chromium` runs the @smoke suite on chromium; each job runs check:secrets after its tests |
| Automate        | Y |

### TC-000-101 — promotion runs last, only on success, and never from manual runs or production
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-71, RF-72, RF-73, RF-76 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the CI definition **When** the promotion job and its rules are inspected **Then** it can only run after a fully green push pipeline on eyter_dev, release or main |
| Expected result | `promote` needs every other job and runs only when none failed or was canceled; its condition is a push on eyter_dev, release or main; it never runs for `workflow_dispatch` or production; one promotion at a time (`concurrency: promotion`); no `continue-on-error`; no force-push or branch deletion command |
| Automate        | Y |

### TC-000-102 — the next branch is release, main, production and none after that
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-72, RF-73 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Branches `eyter_dev`, `release`, `main`, `production`, `TEST_feature` |
| Steps           | **Given** each branch **When** the next branch is asked for **Then** only the three promotion branches have one |
| Expected result | release, main, production, none, none; promoting from production or another branch fails naming the branch and merges nothing |
| Automate        | Y |

### TC-000-103 — promotion merges the tested commit into the next branch
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-72, RF-74, RF-75, RF-76, RF-77 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub GitHub API (no network); env with `TEST_` token value; the tested commit is eyter_dev's tip and release lacks it |
| Steps           | **Given** a tested commit that release lacks **When** the promotion runs **Then** it merges that commit into release |
| Expected result | One call to the merges API with `base: release` and `head` = tested commit; branches only read, never deleted; exit code 0; output names source, target and commit; the token never appears in output |
| Automate        | Y |

### TC-000-104 — promotion from release and main targets the next branch
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-72 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub GitHub API (no network); env with `TEST_` token value; runs on release and on main, each with a commit the target lacks |
| Steps           | **Given** a green run on release or main **When** the promotion runs **Then** it merges into the next branch |
| Expected result | release merges into main and main into production, each with `head` = tested commit; exit code 0 |
| Automate        | Y |

### TC-000-105 — promotion passes when the target is already up to date
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-75 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub GitHub API (no network); env with `TEST_` token value; compare of production with the tested commit answers `identical` or `behind` |
| Steps           | **Given** nothing new to promote **When** the promotion runs **Then** it merges nothing |
| Expected result | Exit code 0; message "production is already up to date"; nothing merged |
| Automate        | Y |

### TC-000-106 — promotion fails when the source branch moved past the tested commit
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-74 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub GitHub API (no network); env with `TEST_` token value; eyter_dev's tip is a newer commit than the tested one |
| Steps           | **Given** a newer commit on the source branch **When** the promotion merges **Then** it refuses |
| Expected result | Non-zero exit; message names eyter_dev, release and "moved past"; no merge attempted |
| Automate        | Y |

### TC-000-107 — promotion fails on a merge conflict
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-74 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Stub GitHub API (no network); env with `TEST_` token value; the merges API answers 409 "Merge conflict" |
| Steps           | **Given** a conflicting merge **When** the promotion runs **Then** it stops |
| Expected result | Non-zero exit; message names source, target and GitHub's reason, and says nothing was merged |
| Automate        | Y |

### TC-000-108 — promotion without PROMOTION_TOKEN fails naming the variable
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-77 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | None |
| Test data       | Env without `PROMOTION_TOKEN`, and env with it set to whitespace |
| Steps           | **Given** no usable token **When** the promotion runs **Then** it fails before calling GitHub |
| Expected result | Non-zero exit; message "Missing required environment variable: PROMOTION_TOKEN"; the stub API receives no call |
| Automate        | Y |

### TC-000-109 — a green eyter_dev push is promoted up to production
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-69, RF-70, RF-71, RF-72, RF-76, RF-77 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | `PROMOTION_TOKEN` secret configured (fine-grained token, Contents read and write on this repository) |
| Test data       | The commit that moves CI to GitHub only, pushed to eyter_dev |
| Steps           | **Given** a green eyter_dev run **When** each run finishes **Then** the commit reaches release, main and production |
| Expected result | Runs on eyter_dev, release, main and production green; three promotion merges of the tested commit; all four branches kept; production does not promote; the token appears only as `***` in job logs |
| Automate        | N — requires real GitHub Actions runs on the four branches; executed once at validation |

### TC-000-110 — a failing job stops the promotion chain
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-59, RF-69, RF-70, RF-73, RF-83 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline / CLI level) |
| Preconditions   | `PROMOTION_TOKEN` configured |
| Test data       | A pipeline with one failing job (the next natural failure, or a temporary failing commit approved by the user) |
| Steps           | **Given** a failed job **When** the run ends **Then** nothing is promoted |
| Expected result | Run failed; every job after the failed one and `promote` skipped (RF-83); the next branch unchanged |
| Automate        | N — requires a real failing GitHub Actions run; executed at validation |

### TC-000-114 — GitHub workflow scans secrets after every Playwright job and uploads only after a clean scan
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-79 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** each Playwright job **When** its steps are inspected **Then** the scan comes first and gates the upload |
| Expected result | Every Playwright job runs `npm run check:secrets` with `if: always()` after its tests, then uploads playwright-report/, reports/ and test-results/ with a 7-day retention only if that scan step succeeded |
| Automate        | Y |

### TC-000-115 — GitHub manual run selects the suite through ci:run-suite
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-80 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** the manual run is inspected **Then** it reuses the shared selector |
| Expected result | `workflow_dispatch` has `suite` (smoke, regression) and `browser` (chromium, firefox, webkit, all) choice inputs; `run-suite` needs `unit-tests` and passes them as SUITE and BROWSER to `npm run ci:run-suite` |
| Automate        | Y |

### TC-000-116 — GitHub workflow is read-only, never ignores a failure, prints no environment and never pushes
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-64, RF-65, RF-77, RF-79, RF-81 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** it is scanned **Then** none of the forbidden patterns appears |
| Expected result | `permissions: contents: read`; no `continue-on-error`; no environment printing (RF-65 check); no `git push` or `git merge`; the seven variables, `PROMOTION_TOKEN` included, come only from `${{ secrets.* }}` with the same name |
| Automate        | Y |

### TC-000-118 — GitHub run on eyter_dev passes
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-78, RF-79 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline level) |
| Preconditions   | GitHub secrets set by the user |
| Test data       | A push of `eyter_dev` to GitHub |
| Steps           | **Given** a push to `eyter_dev` on GitHub **When** the workflow finishes **Then** every job passed |
| Expected result | `checks`, `unit-tests`, `eyter-dev-api` and `eyter-dev-ui-chromium` pass, in that order; each check:secrets step passes; artifacts are uploaded |
| Automate        | N — requires a real GitHub Actions run; executed at validation |

### TC-000-119 — each push stage is a separate job that starts only after the previous one
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-83, RF-58, RF-69, RF-70, RF-71, RF-80 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** the `needs` of every job are inspected **Then** they form one chain per branch |
| Expected result | `checks` has no `needs` and `fail-fast: true` (a failing check cancels the others); no job except `publish-results` uses `always()` in its condition and only `promote` uses `!cancelled() && !failure()`, so a failed or canceled job skips every later stage; `unit-tests` needs exactly `checks`; each branch API job and `run-suite` need exactly `unit-tests`; the first UI job of each branch needs exactly its API job; on `release` and `main` the firefox job needs exactly the chromium job and the webkit job needs exactly the firefox job; no Playwright job runs `npm run test:unit` |
| Automate        | Y |

### TC-000-120 — test summary reports a Playwright run
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-84 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `tests/fixtures/reports/summary/` Playwright JSON report with 5 expected, 2 unexpected, 1 skipped and 1 flaky test, duration 83,400 ms |
| Steps           | **Given** the Playwright results file **When** `report:summary` runs with the title `API` **Then** it prints the summary table |
| Expected result | A Markdown table with Stage `API`, Passed 6 (expected + flaky), Failed 2, Skipped 1, Flaky 1, Total 9, Duration `01:23`; below it the titles of the 2 failed tests; `reports/summary.json` holds the same stage, counts and duration; exit code 0 |
| Automate        | Y |

### TC-000-121 — test summary reports a Vitest run
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-84 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `tests/fixtures/reports/summary/` Vitest JSON results with 10 passed, 1 failed, 1 pending and 1 todo test |
| Steps           | **Given** the Vitest results file **When** `report:summary` runs with the title `Unit` **Then** it prints the summary table |
| Expected result | Stage `Unit`, Passed 10, Failed 1, Skipped 2 (pending + todo), Flaky 0, Total 13, duration from the start time to the last end time in mm:ss; the failed test title is listed; exit code 0 |
| Automate        | Y |

### TC-000-122 — test summary is added to the GitHub job summary only when one is available
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-84 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `tests/fixtures/reports/summary/` Playwright JSON report; a temporary file that already contains a line, used as `GITHUB_STEP_SUMMARY` |
| Steps           | **Given** `GITHUB_STEP_SUMMARY` set, then unset **When** `report:summary` runs **Then** the table goes to the log and, only when set, to the job summary |
| Expected result | With the variable set, the table is appended after the existing line (nothing overwritten) and also printed; with the variable unset, the table is only printed and no file is created |
| Automate        | Y |

### TC-000-123 — unit summary adds code coverage only when a coverage summary exists
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-85 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `tests/fixtures/reports/summary/` Vitest JSON results and a `coverage-summary.json` with lines 91.25 %, branches 80 %, functions 88.5 %, statements 90.75 % |
| Steps           | **Given** the results with and without the coverage summary **When** `report:summary` runs **Then** coverage is shown only when it exists |
| Expected result | With the coverage file, a coverage table shows Lines 91.25 %, Branches 80.00 %, Functions 88.50 %, Statements 90.75 %; without it, no coverage table and no error |
| Automate        | Y |

### TC-000-124 — unit coverage covers src and scripts with no threshold
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-85 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `vitest.config.mts`, `package.json` |
| Steps           | **Given** the Vitest configuration and the npm scripts **When** they are inspected **Then** coverage is configured for CI and never gates |
| Expected result | Coverage provider `v8` with `@vitest/coverage-v8` pinned to the installed vitest version; include `src/**` and `scripts/**`; reporters include `json-summary` and `html`; reports directory `reports/coverage`; `reportOnFailure: true` so coverage is reported when unit tests fail; no `thresholds`; `test:unit:ci` runs Vitest with `--coverage` and writes JSON results to `reports/unit-results.json`; `test:unit` is unchanged |
| Automate        | Y |

### TC-000-125 — test summary without a results file reports unknown results and passes
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-87, RF-84 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | A results path that does not exist; a temporary `GITHUB_STEP_SUMMARY` file |
| Steps           | **Given** no results file **When** `report:summary` runs **Then** it reports unknown results without failing |
| Expected result | Log and job summary contain `Results unknown (no report at <path>)`; exit code 0 |
| Automate        | Y |

### TC-000-126 — spec:check --summary reports requirements coverage per spec
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-86 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP / BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | Fixture repository with spec 900 (status test-cases-approved; 3 RFs, 4 TCs: 2 automated, 1 manual, 1 missing) and the draft spec 901 (2 RFs) without test-cases.md; a temporary `GITHUB_STEP_SUMMARY` file |
| Steps           | **Given** the fixture repository **When** `spec:check --summary` runs **Then** it prints one row per spec |
| Expected result | Spec 900: RFs 3, TCs 4, automated 2, manual 1, skipped 0, missing 1, automated 50 %; spec 901: RFs 2, TCs 0, automated `—`; `reports/summary.json` holds the same counts; the same table is appended to the job summary; the exit code is the same as without `--summary` |
| Automate        | Y |

### TC-000-127 — CI jobs write their summaries before the secrets scan
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-84, RF-85, RF-86, RF-79 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** each test job's steps are inspected **Then** the summary step is wired in |
| Expected result | The spec:check leg of `checks` runs spec:check with `--summary`; `unit-tests` runs `npm run test:unit:ci`; every unit, API, UI and manual job runs `npm run report:summary` with `if: always()` after its tests and before `check:secrets`; `unit-tests` uploads `reports/` only after a clean scan; each test job uploads its `summary-<job>` artifact only after a clean scan |
| Automate        | Y |

### TC-000-128 — results page updates one branch and keeps the others
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `tests/fixtures/reports/summary/` a previous `results.json` with `release` and `main` entries; summary artifacts of an `eyter_dev` run where checks, unit and API passed and UI chromium failed |
| Steps           | **Given** the previous results and the new eyter_dev summaries **When** `report:pages` runs **Then** the page shows every branch |
| Expected result | `eyter_dev` shows the new commit, run link, date in UTC ISO 8601, overall result `failed` (one stage failed), and per stage the passed, failed, skipped and flaky counts and duration, with the unit coverage and requirements coverage; `release` and `main` keep their previous entries unchanged; `production` shows `no run yet`; `index.html` and `results.json` are written under `reports/pages/` |
| Automate        | Y |

### TC-000-129 — results page shows stages that did not run and handles the first publication
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88 |
| Priority        | P2 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | No previous `results.json`; summary artifacts of a `release` run that stopped after the API job |
| Steps           | **Given** no published page and a run that stopped early **When** `report:pages` runs **Then** missing data is shown, not invented |
| Expected result | `release` shows checks, unit and API with their counts and UI chromium, firefox and webkit as `not run`; the three other branches show `no run yet`; exit code 0 |
| Automate        | Y |

### TC-000-130 — only the publish job can write to Pages, after the scan, from push runs
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88, RF-81 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `.github/workflows/ci.yml` |
| Steps           | **Given** the GitHub workflow **When** the publish job and the permissions are inspected **Then** publishing is limited and scanned |
| Expected result | `publish-results` runs with `always()` only for push events and needs every test job; it is the only job with `pages: write` and `id-token: write`; the top-level permissions stay `contents: read`; it uses the `github-pages` environment and `concurrency` group `pages`; `npm run report:pages` and `npm run check:secrets` run before `upload-pages-artifact`, which comes before `deploy-pages`; `run-suite` never publishes; `promote` needs `publish-results` |
| Automate        | Y |

### TC-000-131 — results page escapes test titles
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | A summary artifact whose failed test title is `TC-999-01 <script>alert(1)</script> & "quotes"` |
| Steps           | **Given** a failed title with HTML characters **When** `report:pages` builds the page **Then** it is shown as text |
| Expected result | `index.html` contains the escaped title (`&lt;script&gt;`, `&amp;`, `&quot;`) and no `<script>` element from data |
| Automate        | Y |

### TC-000-132 — README shows badges, the results page and the manual-testing guide
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-89 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | EP |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | `README.md` |
| Steps           | **Given** the README **When** it is inspected **Then** results and the manual-testing guide are present |
| Expected result | One CI badge (`actions/workflows/ci.yml/badge.svg?branch=<branch>`) for each of eyter_dev, release, main and production; a link to the GitHub Pages results page; the guide shows the local commands for the unit tests (with and without coverage), the API tests, the UI tests on chromium, firefox and webkit, the `@smoke` and `@regression` suites, and the manual GitHub run with `gh workflow run ci.yml --ref <branch> -f suite=<suite> -f browser=<browser>` for the four branches |
| Automate        | Y |

### TC-000-133 — GitHub Pages shows the results of a real push run
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88, RF-89 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline level) |
| Preconditions   | Repository public; Pages source GitHub Actions; `github-pages` environment allows the four branches |
| Test data       | A push of `eyter_dev` |
| Steps           | **Given** a push to `eyter_dev` **When** the run finishes **Then** the results page and README badge reflect it |
| Expected result | The run Summary shows the requirements coverage, unit (with coverage), API and UI tables; the Pages URL shows the eyter_dev entry for the pushed commit; the README badge shows the run result; after promotion, the release, main and production entries appear |
| Automate        | N — requires a real GitHub Actions run and Pages; executed at validation |

### TC-000-134 — results page fails without deploying when the published results cannot be read
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | A stubbed fetch of the published `results.json` that answers HTTP 500, then one that throws a network error; summary artifacts of an `eyter_dev` run |
| Steps           | **Given** the previous results cannot be read **When** `report:pages` runs **Then** it fails and writes no page |
| Expected result | Exit code non-zero; the message names the `results.json` URL and the reason (`HTTP 500`, or the network error); nothing is written under `reports/pages/` |
| Automate        | Y |

### TC-000-135 — test summary lists at most 50 failed titles
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-84 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository checked out |
| Test data       | Playwright JSON reports with 50 and with 51 failed tests |
| Steps           | **Given** 50, then 51 failed tests **When** `report:summary` runs **Then** the list is capped |
| Expected result | With 50 failures, all 50 titles and no "more" line; with 51, the first 50 titles followed by `and 1 more` |
| Automate        | Y |

### TC-000-136 — git history has no secrets before the repository is made public
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-88, RF-20, RF-23 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (repository level) |
| Preconditions   | Local `.env` with the real values; repository still private |
| Test data       | The full git history of every branch (`git log -p --all`) |
| Steps           | **Given** the whole history **When** it is searched for the `.env` password values (plain and URL-encoded) and JWT-shaped tokens **Then** nothing is found |
| Expected result | Zero matches; the search command and its result (counts only, never the values) are recorded in validation.md before the visibility change |
| Automate        | N — one-off check of the real history with real secret values; executed at validation, before the repository is made public |

## Out of scope for testing
- Business flows (catalog, cart, checkout, orders) and login scenarios beyond RF-54 — later specs.
- Load, performance and penetration testing — excluded by docs/test-plan.md §2.
- msedge in CI — excluded by the spec; msedge is covered only by the `--list` check (TC-000-16).
- Accessibility audits of the target site — the only UI in Spec 000 is the login page, whose
  elements are located by accessible role and name (TC-000-76); full audits belong to the UI specs.

## Notes for the plan
- TODO: VERIFY how the Playwright JUnit reporter represents flaky tests (TC-000-73).
- Assumption: `spec:check --write` writes `docs/traceability.md` even when violations exist,
  then exits non-zero, so `missing` rows are visible.
- TC IDs use two or more digits after the spec number (`TC-000-100` and later; RF-31, clarification 12).

## Open questions
None.
