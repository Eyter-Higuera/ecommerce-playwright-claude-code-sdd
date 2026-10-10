# Implementation Log — Spec 000 Framework foundation

Spec: specs/000-framework-foundation/spec.md · Tasks: specs/000-framework-foundation/tasks.md

## T1 — Bootstrap the npm project, TypeScript and Vitest

Date: 2026-10-07 · Covers: RF-1, RF-3, RF-5 / TC-000-03

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/setup/manifest.test.ts | NEW | TC-000-03 |
| package.json | NEW | Engines `>=20`, approved dependencies, scripts `postinstall`, `typecheck`, `test:unit` |
| package-lock.json | NEW | Locked dependency tree for `npm ci` |
| .npmrc | NEW | `engine-strict=true` so npm fails on Node < 20 (RF-3) |
| tsconfig.json | NEW | TypeScript strict, NodeNext, no emit; excludes `tests/fixtures/**` |
| vitest.config.mts | NEW | Collects `tests/unit/**/*.test.ts` only |
| .gitignore | UPDATED | Ignores `reports/` |

### Test run
Command: `npx vitest run tests/unit/setup/manifest.test.ts -t "TC-000-03"`
Result: 1 passed · 0 failed · 0 skipped (Node v24.19.0, no browser)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npm ci` exits 0 and `npx vitest run tests/unit/setup/manifest.test.ts -t "TC-000-03"` passes | PASS (`npm ci` exit 0, postinstall installed chromium, firefox and webkit; 1 test passed) |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint | N/A (ESLint configured in T5) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Dependency versions:
  - @playwright/test 1.63.0 (exact).
  - typescript ~6.0.3, because typescript-eslint 8.71 supports TypeScript < 6.1 and not TypeScript 7.
  - vitest ^4.1.11, because vitest 5 requires Node >= 22.12, which conflicts with Node >= 20.
  - eslint ^10.12.0, typescript-eslint ^8.71.1, eslint-plugin-playwright ^2.12.1.
  - zod ^4.6.5, dotenv ^18.0.6.
  - @types/node ^20.19.43, matching the Node 20 lower bound.
- Finding: eslint 10 and vite (pulled in by vitest 4) declare Node `^20.19.0`, so with
  `engine-strict` the effective lower bound is Node 20.19, not 20.0. `engines.node` stays `>=20`
  as RF-3 / TC-000-03 require. If 20.0–20.18 must be supported, a Mode C spec change is needed.
- Deviation from plan.md: the Vitest config is `vitest.config.mts` instead of `vitest.config.ts`.
  The package is CommonJS, and Vite warned about ESM syntax in a file loaded as CommonJS.

## T2 — Add the CLI test helper and verify the Vitest runner exit codes

Date: 2026-10-07 · Covers: RF-5 / TC-000-08, TC-000-09

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/setup/vitest-runner.test.ts | NEW | TC-000-08, TC-000-09 |
| tests/unit/helpers/run-cli.ts | NEW | Spawns CLIs (`runNodeScript`, `runVitest`) with a minimal allowlisted environment; `CLI_TEST_TIMEOUT_MS`, `fixturePath`, `makeEmptyDir` |
| tests/fixtures/vitest/passing/ | NEW | `sample.test.ts` (one passing test) + own `vitest.config.mts` |
| tests/fixtures/vitest/failing/ | NEW | `sample.test.ts` (one failing test) + own `vitest.config.mts` |

### Test run
Command: `npx vitest run tests/unit/setup/vitest-runner.test.ts -t "TC-000-0[89]"`
Result: 2 passed · 0 failed · 0 skipped (Node v24.19.0, no browser)
Regression: `npm run test:unit` → 3 passed (T1 + T2)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/setup/vitest-runner.test.ts -t "TC-000-0[89]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint | N/A (ESLint configured in T5) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Vitest searches parent folders for a config file. Without their own config, the fixture projects
  inherited the repository config, which excludes `tests/fixtures/**`, and found no tests. Each
  fixture project therefore has its own minimal `vitest.config.mts`.
- The default Vitest reporter prints no names of passing tests when output is not a terminal.
  TC-000-08 asserts the exit code and the `Tests 1 passed (1)` summary, which is what the TC
  requires. TC-000-09 also asserts that the failing test is named.
- `makeEmptyDir` creates OS temp folders. These are local, not site data. It is used from T18
  onwards to keep the repository `.env` out of child runs.

## T3 — Block outbound network access in unit tests

Date: 2026-10-07 · Covers: RF-6 / TC-000-10, TC-000-11

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/setup/network-guard.test.ts | NEW | TC-000-10, TC-000-11 |
| tests/unit/setup/block-network.ts | NEW | Vitest setup file. Replaces `http.request/get`, `https.request/get` and `globalThis.fetch` with a guard that throws "Network access is disabled in unit tests: <url>"; `syncBuiltinESMExports` keeps named imports patched |
| vitest.config.mts | UPDATED | `setupFiles: ['tests/unit/setup/block-network.ts']` |

### Test run
Command: `npx vitest run tests/unit/setup/network-guard.test.ts -t "TC-000-1[01]"`
Result: 2 passed · 0 failed · 0 skipped (Node v24.19.0, no browser)
Tests first: before the guard existed, TC-000-11 failed (red), as expected.
Regression: `npm run test:unit` → 5 passed (T1–T3)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/setup/network-guard.test.ts -t "TC-000-1[01]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint | N/A (ESLint configured in T5) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- TC-000-11 covers every client entry point in one test: `http.get`, `http.request` (URL string
  and options object), `https.get`, `https.request(URL)` and `fetch`, for localhost and a remote
  host. It is a single test because two tests with the same TC ID would violate RF-34.
- TC-000-10 mocks `fetch` with `vi.stubGlobal`. `afterEach` restores the guard with
  `vi.unstubAllGlobals()`, so tests stay independent.
- Scope: the guard covers the HTTP/HTTPS client APIs and `fetch`, which is what RF-6 requires.
  Raw `net`/`tls` sockets are not patched, because Vitest may use them internally.
- Child processes spawned by CLI tests (T2 and later) do not inherit the guard. They run only
  local fixtures and do not use the network.

## T4 — Enforce strict type checking

Date: 2026-10-07 · Covers: RF-4 / TC-000-06, TC-000-07

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/setup/typecheck.test.ts | NEW | TC-000-06, TC-000-07 |
| tests/fixtures/typecheck/invalid/invalid.ts | NEW | A string assigned to a number (TS2322, line 5) and an implicit `any` parameter (TS7006, line 8) |
| tests/fixtures/typecheck/invalid/tsconfig.json | NEW | Extends the repository tsconfig, so the same strict options apply; `exclude: []` overrides the inherited fixture exclusion |
| tsconfig.json | REUSED | Strict configuration from T1; no change needed |

### Test run
Command: `npx vitest run tests/unit/setup/typecheck.test.ts -t "TC-000-0[67]"`
Result: 2 passed · 0 failed · 0 skipped (Node v24.19.0, TypeScript 6.0.3, no browser)
Regression: `npm run test:unit` → 7 passed (T1–T4)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/setup/typecheck.test.ts -t "TC-000-0[67]"` passes and `npm run typecheck` exits 0 | PASS |
| Test review checklist | PASS |
| Lint | N/A (ESLint configured in T5) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The tests run `tsc --noEmit --pretty false -p <tsconfig>` in a child process. This is the same
  compiler call as `npm run typecheck`; `--pretty false` keeps the `file(line,col): error TSxxxx`
  format stable for assertions.
- TC-000-07 asserts the file, the line and the error code of both errors, so it cannot pass for an
  unrelated failure.

## T5 — Configure ESLint rules for hard waits and unawaited Playwright calls

Date: 2026-10-07 · Covers: RF-27, RF-28 / TC-000-42, TC-000-43, TC-000-44, TC-000-45

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/lint/eslint-rules.test.ts | NEW | TC-000-42 to TC-000-45 (ESLint Node API with the repository config, `ignore: false`) |
| tests/fixtures/lint/web-first-wait.spec.ts | NEW | TC-000-42: compliant web-first wait |
| tests/fixtures/lint/wait-for-timeout.spec.ts | NEW | TC-000-43: one hard wait |
| tests/fixtures/lint/awaited-calls.spec.ts | NEW | TC-000-44: awaited `page.goto`, `locator.click`, `request.get`, web-first `expect` |
| tests/fixtures/lint/unawaited-calls.spec.ts | NEW | TC-000-45: four unawaited calls, each line marked `// UNAWAITED` |
| eslint.config.mjs | NEW | typescript-eslint `recommendedTypeChecked` + `no-floating-promises`; `playwright/no-wait-for-timeout` and `playwright/missing-playwright-await` as errors on all TS; Playwright `flat/recommended` on `*.spec.ts`; global ignores |
| package.json | UPDATED | `lint` script (`eslint .`) |
| tests/unit/setup/block-network.ts | UPDATED | Outside this task's file list: the first `npm run lint` flagged two unnecessary type assertions from T3 (`no-unnecessary-type-assertion`); removed them, with no behavior change |

### Test run
Command: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[2-5]"`
Result: 4 passed · 0 failed · 0 skipped (ESLint 10.12, no browser)
Regression: `npm run test:unit` → 11 passed (T1–T5)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[2-5]"` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS (0 problems) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- `eslint-plugin-playwright` exposes a different plugin object inside `configs['flat/recommended']`,
  and ESLint rejects two different instances registered under the same name. The config reuses
  the recommended config's plugin instance.
- Type-aware rules lint the fixtures (outside tsconfig.json) through
  `projectService.allowDefaultProject: ['tests/fixtures/lint/*.ts']` with
  `defaultProject: 'tsconfig.json'`. This resolves the plan's `// TODO: VERIFY` on type-aware lint
  of fixtures.
- TC-000-45: the unawaited `expect` line is flagged by both `no-floating-promises` and
  `missing-playwright-await`. The test therefore asserts exactly four error-bearing lines (as
  planned) and that every error comes from those two rules. `page.click` also gets a
  `playwright/prefer-locator` warning; it is a warning, not an error, and is out of scope here.
- `tests/fixtures/` is globally ignored by `npm run lint`. Whether that and the other ignores are
  correct (RF-30) is verified in T6.

## T6 — Configure ESLint import separation and lint scope

Date: 2026-10-07 · Covers: RF-29, RF-30 / TC-000-46, TC-000-47, TC-000-48, TC-000-49

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/lint/eslint-rules.test.ts | UPDATED | TC-000-46 to TC-000-49 |
| tests/fixtures/lint/playwright-only.spec.ts | NEW | TC-000-46: only `@playwright/test` |
| tests/fixtures/lint/vitest-only.test.ts | NEW | TC-000-46: only `vitest` |
| tests/fixtures/lint/mixed-imports.spec.ts | NEW | TC-000-47: imports both frameworks |
| eslint.config.mjs | UPDATED | `no-restricted-imports`: `vitest` forbidden in `**/*.spec.ts` and `src/**`; `@playwright/test` forbidden in `**/*.test.ts` |

### Test run
Command: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[6-9]"`
Result: 4 passed · 0 failed · 4 skipped by the `-t` filter (the T5 tests in the same file)
Tests first: TC-000-47 failed before the rule existed.
Regression: `npm run test:unit` → 15 passed (T1–T6)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[6-9]"` passes (4 tests) and `npm run lint` exits 0 | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS (exit 0) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Mixing is detected by file type rather than by counting imports. A `*.spec.ts` file is
  Playwright, a `*.test.ts` file is Vitest, and `src/**` is framework code that may use
  Playwright but never Vitest. A file that imports both is therefore always rejected, on the
  import that does not belong to its type.
- TC-000-48 and TC-000-49 already passed before the change, because T5 had created the global
  ignores. T6 adds the tests that lock that scope in.
- TC-000-47 at first reported 2 errors. The second (`no-unsafe-call`) came from the fixture
  itself: it used `toHaveBeenCalled`, which is not a Playwright matcher. The fixture was fixed so
  the import is its only problem. The assertion was not weakened.

## T7 — Implement the environment loader and the requireEnv accessor

Date: 2026-10-07 · Covers: RF-7, RF-13, RF-14, RF-15, RF-17 / TC-000-13, TC-000-22, TC-000-23, TC-000-24, TC-000-25

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/config/env.test.ts | NEW | TC-000-13, TC-000-22 to TC-000-25 |
| src/config/env.ts | NEW | `ENV_VARIABLE_NAMES` (RF-13), `loadEnv({ processEnv, dotenvPath })` (`.env` merged under the process environment; a present-but-empty process value wins), `requireEnv(name, env)` (throws for missing, empty or whitespace-only values). Nothing is read at import time (RF-7) |
| src/errors/messages.ts | NEW | `missingEnvVariableMessage` → "Missing required environment variable: <NAME>". Planned for T10, created now so the RF-17 text has a single owner; T10 adds the other builders |
| tests/fixtures/env/dotenv/sample.env | NEW | `.env` fixture with TEST_ placeholders |

### Test run
Command: `node node_modules/vitest/vitest.mjs run tests/unit/config/env.test.ts -t "TC-000-(13|2[2-5])"`, run with the real Node binary from `volta which node`
Result: 5 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before `src/config/env.ts` existed.
Regression: `npm run test:unit` → 20 passed (T1–T7)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/config/env.test.ts -t "TC-000-(13\|2[2-5])"` passes (5 tests) | PASS (same command, run through the real Node binary; see findings) |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The `.env` fixture is named `sample.env`, not `.env`, because `.gitignore` excludes `.env` and
  `.env.*` everywhere. A fixture named `.env` would never be committed and would break CI.
  tasks.md was updated to reflect this.
- Environment quirk (local only): on this machine `npx` and `node` are Volta shims that go through
  `cmd.exe`, which treats the `|` in a `-t "…(a|b)…"` pattern as a pipe. Done-when commands that
  contain `|` are run with the real Node binary (`volta which node`) and
  `node_modules/vitest/vitest.mjs`, which is the same Vitest invocation. CI (Linux) is not
  affected.
- Unit tests always pass an explicit `processEnv` and `dotenvPath`, so the developer's real `.env`
  is never read.

## T8 — Prove the unit suite needs no environment variables

Date: 2026-10-07 · Covers: RF-7 / TC-000-12

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/setup/vitest-runner.test.ts | UPDATED | TC-000-12 (boundary group) |
| tests/fixtures/vitest/no-env/config-import.test.ts | NEW | Imports `src/config/env` and `src/errors/messages` and calls `loadEnv()` with no variables and no `.env` |
| tests/fixtures/vitest/no-env/vitest.config.mts | NEW | Own config so the repository config does not exclude the fixture |

### Test run
Command: `node node_modules/vitest/vitest.mjs run tests/unit/setup/vitest-runner.test.ts -t "TC-000-12"` (real Node binary)
Result: 1 passed · 0 failed · 2 skipped by the `-t` filter
Tests first: TC-000-12 failed before the fixture existed.
Regression: `npm run test:unit` → 21 passed (T1–T8)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/setup/vitest-runner.test.ts -t "TC-000-12"` passes | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The child Vitest gets only OS variables (`buildChildEnv` allowlist) and runs in a folder
  without `.env`. It exits 0 with no "Missing required environment variable" message, as
  TC-000-12 expects.
- Finding: Vite sets `process.env.BASE_URL = "/"` inside every Vitest run (its own base path).
  The fixture first asserted that all six RF-13 variables were unset and failed on BASE_URL. The
  fixture now asserts only that API_BASE_URL and the TEST_USER_* variables are unset. The TC
  assertions (exit 0, no missing-variable message) are unchanged.
  Consequence: unit tests that need BASE_URL must inject it explicitly, as
  `tests/unit/config/env.test.ts` does. Child processes started by `run-cli.ts` do not inherit
  it.

## T9 — Add .env.example and its sync check

Date: 2026-10-07 · Covers: RF-18, RF-19 / TC-000-29, TC-000-30, TC-000-31, TC-000-32

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/config/env-example.test.ts | NEW | TC-000-29 to TC-000-32 |
| .env.example | NEW | The six RF-13 variables. The public demo site URLs for BASE_URL and API_BASE_URL; `<placeholder>` for the TEST_USER_* variables |
| tests/fixtures/env/example-missing/.env.example | NEW | TC-000-32: TEST_USER_2_PASSWORD missing |
| tests/fixtures/env/example-extra/.env.example | NEW | TC-000-32: extra TEST_EXTRA |
| src/config/env.ts | UPDATED | Outside the file list: `findEnvExampleDrift(content)` → `{ missing, unexpected }`. It sits next to `ENV_VARIABLE_NAMES`, the single source of the RF-13 list |
| tests/unit/helpers/run-cli.ts | UPDATED | Outside the file list: `runCommand(command, args)` for non-Node executables (`git check-ignore` in TC-000-30). `runNodeScript` now delegates to it |

### Test run
Command: `node node_modules/vitest/vitest.mjs run tests/unit/config/env-example.test.ts -t "TC-000-(29|3[0-2])"` (real Node binary, because of the `|`)
Result: 4 passed · 0 failed · 0 skipped
Tests first: all 4 failed (files missing) before the implementation.
Regression: `npm run test:unit` → 25 passed (T1–T9)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/config/env-example.test.ts -t "TC-000-(29\|3[0-2])"` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- TC-000-29 accepts three kinds of value: empty, `<...>`, or one of the two public demo site URLs
  (allowed by the TC). Any other value fails the test, so a real email or password pasted by
  mistake is caught.
- TC-000-30 asks git itself (`git check-ignore --no-index`), so it follows the real `.gitignore`
  rules: `.env` is ignored, and `.env.example` is re-included by `!.env.example`.
- RF-19 is enforced by the unit suite. TC-000-31 runs on the real `.env.example` on every
  `npm run test:unit`, so drift fails the suite, naming the variable.

## T10 — Implement the redaction helper and the failure message builders

Date: 2026-10-07 · Covers: RF-20, RF-21 / TC-000-33, TC-000-34, TC-000-35

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/security/redaction.test.ts | NEW | TC-000-33, TC-000-34, TC-000-35 |
| src/security/redact.ts | NEW | `SENSITIVE_ENV_VARIABLES` (the two passwords), `getSensitiveValues(env, tokens)`, `redact(text, values)` → `[REDACTED]`, plain and URL-encoded, longest first |
| src/errors/messages.ts | UPDATED | Builders for RF-53 (page unavailable), RF-55 (non-200, names TEST_USER_EMAIL), RF-56 (no valid token), RF-57 (API unreachable). The RF-17 builder comes from T7 |

### Test run
Command: `node node_modules/vitest/vitest.mjs run tests/unit/security/redaction.test.ts -t "TC-000-3[3-5]"`
Result: 3 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before `src/security/redact.ts` existed.
Regression: `npm run test:unit` → 28 passed (T1–T10)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/security/redaction.test.ts -t "TC-000-3[3-5]"` passes (3 tests) | PASS |
| Test review checklist | PASS (the Arrange of TC-000-33 was simplified during review) |
| Typecheck (`npm run typecheck`) | PASS |
| Lint (`npm run lint`) | PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The message builders take no email or password parameter, so they cannot print one by design.
  TC-000-35 still checks every built message against both configured emails, and checks that
  RF-55 names `TEST_USER_EMAIL` and the status code.
- Wording of the RF-55 message, which the spec does not fix:
  "Login API returned status <code> for the account in TEST_USER_EMAIL".
- `redact` also covers URL-encoded forms, which `check:secrets` (T28) needs for RF-23.

## T11 — Implement the TEST_ data factory

Date: 2026-10-07 · Covers: RF-44, RF-45 / TC-000-66, TC-000-67, TC-000-68

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/data/test-data-factory.test.ts | NEW | TC-000-66, TC-000-67, TC-000-68 |
| src/data/test-data-factory.ts | NEW | `TEST_DATA_PREFIX`, `uniqueValue(base, workerId, clock = Date.now)` |

### Test run
Command: `npx vitest run tests/unit/data/test-data-factory.test.ts -t "TC-000-6[6-8]"`
Result: 3 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the factory existed.
Regression: `npm run test:unit` → 31 passed (T1–T11)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/data/test-data-factory.test.ts -t "TC-000-6[6-8]"` passes (3 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Format: `TEST_<base>_w<workerId>_<timestamp>_<sequence><runSuffix>`.
  - The per-process sequence covers several calls in the same millisecond (TC-000-68).
  - The worker ID separates parallel workers (TC-000-67).
  - A 4-hex-character random run suffix separates two runs started in the same millisecond.
- The suffix has a fixed length, so `<sequence><runSuffix>` cannot produce the same string for
  two different sequence numbers.

## T12 — Add the login URL builder and the time budget constants

Date: 2026-10-07 · Covers: RF-52 / TC-000-77

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/smoke/login-url.test.ts | NEW | TC-000-77 |
| src/config/urls.ts | NEW | `LOGIN_ROUTE`, `AUTH_LOGIN_PATH`, `joinUrl`, `buildLoginUrl`, `buildAuthLoginUrl` |
| src/config/timeouts.ts | NEW | `NAVIGATION_TIMEOUT_MS`, `API_TIMEOUT_MS` (30,000 ms each; checked by TC-000-79 and TC-000-85) |

### Test run
Command: `npx vitest run tests/unit/smoke/login-url.test.ts -t "TC-000-77"`
Result: 1 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before `urls.ts` existed.
Regression: `npm run test:unit` → 32 passed (T1–T12)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/smoke/login-url.test.ts -t "TC-000-77"` passes | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- `joinUrl` also strips leading slashes from the relative part. The same helper builds the API
  login URL (`{API_BASE_URL}/auth/login`, RF-54), so both URLs follow one rule.

## T13 — Implement the login response checks, the schema and AuthClient

Date: 2026-10-07 · Covers: RF-54, RF-55, RF-56, RF-57 / TC-000-81, TC-000-82, TC-000-83, TC-000-84, TC-000-85

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/smoke/login-response.test.ts | NEW | TC-000-81 to TC-000-85 (stubbed HTTP layer) |
| src/api/auth-client.ts | NEW | `AuthClient(request, apiBaseUrl).login(credentials)`; `LoginRequestContext` is the structural subset of Playwright's `APIRequestContext` |
| src/api/login-response.ts | NEW | `LoginHttpResponse`, `assertLoginResponse`, `classifyNetworkError` |
| src/api/schemas/login-response.schema.ts | NEW | `loginResponseSchema` (zod) |

### Test run
Command: `npx vitest run tests/unit/smoke/login-response.test.ts -t "TC-000-8[1-5]"`
Result: 5 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before `auth-client.ts` existed.
Regression: `npm run test:unit` → 37 passed (T1–T13)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/smoke/login-response.test.ts -t "TC-000-8[1-5]"` passes (5 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- `src/` holds no runtime import of Playwright: the client depends on two small structural
  interfaces, so unit tests can pass plain stubs and RF-29 stays clean.
- Network errors are classified by the Node.js system error code (`E[A-Z]+`) in the error message.
  A message about a timeout becomes `timeout`; anything else becomes `unknown network error`.
- The content type in the RF-56 message drops parameters (`text/html; charset=utf-8` →
  `text/html`), as the expected text of TC-000-82 requires.
- `// TODO: VERIFY` the exact error texts Playwright gives for DNS, refused-connection and timeout
  failures, during the real-API run in T17. The classifier only needs the code or the
  word "timeout".

## T14 — Build the Playwright config: projects, reporters, retries and tracing

Date: 2026-10-07 · Covers: RF-8, RF-9, RF-10, RF-11, RF-25, RF-46, RF-47, RF-48, RF-49 / TC-000-40, TC-000-69, TC-000-71, TC-000-72

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/reporting/reporters.test.ts | NEW | TC-000-69, TC-000-71, TC-000-72 |
| tests/unit/reporting/tracing.test.ts | NEW | TC-000-40 |
| src/config/playwright-options.ts | NEW | `buildPlaywrightConfig`, `resolveRetries`, `isProjectRequested`, project and report constants |
| playwright.config.ts | NEW | Wraps the builder with `loadEnv()` and `process.argv` |

### Test run
Command: `npx vitest run tests/unit/reporting -t "TC-000-(40|69|7[12])"` (run with the real Node binary, because of the `|`)
Result: 4 passed · 0 failed · 0 skipped
Tests first: both files failed (module not found) before the builder existed.
Regression: `npm run test:unit` → 41 passed (T1–T14)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/reporting -t "TC-000-(40\|69\|7[12])"` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS (after fixing test-helper typing: an unsafe cast and an untyped `fromEntries`) |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The builder has no runtime import of Playwright, only `import type`. Browsers are selected with
  `use.browserName`, and msedge with `channel: 'msedge'`, instead of `devices[...]`. Vitest can
  therefore check the config without loading Playwright Test.
- The `api` project uses `testDir: ./tests/api`. The browser projects use `./tests` with
  `testMatch` on `ui/` and `mocked/` folders, so API tests run once and never in a browser
  project (RF-11).
- A `json` reporter (`reports/results.json`) is added for the flaky summary (RF-51, T23).
  `forbidOnly` is on in CI.
- `npx playwright test --list` lists 0 tests for now. The first Playwright tests arrive in T15.

## T15 — Create LoginPage, the Playwright fixtures and the UI sanity test

Date: 2026-10-07 · Covers: RF-8, RF-52, RF-53 / TC-000-76

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/login-page.spec.ts | NEW | TC-000-76 (`@smoke @regression @ui @critical`) |
| src/pages/login-page.ts | NEW | `LoginPage`: `emailInput`, `passwordInput`, `loginButton` (all `getByRole` + accessible name, `exact: true`); `open({ timeoutMs })` → RF-53 message on HTTP ≥ 400 or `TimeoutError` |
| src/pages/login-page.constants.ts | NEW | `LOGIN_FORM` accessible names |
| src/fixtures/test.ts | NEW | `test` with the `loginPage` fixture; `expect` re-exported |

### Test run
Command: `npx playwright test tests/ui/login-page.spec.ts --project=chromium --project=firefox --project=webkit`
Result: 3 passed · 0 failed · 0 skipped (chromium 4.9 s, webkit 7.4 s, firefox 19.7 s; real site)
Regression: `npm run test:unit` → 41 passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/login-page.spec.ts --project=chromium --project=firefox --project=webkit` passes (TC-000-76 on 3 browsers); locator names verified on the live page | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- `// TODO: VERIFY` resolved. The live page was probed with a one-off accessibility snapshot
  (no credentials). The visible "Email" and "Password" labels are not linked to their inputs.
  The accessible names therefore come from the placeholders: textbox "email@example.com",
  textbox "enter your passsword" (the site's own typo) and button "Login".
- Deviation from plan.md: the password input uses `getByRole('textbox', { name })` instead of
  `getByLabel`. `getByLabel` would find nothing because the label is not linked, while
  Playwright exposes the password input as a named textbox. `getByRole` is the top priority in
  constitution #4.
- Tests first: the test was written before the Page Object and fixture in the same step. A red run
  was not captured separately, because the spec file cannot compile without the fixture module.
- The fixture reads BASE_URL lazily. Validation of BASE_URL when the config loads comes in T18.

## T16 — Add the mocked unavailable and timeout login page tests

Date: 2026-10-07 · Covers: RF-52, RF-53 / TC-000-78, TC-000-79

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/mocked/login-page-unavailable.spec.ts | NEW | TC-000-78, TC-000-79 (`@regression @mocked`) |
| src/pages/login-page.ts | REUSED | `open({ timeoutMs })` from T15 |

### Test run
Command: `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium; network fully mocked with `page.route('**/*')`)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- TC-000-79 passes a short named budget (`MOCKED_NAVIGATION_TIMEOUT_MS = 2_000`) to
  `LoginPage.open`, so the test finishes in about 3 s. A separate assertion checks that the
  production constant `NAVIGATION_TIMEOUT_MS` is 30,000 ms, as the TC requires.
- Both tests assert the full RF-53 message, including the URL built from BASE_URL. They would fail
  if `open()` ignored the status or let a plain Playwright timeout through.
- The timeout case leaves the routed request unanswered (`page.route('**/*', () => undefined)`).
  Playwright closes it with the page at teardown.

## T17 — Add the API sanity test with account A

Date: 2026-10-07 · Covers: RF-22, RF-26, RF-54, RF-55, RF-56, RF-57 / TC-000-80

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/auth-login.spec.ts | NEW | TC-000-80 (`@smoke @regression @api @critical`) |
| src/fixtures/test.ts | UPDATED | `authClient` and `accountA` fixtures; credentials read inside the fixture (RF-17) |
| src/api/auth-client.ts | REUSED | `login()` from T13; the zod contract and the RF-55/56/57 messages apply to the real call |

### Test run
Command: `npx playwright test tests/api/auth-login.spec.ts --project=api`
Result: 1 passed · 0 failed · 0 skipped (`api` project, real API, 907 ms)
Artifacts: `test-results/` has no trace and no attachment for the test. A one-off scan of
`reports/`, `playwright-report/` and `test-results/` (4 files) found 0 occurrences of either
password, plain or URL-encoded. Only counts were printed.

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/auth-login.spec.ts --project=api` passes (TC-000-80) and no trace or body attachment exists for it under `test-results/` | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The test asserts the token's shape (a non-empty string), never its value, so the token cannot
  appear in an assertion message.
- The plan listed this as a ui-level dependency (T15). Only the shared fixture file was reused;
  the API test needs no browser.
- `// TODO: VERIFY` (from T13): the real Playwright error texts for DNS, refused-connection and
  timeout failures cannot be produced against the live site without breaking it. They will be
  observed in the manual validation (TC-000-94 and an unreachable-host run). The classifier relies
  only on the error code or the word "timeout".

## T18 — Stop the run on invalid base URLs

Date: 2026-10-07 · Covers: RF-16 / TC-000-26, TC-000-27

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/config/base-url-validation.test.ts | NEW | TC-000-26, TC-000-27 |
| src/config/env.ts | UPDATED | `BASE_URL_VARIABLES`, `validateBaseUrls(env)`: missing/blank → RF-17-style missing message; not an absolute http(s) URL → invalid message; both name the variable |
| src/errors/messages.ts | UPDATED | Outside the file list: `invalidBaseUrlMessage` keeps every message in one file |
| playwright.config.ts | UPDATED | Calls `validateBaseUrls` before `defineConfig` |
| tests/unit/helpers/run-cli.ts | UPDATED | Outside the file list: `runPlaywright` (CLI + repository config + empty temp cwd), reused by T19–T21 |

### Test run
Command: `npx vitest run tests/unit/config/base-url-validation.test.ts -t "TC-000-2[67]"`
Result: 2 passed · 0 failed · 0 skipped (11 real Playwright CLI runs)
Tests first: TC-000-27 failed (the run started with invalid URLs) before the validation existed.
Regression: `npm run test:unit` → 43 passed (T1–T18); `npx playwright test --list` with the real `.env` → 10 tests in 3 files

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/config/base-url-validation.test.ts -t "TC-000-2[67]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Validation runs when the config loads, not in `globalSetup`. Playwright prints the config
  error and exits non-zero before collecting tests, so even `--list` stops (as TC-000-27 requires).
- TC-000-27 runs 10 CLI processes. Its timeout is a named multiple of `CLI_TEST_TIMEOUT_MS`.
  The run took about 15 s locally.
- The invalid-URL message does not echo the value. BASE_URL is not sensitive, but the rule
  "name the variable, not the value" is kept uniform.

## T19 — Verify project selection, msedge opt-in and the single api run

Date: 2026-10-07 · Covers: RF-8, RF-9, RF-10, RF-11 / TC-000-14, TC-000-15, TC-000-16, TC-000-17, TC-000-18, TC-000-19

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/playwright/projects.test.ts | NEW | TC-000-14 to TC-000-19 (real `playwright test --list`, output parsed by `[project] › …` lines) |
| src/config/playwright-options.ts | REUSED | Project set and the msedge argv detection from T14; no change needed |

### Test run
Command: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-1[4-9]"`
Result: 6 passed · 0 failed · 0 skipped
Regression: `npm run test:unit` → 49 passed (T1–T19)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-1[4-9]"` passes (6 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The behavior already existed (T14), so the new tests passed on the first run. A mutation test
  showed they can fail: forcing msedge into every run made TC-000-17 fail. The change was then
  reverted, and the file is identical to T14's.
- `// TODO: VERIFY` resolved: msedge is detected in both CLI forms, `--project=msedge` (TC-000-16)
  and `--project msedge` (checked by hand: 3 tests listed).
- Listing needs no browser binaries, so the msedge tests work on machines without Edge.

## T20 — Verify tag selection with --grep

Date: 2026-10-07 · Covers: RF-12 / TC-000-20, TC-000-21

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/playwright/projects.test.ts | UPDATED | TC-000-20 (positive), TC-000-21 (negative) |

### Test run
Command: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-2[01]"`
Result: 2 passed · 0 failed · 6 skipped by the `-t` filter
Regression: `npm run test:unit` → 51 passed (T1–T20)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-2[01]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- Tags are set with Playwright's `tag` option, and `--grep` matches them. Playwright natively
  rejects an empty selection with "No tests found" and a non-zero exit code. The CI-level message
  "No tests found for SUITE=<value>" (RF-63) is added in T30.

## T21 — Verify a missing credential fails only the test that reads it

Date: 2026-10-07 · Covers: RF-13, RF-17 / TC-000-28

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/config/credential-isolation.test.ts | NEW | TC-000-28 (3 partitions, 3 real Playwright runs) |
| tests/fixtures/playwright/two-tests/playwright.config.ts | NEW | Minimal config: no browser, no retries, 1 worker |
| tests/fixtures/playwright/two-tests/credentials.spec.ts | NEW | Uses the real `src/fixtures/test.ts` |
| src/fixtures/test.ts | REUSED | The `accountA` fixture reads `requireEnv` inside the fixture (T17) |

### Test run
Command: `npx vitest run tests/unit/config/credential-isolation.test.ts -t "TC-000-28"`
Result: 1 passed · 0 failed · 0 skipped
Regression: `npm run test:unit` → 52 passed (T1–T21)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/config/credential-isolation.test.ts -t "TC-000-28"` passes | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The fixture project has its own config, without the BASE_URL validation, so the test isolates
  RF-17 from RF-16. Real runs always pass through `playwright.config.ts`.
- The fixture runs leave no artifacts in the repository; `test-results/` would be gitignored
  anyway.

## T22 — Verify reports on failure and traces on the first retry

Date: 2026-10-07 · Covers: RF-25, RF-46, RF-49 / TC-000-70, TC-000-41

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/reporting/reporters.test.ts | UPDATED | TC-000-70 |
| tests/unit/reporting/tracing.test.ts | UPDATED | TC-000-41 |
| tests/fixtures/playwright/failing/ | NEW | `playwright.config.ts` built with `buildPlaywrightConfig` + `api/failing.spec.ts` |
| tests/fixtures/playwright/retry-trace/ | NEW | Same config; api test and UI test that fail once (`test.info().retry`), plus a stable UI test (`page.setContent`, no network) |
| src/config/playwright-options.ts | UPDATED | Outside the file list: optional third parameter `BuildOptions { testsDir, outputDir }`. Defaults are unchanged, so TC-000-69 still sees `playwright-report` and `reports/junit.xml` |

### Test run
Command: `npx vitest run tests/unit/reporting -t "TC-000-(70|41)"` (run with the real Node binary because of the `|`)
Result: 2 passed · 0 failed · 4 skipped by the `-t` filter
Tests first: both failed before `BuildOptions` existed.
Regression: `npm run test:unit` → 54 passed (T1–T22); `npx playwright test --list` still lists the repository tests

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/reporting -t "TC-000-(70\|41)"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- The fixture projects reuse the real builder, so TC-000-70 and TC-000-41 check the real
  reporters, retries and tracing instead of a copy of them.
- The first (red) run, before `BuildOptions` existed, wrote reports into the fixture folders.
  Those generated, gitignored folders were deleted. Fixture runs now write only to temp folders.
- TC-000-41 runs a real chromium on local content (`page.setContent`). The unit suite therefore
  needs the browsers that `npm ci` installs (RF-1); in CI the Playwright image provides them
  (plan decision).
- Defect found and fixed during this task. The new fixture `retry-trace/ui/` matched the browser
  projects' `ui/` pattern, so `npx playwright test --list` on the repository showed 16 tests in 4
  files instead of 10 in 3.
  - Fix: the real config sets `testIgnore` to `tests/fixtures/`. It is not set for fixture
    configs, which live inside that folder.
  - Guard: TC-000-17 (`tests/unit/playwright/projects.test.ts`, UPDATED) now also asserts that
    the default run collects nothing from `tests/fixtures/`.
  - After the fix: 10 tests in 3 files.

## T23 — Mark flaky tests and print the flaky count

Date: 2026-10-07 · Covers: RF-50, RF-51 / TC-000-73, TC-000-74, TC-000-75

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/reporting/flaky.test.ts | NEW | TC-000-73, TC-000-74, TC-000-75 |
| src/fixtures/test.ts | UPDATED | `FLAKY_ANNOTATION` and the automatic `markFlaky` fixture: after a test passes on a retry, it adds the annotation `flaky: passed on retry N` |
| src/config/playwright-options.ts | UPDATED | `junit` reporter `embedAnnotationsAsProperties: true` |
| scripts/flaky-summary.ts | NEW | `flakySummary(jsonText)` → "Flaky tests: N" (from `stats.flaky`); the CLI prints it. A missing report prints "unknown" and exits 0 |
| scripts/lib/zip-reader.ts | NEW | `readZipEntries(buffer)`. Planned for T28 and brought forward, because TC-000-73 must read the HTML report's embedded zip; T28 reuses it |
| tsconfig.scripts.json | NEW | Emits `scripts/` and `src/` to `dist/` (gitignored) |
| package.json | UPDATED | `build:scripts`, `report:flaky` |
| tests/fixtures/playwright/flaky/, stable/ | NEW | Fixture projects (real builder + real `src/fixtures/test.ts`) |
| tests/fixtures/reports/one-flaky-of-three.json | NEW | JSON report fixture for TC-000-75 |

### Test run
Command: `npx vitest run tests/unit/reporting/flaky.test.ts -t "TC-000-7[3-5]"`
Result: 3 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before `flaky-summary.ts` existed.
Regression: `npm run test:unit` → 57 passed (T1–T23); `npm run report:flaky` → "Flaky tests: 0"; `npx playwright test --list` → 10 tests in 3 files

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/reporting/flaky.test.ts -t "TC-000-7[3-5]"` passes (3 tests); JUnit flaky representation verified | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check | N/A (available from T24) |

### Assumptions and findings
- `// TODO: VERIFY` resolved (notes for the plan in test-cases.md). Playwright 1.63's JUnit reporter
  has NO flaky marker: a test that passes on retry appears as a plain pass (`failures="0"`, no
  property). The planned fallback was applied: the automatic fixture annotates the test, and the
  JUnit reporter embeds annotations as `<property name="flaky" value="passed on retry 1">`.
- Only tests that use `src/fixtures/test.ts` get the JUnit mark. All repository Playwright tests
  do. The HTML and JSON reports mark flaky tests natively.
- The HTML report stores its data as a base64 zip in `<template id="playwrightReportBase64">`.
  TC-000-73 and TC-000-74 decode it with the zip reader and look for `"outcome":"flaky"`.

## T24 — Implement the spec:check parsers, title scanner and title rule

Date: 2026-10-07 · Covers: RF-31, RF-32, RF-40, RF-41 / TC-000-50, TC-000-51, TC-000-52, TC-000-65

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/spec-check/spec-check.test.ts | NEW | TC-000-50, TC-000-51, TC-000-52, TC-000-65 |
| tests/unit/spec-check/spec-check-fixture.ts | NEW | `SpecCheckRepo`: a temp copy of the valid fixture, with `write/replace/remove`; `vitestFile(titles)` |
| tests/fixtures/spec-check/valid/ | NEW | spec 900 (`test-cases-approved`, RF-1..RF-3), test-cases.md (TC-900-01/02 Automate Y, TC-900-03 N), `tests/unit/sample.test.ts`, `tests/ui/sample.spec.ts` |
| scripts/spec-check/parse-spec.ts | NEW | `parseSpec`, `SPEC_STATUSES`, `statusRank`, `SPEC_FOLDER` |
| scripts/spec-check/parse-test-cases.ts | NEW | `parseTestCases` (keeps duplicates, for RF-35) |
| scripts/spec-check/scan-titles.ts | NEW | `scanTestDeclarations`: `test`/`it` with modifiers; skipped scope from `describe.skip`; conditional `test.skip(cond)` ignored; describe titles never count |
| scripts/spec-check/rules.ts | NEW | `checkTraceability`: RF-31 (title starts with TC ID), RF-32 (unknown RF). Later tasks add the other rules |
| scripts/spec-check/run.ts | NEW | `runSpecCheck({ rootDir, write })` + CLI (`--root`, `--write`); skips `tests/fixtures/`; "No specs found" → exit 0 |
| package.json | UPDATED | `spec:check` = build scripts + `node dist/scripts/spec-check/run.js` |

### Test run
Command: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-(5[0-2]|65)"` (real Node binary because of the `|`)
Result: 4 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the checker existed.
Regression: `npm run test:unit` → 61 passed (T1–T24)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-(5[0-2]\|65)"` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check (first real run on the repository) | PASS: "spec:check passed (1 spec(s))", exit 0, with the rules active so far (RF-31, RF-32) |

### Assumptions and findings
- The tests run the checker in-process (`runSpecCheck`), as the plan says. `npm run spec:check`
  runs the same code compiled to `dist/`.
- The scanner finds declarations by their call shape, not by import: `test`/`it`, optionally
  with `only/skip/fixme/todo/fail/slow/concurrent`, plus a function argument. `test.step`,
  hooks and `test.use` are ignored.
- A non-literal title (template with substitutions, variable) is reported as
  `<non-literal title>` and fails RF-31, because it cannot be traced statically.

## T25 — Add the spec:check rules for missing, duplicate, unknown and skipped tests

Date: 2026-10-07 · Covers: RF-33, RF-34, RF-35, RF-36, RF-37 / TC-000-53, TC-000-54, TC-000-55, TC-000-56, TC-000-57

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/spec-check/spec-check.test.ts | UPDATED | TC-000-53 to TC-000-57 |
| scripts/spec-check/rules.ts | UPDATED | RF-33 (Automate Y without test; skip/fixme counts), RF-34 (one test per TC ID, all claimants named), RF-35 (TC defined twice, file named), RF-36 (TC ID of a nonexistent spec), RF-37 (skipped → warning). `TraceRow` / `TraceStatus` per TC × RF |
| scripts/spec-check/run.ts | UPDATED | `rows` in `SpecCheckResult` |

### Test run
Command: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-5[3-7]"`
Result: 5 passed · 0 failed · 4 skipped by the `-t` filter (the whole file: 9 passed)
Tests first: all 5 failed before the rules existed.
Regression: `npm run test:unit` → 66 passed (T1–T25)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-5[3-7]"` passes (5 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 17 errors, all "Automate: Y but no test" for exactly the TCs of tasks T26–T32 (TC-000-04/05, 38/39, 58–64, 86/87, 90–92, 95). No other violation. It must be green after T32 |

### Assumptions and findings
- A test whose title has a TC ID of an existing spec, but that the spec's test-cases.md does not
  define, is not an error. No RF requires it. It is noted here as a possible future rule.
- TC-000-54 reads the status from the in-memory rows. The same rows are written to
  `docs/traceability.md` in T27.

## T26 — Add the spec:check rules that depend on spec status

Date: 2026-10-07 · Covers: RF-38, RF-39 / TC-000-61, TC-000-62, TC-000-63, TC-000-64

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/spec-check/spec-check.test.ts | UPDATED | TC-000-61 to TC-000-64 (`spec status` group) |
| tests/unit/spec-check/spec-check-fixture.ts | UPDATED | `specFile(id, status, rfCount)`, `manualTestCasesFile(id, rfs)` |
| scripts/spec-check/rules.ts | UPDATED | RF-38: no test-cases.md is allowed only before `test-cases-approved`. RF-39: from `test-cases-approved` on, every RF needs a TC. Both use `statusRank`, so `implemented` and `validated` are checked too |

### Test run
Command: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-6[1-4]"`
Result: 4 passed · 0 failed · 9 skipped by the `-t` filter (whole file: 13 passed)
Tests first: TC-000-62 and TC-000-63 failed before the rules existed. TC-000-61 and TC-000-64
passed from the start; they guard against over-strict rules.
Regression: `npm run test:unit` → 70 passed (T1–T26)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-6[1-4]"` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 13 errors (17 − the 4 TCs added here), all "Automate: Y but no test" for TCs of T27–T32 |

### Assumptions and findings
- Fixture specs 901–905 use manual (Automate: N) test cases, so each test isolates the status
  rule and RF-33 cannot interfere.

## T27 — Add spec:check --write for the traceability matrix

Date: 2026-10-07 · Covers: RF-37, RF-42, RF-43 / TC-000-58, TC-000-59, TC-000-60

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/spec-check/spec-check-write.test.ts | NEW | TC-000-58, TC-000-59, TC-000-60 |
| scripts/spec-check/write-matrix.ts | NEW | `renderMatrix(rows)`: header + `\| Spec \| RF \| Test case \| Test file \| Status \|`, sorted by spec, RF number, TC. `writeMatrix(path, rows)` returns the error message |
| scripts/spec-check/run.ts | UPDATED | `TRACEABILITY_FILE`; with `--write` the matrix is written even when violations exist, then the run exits non-zero; a write failure adds "Cannot write docs/traceability.md: <reason>" |

### Test run
Command: `npx vitest run tests/unit/spec-check/spec-check-write.test.ts -t "TC-000-(5[89]|60)"` (real Node binary because of the `|`)
Result: 3 passed · 0 failed · 0 skipped
Tests first: all 3 failed before the writer existed.
Regression: `npm run test:unit` → 73 passed (T1–T27)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/spec-check/spec-check-write.test.ts -t "TC-000-(5[89]\|60)"` passes (3 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 10 errors, all "Automate: Y but no test" for TCs of T28–T32 |

### Assumptions and findings
- The assumption in test-cases.md ("`--write` writes even with violations, then exits non-zero") is
  implemented and locked in by TC-000-58.
- TC-000-60 makes the file read-only with `chmod 0o444`. On Windows this sets the read-only
  attribute and the write fails with EPERM; on Linux it fails with EACCES unless the job runs as
  root. `// TODO: VERIFY` in CI: the Playwright image runs as root by default, and root ignores
  file permissions. If TC-000-60 fails in CI for that reason, the test needs a different
  unwritable target (for example a path whose parent is a file).
- The repository's `docs/traceability.md` was not regenerated yet. That happens in T33, once
  every automated TC has its test.
- Intermittent failure observed, not reproduced. In the first full `npm run test:unit` after this
  task, TC-000-28 and TC-000-41 failed once (35 s and 42 s, about 3× their normal time). Both pass
  in isolation, and the next 4 full runs passed 73/73. Probable cause: machine load from several
  Playwright CLI processes spawned in parallel by the unit suite; not confirmed. Action:
  TC-000-28 now puts the full CLI output in its assertion messages (TC-000-41 already did), so a
  recurrence shows the cause. To be watched in every remaining full run and in T33. Code from
  T27 does not touch those tests.
- Files changed outside the list: tests/unit/config/credential-isolation.test.ts (diagnostic
  assertion messages only).

## T28 — Implement the zip reader and check:secrets

Date: 2026-10-07 · Covers: RF-22, RF-23, RF-24 / TC-000-38, TC-000-39

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/security/check-secrets.test.ts | NEW | TC-000-38, TC-000-39 |
| tests/unit/helpers/make-zip.ts | NEW | `makeZip(entries)`: deflated zip with valid CRCs (`zlib.crc32`) |
| scripts/check-secrets.ts | NEW | `scanArtifacts({ rootDir, secrets })` → `{ exitCode, findings: [{ file, variable }], output }`; the CLI reads the passwords through `loadEnv()` (`SENSITIVE_ENV_VARIABLES`) and notes any that are unset |
| scripts/lib/zip-reader.ts | REUSED | Created in T23 |
| package.json | UPDATED | `check:secrets` = build scripts + `node dist/scripts/check-secrets.js` |

### Test run
Command: `npx vitest run tests/unit/security/check-secrets.test.ts -t "TC-000-3[89]"`
Result: 2 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the scanner existed.
Real run: `npm run check:secrets` → "check:secrets passed: no sensitive value in 5 file(s)" (artifacts of the earlier UI/API smoke runs), exit 0
Regression: `npm run test:unit` → 75 passed (T1–T28)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/security/check-secrets.test.ts -t "TC-000-3[89]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 8 errors, all "Automate: Y but no test" for TCs of T29–T32 |

### Assumptions and findings
- The HTML report keeps its data as a base64 zip inside `index.html` (seen in T23). A plain text
  scan would miss a password stored there. The scanner therefore decodes every
  `data:application/zip;base64,…` payload and scans its entries (`index.html!<entry>`).
- Tokens are detected by JWT shape (`eyJ….eyJ….…`), as planned, because the token of a run is not
  known after the run. The shop's tokens are JWTs. A false positive is possible only on another
  JWT-shaped string, which is acceptable for a gate.
- Emails are not scanned. They are test identifiers, allowed in screenshots and traces (RF-21).
- Every file in the three folders is read, binaries included. Screenshots and videos are pixels,
  so a password shown on screen cannot be found as text in them. Keeping passwords out of UI
  login screenshots and traces is the auth spec's concern (spec Out of scope).

## T29 — Implement the Playwright image version check

Date: 2026-10-07 · Covers: RF-2 / TC-000-05

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/ci/playwright-image-version.test.ts | NEW | TC-000-05 (TC-000-04 is added in T32) |
| scripts/lib/playwright-version.ts | NEW | `playwrightImages(ciText)` (every `mcr.microsoft.com/playwright:v<x>` reference), `lockedPlaywrightVersion(lockfileText)` (`packages["node_modules/@playwright/test"].version`), `checkImageVersion(image, installed)` |

### Test run
Command: `npx vitest run tests/unit/ci/playwright-image-version.test.ts -t "TC-000-05"`
Result: 1 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the module existed.
Regression: `npm run test:unit` → 76 passed (T1–T29)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/ci/playwright-image-version.test.ts -t "TC-000-05"` passes | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 7 errors (TCs of T30–T32) |

### Assumptions and findings
- No fixture files were needed under `tests/fixtures/ci/` for TC-000-05. The TC's synthetic image
  tag and version are inline constants.

## T30 — Implement the manual-run suite selector

Date: 2026-10-07 · Covers: RF-60, RF-61, RF-62, RF-63 / TC-000-90, TC-000-91, TC-000-92

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/ci/ci-run-suite.test.ts | NEW | TC-000-90, TC-000-91, TC-000-92 |
| scripts/ci-run-suite.ts | NEW | `selectRun(env)` → `--grep @<suite> --project=api --project=<browser…>` or "Unsupported <VAR>=\"<value>\": allowed values are …"; `runSuite(env, runner)` refuses 0 tests; `countListedTests(json)`; the CLI lists with `--list --reporter=json`, then runs |
| package.json | UPDATED | `ci:run-suite` |

### Test run
Command: `npx vitest run tests/unit/ci/ci-run-suite.test.ts -t "TC-000-9[0-2]"`
Result: 3 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the selector existed.
Real listing (nothing executed): smoke + chromium → 2 tests (UI + API sanity); regression + chromium → 4 tests (UI, 2 mocked, API)
Regression: `npm run test:unit` → 79 passed (T1–T30)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/ci/ci-run-suite.test.ts -t "TC-000-9[0-2]"` passes (3 tests) | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 4 errors (TCs of T31–T32) |

### Assumptions and findings
- Values are case-sensitive (`Smoke` is rejected, as TC-000-91 requires). The error repeats the
  rejected value, which is a pipeline option and not sensitive.
- The allowed browser values come from `DEFAULT_BROWSER_PROJECTS` in the Playwright config
  builder, so CI and local runs cannot drift apart.

## T31 — Implement the CI script check for environment printing

Date: 2026-10-07 · Covers: RF-65 / TC-000-95

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/ci/gitlab-ci.test.ts | NEW | TC-000-95 (TC-000-86/87 are added in T32) |
| scripts/check-ci-scripts.ts | NEW | `findEnvPrinting(content, file)` → `[{ file, line, command }]`; comment lines are skipped |
| tests/fixtures/ci/print-env/.gitlab-ci.yml | NEW | Three offending commands plus harmless `environment` words |

### Test run
Command: `npx vitest run tests/unit/ci/gitlab-ci.test.ts -t "TC-000-95"`
Result: 1 passed · 0 failed · 0 skipped
Tests first: the run failed (module not found) before the check existed.
Regression: `npm run test:unit` → 80 passed (T1–T31)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/ci/gitlab-ci.test.ts -t "TC-000-95"` passes | PASS |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | FAIL, as expected: 3 errors (TC-000-04, 86, 87 of T32) |

### Assumptions and findings
- "Or equivalent" (RF-65) is read as: shell tracing with combined flags (`set -ex`, `set -euxo`),
  `export -p` and `declare -p`/`-x`. `env VAR=x cmd` only sets a variable for one command and is
  allowed.
- The fixture also contains `environment:` and `$CI_ENVIRONMENT_NAME`. Because the test expects
  exactly three findings, it also proves those are not false positives.

## T32 — Write the eyter_dev GitLab pipeline

Date: 2026-10-07 · Covers: RF-2, RF-58, RF-59, RF-64, RF-65, RF-66, RF-67 / TC-000-86, TC-000-87, TC-000-04

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| .gitlab-ci.yml | NEW | Stages `check` (spec-check, lint, typecheck, unit) → `smoke` (smoke-api, smoke-ui-chromium) → `scan` (check-secrets-api, check-secrets-ui-chromium). Push rule: `eyter_dev` only. Manual run: `run-suite` + `check-secrets-run-suite`. Templates `.push-gate`, `.manual-run`, `.playwright-reports` (`report:flaky`, artifacts `when: always`, `expire_in: 7 days`, `reports: junit`), `.check-secrets`. Image `mcr.microsoft.com/playwright:v1.63.0-noble` |
| tests/unit/ci/gitlab-ci.test.ts | UPDATED | TC-000-86, TC-000-87, TC-000-04 (top-level block parser, text only) |
| specs/000-framework-foundation/spec.md | UPDATED (Mode C, approved by the user) | NFR "Stack": CI uses the Node of the Playwright image (24 for 1.63) instead of "Node 20 LTS"; `@types/node` added to the dependencies. Resolved clarification 9 |
| specs/000-framework-foundation/test-cases.md | UPDATED (Mode C, approved by the user) | TC-000-60 preconditions and steps: the unwritable `docs/traceability.md` is a folder, not a read-only file |
| tests/unit/spec-check/spec-check-write.test.ts | UPDATED | TC-000-60 follows the new test data (EISDIR); `chmod` removed |

### Test run
Command: `npx vitest run tests/unit/ci -t "TC-000-(0[45]|8[67]|95)"` (real Node binary because of the `|`)
Result: 5 passed · 0 failed · 3 skipped by the `-t` filter
Mutation checks: image tag changed to v1.62.0 → TC-000-04 fails; first `when: always` removed → TC-000-86 fails. Both reverted; the file is byte-identical to the original.
Regression: `npm run test:unit` → 83 passed (T1–T32)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/ci -t "TC-000-(0[45]\|8[67]\|95)"` passes (5 tests); Node of the Playwright image recorded | PASS: Node 24 (`ARG NODE_VERSION=24` in Playwright v1.63.0 `utils/docker/Dockerfile.noble`); spec updated through Mode C |
| Test review checklist | PASS |
| Typecheck / Lint | PASS / PASS |
| spec:check on the repository | PASS: "spec:check passed (1 spec(s))", 0 errors — every Automate Y TC now has its test |

### Assumptions and findings
- `// TODO: VERIFY` resolved. The Playwright 1.63.0 noble image installs Node 24, runs as root, and
  sets `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, so `postinstall` finds the browsers and
  downloads nothing. Two conflicts followed, and the user resolved both through Mode C (spec
  first, then code):
  1. The NFR said "CI uses Node 20 LTS". It now says CI uses the image's Node.
  2. TC-000-60's read-only file would not fail for root. The target is now a folder.
- Tests first was not followed for the CI file: `.gitlab-ci.yml` was written before its tests.
  The mutation checks above show the tests catch real defects.
- check:secrets runs as one job per Playwright job (`needs` with that job's artifacts). Both smoke
  jobs produce `reports/junit.xml` and `playwright-report/index.html`; one scan job downloading both
  would let one overwrite the other before the scan.
- RF-59 (a failing job fails the pipeline) is GitLab's default: no job has `allow_failure`. It is
  observed manually in TC-000-89 during validation.
- RF-64 (masked and protected TEST_USER_* variables) is a GitLab setting checked in TC-000-93.
  Pending user action from the spec phase: switch the four variables to Masked.
- `variables:` sets `SUITE=smoke` and `BROWSER=chromium` as defaults for the "Run pipeline" form;
  they only affect `run-suite`.

## T33 — Document setup and run the full local gate

Date: 2026-10-07 · Covers: RF-1, RF-40, RF-42 (repository run) / no new TCs

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| README.md | UPDATED | Setup, commands, reports, "Good to know" (`CI=true` locally, account A recovery, Windows/Volta `|` note), CI/CD summary |
| docs/traceability.md | REGENERATED | `npm run spec:check -- --write` |

### Test run (full local gate)
| Command | Result |
|---------|--------|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run test:unit` | 83 passed · 0 failed |
| `npm run spec:check` | "spec:check passed (1 spec(s))", exit 0 |
| `npm run spec:check -- --write` | 140 rows: 126 automated, 14 manual, 0 missing; 67 RFs, exit 0 |
| `npx playwright test --grep @smoke --project=api --project=chromium` | 2 passed (TC-000-80, TC-000-76) |
| `npx playwright test` | 10 passed (api + chromium/firefox/webkit, incl. mocked tests) |
| `npm run check:secrets` | passed, exit 0 |
| `npm run report:flaky` | Flaky tests: 0 |

### Quality gates
| Gate | Result |
|------|--------|
| Done when (all commands above) | PASS |
| Test review checklist | PASS (no test changed in this task) |
| Lint / spec:check | PASS / PASS |

### Assumptions and findings
- Manual TCs (TC-000-01, 02, 36, 37, 88, 89, 93, 94) appear as `manual` in the matrix. They are
  executed in the validation phase (GitLab pipeline, clean install, Node 18, masked variables,
  intentionally failing runs).
- The intermittent failure seen once in T27 (TC-000-28 / TC-000-41 under load) did not recur in
  any of the 8 full unit runs since. Still to watch in CI.
- AGENTS.md still says "Until then there is nothing to run" under Commands. It was left
  unchanged because it is the user's rules file; proposed to the user.

## Post-implementation fixes (before the first commit)

Date: 2026-10-08

| File | Change | Reason |
|------|--------|--------|
| .gitignore | `reports/` → `/reports/` | The unanchored pattern also ignored `tests/fixtures/reports/`. TC-000-75's fixture would never have been committed, and the test would fail in CI. Only the root `reports/` (generated output) is ignored now |
| AGENTS.md | Removed "Defined in Spec 000 — framework-foundation. Until then there is nothing to run." | The commands exist now (approved by the user) |

Pre-commit secret check: none of the 4 real TEST_USER_* values from `.env` (emails and
passwords, plain and URL-encoded) appears in the 134 files to be committed; `.env` is not tracked.
`npm run test:unit` → 83 passed.

## Fix after the first pipeline (#2924882205)

Date: 2026-10-08

The first eyter_dev pipeline failed in `unit`: 82 passed, 1 failed. spec-check, lint and
typecheck were green; the smoke and scan jobs were skipped.
- Failing test: TC-000-41, with "browserType.launch: Executable doesn't exist at
  /root/.cache/ms-playwright/…".
- Root cause: `tests/unit/helpers/run-cli.ts` starts child processes with an allowlisted
  environment that did not include `PLAYWRIGHT_BROWSERS_PATH`. The Playwright image installs its
  browsers in `/ms-playwright` and sets that variable, so the child looked in the default cache.
  Locally the default cache is where the browsers live, so the defect only showed in CI.
- Fix: `PLAYWRIGHT_BROWSERS_PATH` added to the allowlist. It says where browsers are installed and
  is not project data.
- Proof: with `PLAYWRIGHT_BROWSERS_PATH` pointing to a nonexistent folder, TC-000-41 now fails
  with that folder in the error, so the variable reaches the child. With the real path it passes.
  `npm run test:unit` → 83 passed; lint and typecheck PASS.
- This pipeline also showed RF-59 live: one failing job failed the pipeline, and the later
  stages were skipped. This is evidence for TC-000-89 in validation.

## Change after validation: missing tests are warnings until a spec is implemented

Date: 2026-10-08 · Spec change: clarification 11 (Mode C, approved by the user) · RF-33, RF-68

When Spec 001 test cases were approved, `spec:check` failed with 40 errors, one per
`Automate: Y` TC whose test is not written yet. RF-33 had no status condition, so the
`eyter_dev` pipeline would stay red for the whole implementation of every spec.
- Spec: RF-33 now fails only for specs with status `implemented` or later; new RF-68 reports the
  same gap as a warning before that. Traceability status stays `missing` in both cases (RF-42).
- Test cases: TC-000-53 renamed and its fixture spec set to `implemented`; new TC-000-96
  (warning before implementation); TC-000-58 test data now uses an `implemented` fixture spec,
  so its `missing` row is still a violation.
- Tests first: TC-000-96 failed before the change ("expected [ …error… ] to equal []").
- Code: `scripts/spec-check/rules.ts` pushes the missing-test message to `warnings` while the
  spec is earlier than `implemented`, and to `errors` from then on.

### Files changed
- `specs/000-framework-foundation/spec.md`, `specs/000-framework-foundation/test-cases.md`
- `scripts/spec-check/rules.ts`
- `tests/unit/spec-check/spec-check.test.ts` (TC-000-53, TC-000-96)
- `tests/unit/spec-check/spec-check-write.test.ts` (TC-000-58 fixture)
- `docs/traceability.md` (regenerated)

### Quality gates
- `npm run test:unit` → 84 passed, 0 failed.
- `npm run lint` and `npm run typecheck` → exit 0.
- `npm run spec:check -- --write` → "spec:check passed (2 spec(s))", with 40 warnings for the
  Spec 001 TCs that are not implemented yet.
- test-reviewer on the changed test files: PASS (TC ID first in each title, Arrange / Act /
  Assert, no magic values, behavior asserted through exit code, errors, warnings and rows).

## Change after validation: automatic promotion eyter_dev → release → main → production

Date: 2026-10-08 · Spec change: clarification 12 (Mode C, approved by the user) · RF-31, RF-59,
RF-69 to RF-77 · TC-000-86, 87, 97 to 110

- Spec: RF-69 to RF-71 define the release, main and production gates (docs/test-plan.md §6);
  RF-72 to RF-77 define the promotion. RF-31 accepts TC IDs with two or more digits, because
  Spec 000 reached TC-000-99.
- Tests first: TC-000-97 (spec:check), TC-000-102 to 108 (promotion script) and TC-000-86, 87,
  98 to 101 (CI definition) were written and failed before the code existed.
- Code:
  - `scripts/spec-check/rules.ts`, `scripts/spec-check/parse-test-cases.ts`: `TC-NNN-XX` with
    `XX` two or more digits.
  - `scripts/ci-promote.ts` (new, `npm run ci:promote`): next branch; "already up to date" via
    compare; reuse or create the merge request (`remove_source_branch: false`); wait up to 60 s
    for `mergeable`; merge with `sha` = pipeline commit and `should_remove_source_branch: false`.
    GitLab is behind an injectable `GitLabHttp` so unit tests use a stub; the token is only a
    request header and is never printed.
  - `.gitlab-ci.yml`: stages check → test → scan → promote. The check jobs run on the four
    branches; the eyter_dev, release, main and production Playwright gates each have their own
    check:secrets job. `promote` runs on pushes to eyter_dev, release and main with
    `when: on_success` and `resource_group: promotion`. No job has `allow_failure`.
- Docs: README CI/CD section (gate table and one-time `PROMOTION_TOKEN` setup).
- GitLab, checked read-only (names and flags only): the four branches are protected
  (Maintainers push and merge); "Pipelines must succeed" is off; `PROMOTION_TOKEN` does not exist
  yet. The user creates it before the first live promotion.

### Files changed
- `specs/000-framework-foundation/spec.md`, `specs/000-framework-foundation/test-cases.md`
- `scripts/ci-promote.ts` (new), `scripts/spec-check/rules.ts`, `scripts/spec-check/parse-test-cases.ts`
- `.gitlab-ci.yml`, `package.json` (`ci:promote`), `README.md`
- `tests/unit/ci/ci-promote.test.ts` (new), `tests/unit/ci/gitlab-ci.test.ts`, `tests/unit/spec-check/spec-check.test.ts`
- `docs/traceability.md` (regenerated)

### Quality gates
- `npm run test:unit` → 96 passed, 0 failed.
- `npm run lint` and `npm run typecheck` → exit 0.
- `npm run spec:check -- --write` → passed (2 specs); 0 `missing` rows for Spec 000; 40 warnings
  for Spec 001 TCs not implemented yet.
- test-reviewer on the changed test files: PASS. The lint error from an unused destructured
  variable was fixed; the gate tests were given explicit Arrange / Act / Assert blocks.
- Not yet run: TC-000-109 and TC-000-110 (manual, live pipelines). They need `PROMOTION_TOKEN`
  and the user's approval to push.

## Change after validation: TC-000-20 no longer fixes the smoke inventory

Date: 2026-10-08 · Spec change: Mode C approved by the user during Spec 001 T16 · RF-12 · TC-000-20

- Cause: TC-000-20 expected `--grep @smoke` to list exactly TC-000-76 and TC-000-80. Spec 001 adds
  its own approved smoke tests (TC-001-01, TC-001-33), so the test failed although RF-12 ("execute
  only tests tagged `@smoke`") still held.
- test-cases.md: the TC-000-20 expected result is now "Every listed test is tagged `@smoke`; the
  UI and API sanity tests are listed; mocked tests are excluded".
- tests/unit/playwright/projects.test.ts: TC-000-20 reads the tags from `--list --reporter=json`
  (the plain `--list` output has no tags). It asserts that every listed test carries `smoke`, that
  both sanity tests are present, and that the mocked tests are absent.
- `npm run test:unit` → 100 passed, 0 failed.

## Change after validation: GitHub mirror with GitHub Actions gates

Date: 2026-10-09 · Spec change: clarification 13 (Mode C, approved by the user with the plan) ·
RF-78 to RF-82 · TC-000-111 to 118

- Context: `origin` was switched to GitHub by the user; GitLab keeps the pipelines and the
  promotion. The user chose a mirror with tests: GitHub runs the same gates and never promotes;
  only `eyter_dev` is pushed there by hand; the user sets the GitHub secrets.
- Spec: RF-78 (same branch gates on GitHub), RF-79 (check:secrets after every Playwright job,
  upload only after a clean scan), RF-80 (manual run through `ci:run-suite`), RF-81 (secrets only,
  read-only permissions, no `continue-on-error`, no environment printing, no merge or push),
  RF-82 (Playwright image = locked version).
- Code: `.github/workflows/ci.yml` (new): `checks` matrix (spec:check, lint, typecheck,
  test:unit), then `smoke-api` and `smoke-ui-chromium` (eyter_dev), `release-regression`,
  `main-smoke`, `production-smoke` and `run-suite` (workflow_dispatch). Every job runs in
  `mcr.microsoft.com/playwright:v1.63.0-noble`; Playwright jobs set `HOME: /root` (Firefox in the
  container) and read the six variables from `${{ secrets.* }}`; no promote job.
- Tests: `tests/unit/ci/github-actions.test.ts` (new, TC-000-111 to 117), reading the workflow as
  text and reusing `findEnvPrinting` and `playwrightImages`/`lockedPlaywrightVersion`.
  Order note: the workflow was written before its tests (unlike clarification 12). To show the
  tests are not vacuous, three temporary mutations were applied and reverted: `continue-on-error`
  and `printenv` each failed TC-000-116, and an upload not gated on the scan failed TC-000-114.
- Verified before choosing where secrets go: `npm run test:unit` passes with no `.env` and none of
  the six variables (RF-7), so the `checks` job gets no secrets.
- The YAML parses (PyYAML `safe_load`: 7 jobs; triggers push and workflow_dispatch).
- Docs: README "GitHub mirror (GitHub Actions)"; AGENTS.md (CI checks list, mirror rules, CI
  change scope now includes the workflow).

### Files changed
- `specs/000-framework-foundation/spec.md`, `specs/000-framework-foundation/test-cases.md`
- `.github/workflows/ci.yml` (new), `tests/unit/ci/github-actions.test.ts` (new)
- `README.md`, `AGENTS.md`

### Quality gates
- `npm run test:unit -- tests/unit/ci` → 26 passed (19 earlier + 7 new); `npm run test:unit` → 107 passed.
- `npm run lint` (0 errors) and `npm run typecheck` → exit 0; `npm run spec:check` → passed (5 specs).
- test-reviewer on `github-actions.test.ts`: PASS (Arrange / Act / Assert, describes by scenario type).
- Not yet run: TC-000-118 (manual, live GitHub Actions run after the push).

## Change after validation: GitHub only (GitLab removed)

Date: 2026-10-09 · Spec change: clarification 14 (Mode C, approved by the user with the plan) ·
RF-58 to RF-82 · TC-000-04, 86 to 89, 93, 94, 98 to 110, 114 to 116, 118

- Context: the user stopped using GitLab and removed the `gitlab` remote. The user chose:
  - automatic promotion in GitHub Actions;
  - removing the GitLab files;
  - letting the promotion bring `release`, `main` and `production` up to date, with no
    manual push.
- First GitHub run (37918960715) failed: `checks (test:unit)` failed on TC-000-30 because `git`
  exited 128 in the container (dubious ownership of the checked-out workspace). Fixed by marking
  `$GITHUB_WORKSPACE` as a safe git directory after checkout in every job (RF-82).
- Spec:
  - RF-58 to RF-77 rewritten for GitHub Actions: encrypted secrets, JUnit kept in the artifacts,
    a merge through the GitHub merges API, and a fine-grained `PROMOTION_TOKEN`;
  - RF-78 to RF-82 are now the workflow rules;
  - the GitLab TCs are retargeted with the same IDs. TC-000-111, 112, 113 and 117 are removed
    because they duplicated TC-000-86, 98 to 100, 87 and 04.
- Code:
  - `.gitlab-ci.yml`, `tests/unit/ci/gitlab-ci.test.ts` and its print-env fixture deleted
    (`tests/fixtures/ci/print-env/ci.yml` replaces the fixture);
  - `scripts/ci-promote.ts` rewritten for GitHub: the source tip must equal `GITHUB_SHA`;
    compare `identical`/`behind` means up to date; `POST /merges` with `head` = tested SHA,
    where 201 is merged, 204 is up to date, and anything else fails with nothing merged;
  - `.github/workflows/ci.yml`:
    - `safe.directory` in every job;
    - `actions/checkout@v5` and `actions/upload-artifact@v5` (Node 24);
    - a new `promote` job: needs every other job, `!cancelled() && !failure()`, push on
      eyter_dev, release or main only, `concurrency: promotion`, `PROMOTION_TOKEN` from
      secrets;
  - GitLab wording removed from `scripts/ci-run-suite.ts`, `src/fixtures/test.ts` and
    `tests/unit/reporting/reporters.test.ts`.
- Tests:
  - `tests/unit/ci/ci-promote.test.ts` (TC-000-102 to 108) runs against a stub GitHub API;
  - `tests/unit/ci/github-actions.test.ts` now holds TC-000-04, 86, 87, 95, 98 to 101 and
    114 to 116;
  - four temporary mutations of the workflow, each reverted, were all caught: no failure guard,
    production promoting and `promote` not needing `run-suite` each failed TC-000-101, and a
    job without `safe.directory` failed TC-000-86.
- Docs: README and AGENTS.md now have a single "CI/CD (GitHub Actions)" section, and
  `docs/test-plan.md` §1, §6, §8 and §10 describe GitHub Actions.

### Files changed
- `specs/000-framework-foundation/spec.md`, `test-cases.md`, `implementation.md`, `validation.md`
- `.github/workflows/ci.yml`, `scripts/ci-promote.ts`, `scripts/ci-run-suite.ts`, `src/fixtures/test.ts`
- `tests/unit/ci/ci-promote.test.ts`, `tests/unit/ci/github-actions.test.ts`,
  `tests/unit/reporting/reporters.test.ts`, `tests/fixtures/ci/print-env/ci.yml` (new)
- Deleted: `.gitlab-ci.yml`, `tests/unit/ci/gitlab-ci.test.ts`, `tests/fixtures/ci/print-env/.gitlab-ci.yml`
- `README.md`, `AGENTS.md`, `docs/test-plan.md`, `docs/traceability.md` (regenerated)

### Quality gates
- `npm run test:unit -- tests/unit/ci` → 22 passed; `npm run test:unit` → 103 passed (26 files).
- `npm run lint` → 0 errors (10 pre-existing warnings in tests/api, none in CI files).
- `npm run typecheck` → exit 0; `npm run spec:check -- --write` → passed (5 specs).
- test-reviewer on the two CI test files: PASS (TC IDs in titles, Arrange / Act / Assert, describes
  by scenario type, stubbed HTTP only, `TEST_` data).
- Pending (live): TC-000-109 and 118 after the push, once `PROMOTION_TOKEN` is set.

## Change after validation: staged jobs, test summaries and results page (clarifications 15 to 17)

### T34 — Split the workflow into chained stage jobs
- Covers RF-58, RF-69 to RF-71, RF-78, RF-80, RF-83 / TC-000-86, 87, 98 to 101, 114 to 116, 119.
- Tests first: `tests/unit/ci/github-actions.test.ts` describes each branch chain with `gateChain()`
  (API job after `unit-tests`, then one UI job per browser after the previous one) and checks the
  exact `needs` of every job (`needsOf()`), the job conditions (`conditionOf()`: no `always()`,
  `cancelled()` or `failure()` outside `promote`) and `fail-fast: true` on `checks`. 9 tests red
  before the workflow change.
- `.github/workflows/ci.yml`: `checks` keeps spec:check, lint and typecheck; `unit-tests` is a new
  job; `smoke-api`, `smoke-ui-chromium`, `release-regression`, `main-smoke` and `production-smoke`
  are replaced by `eyter-dev-api`, `eyter-dev-ui-chromium`, `release-api`, `release-ui-{chromium,
  firefox,webkit}`, `main-api`, `main-ui-{chromium,firefox,webkit}`, `production-api` and
  `production-ui-chromium`, each running `npx playwright test --grep <tag> --project=<project>`.
  The push gates no longer use `ci:run-suite`; the manual `run-suite` still does, after `unit-tests`.
- Quality gates: CI tests 23 passed; unit suite 104 passed; lint 0 errors; typecheck exit 0;
  3 workflow mutations caught; test-reviewer PASS. `spec:check` reports the 15 TCs of T35 to T41
  as missing tests, as expected until those tasks are done.

### T35 — Implement the test summary script
- Covers RF-84, RF-87 / TC-000-120, 121, 122, 125, 135. Tests first (red: module missing), then
  `scripts/test-summary.ts` (`summarizeResults`, `renderSummary`, `formatDuration`, `runSummary`),
  same structure as `scripts/flaky-summary.ts`; `npm run report:summary -- --title <stage> [--report <file>]`.
- Format detection: Vitest JSON has `numTotalTests`, Playwright JSON has `stats`. Vitest duration is
  the run start to the last file end (files run in parallel).
- Note: on Windows, the Volta npm shim mangles arguments with spaces (`UI webkit` → `^UI^ webkit^`);
  `node dist/scripts/test-summary.js` prints it correctly, and CI runs on Linux.
- Quality gates: 5 tests passed; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T36 — Add unit-test code coverage
- Covers RF-85 / TC-000-123, 124. Tests first (red), then `npm install --save-dev --save-exact
  @vitest/coverage-v8@4.1.11` (approved), the `coverage` block in `vitest.config.mts` (the file is
  `.mts`; the test cases and plan said `.ts` and were corrected), `test:unit:ci`, and the coverage
  table in `scripts/test-summary.ts` (`--coverage <file>`).
- TC-000-124 reads `vitest.config.mts` as text: importing it inside a Vitest test fails
  (`Cannot find module …/vitest/config`).
- First real measurement: lines 52.43 %, branches 54.54 %, functions 39.49 %, statements 51.97 %.
  The number is lower than the code the tests exercise, because many unit tests run the CLIs
  (spec:check, check:secrets, Playwright, tsc) in child processes, which v8 coverage of the Vitest
  process does not see. Reported only; no threshold (RF-85).
- Quality gates: reporting tests 18 passed; `npm run test:unit:ci` 111 passed; lint 0 errors;
  typecheck exit 0; test-reviewer PASS.

### T37 — Add spec:check --summary
- Covers RF-86 / TC-000-126. Tests first (red), then `scripts/spec-check/summary.ts`
  (`requirementsSummary`, `automatedPercent`, `renderRequirementsSummary`) and the `summary` option
  of `runSpecCheck` (`--summary` on the CLI). Reuses the `TraceRow[]` of `checkTraceability`; a TC
  covering several RFs is counted once. The table is added whatever the check result.
- TC-000-126 now names the fixture specs actually used (900 and 901 instead of 001 and 002).
- Quality gates: spec-check tests 19 passed; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T38 — Wire the summaries into the workflow
- Covers RF-79, RF-84, RF-85, RF-86 / TC-000-127. Test first (red), then the workflow: the checks
  matrix gets `include: - task: spec:check, args: -- --summary` and runs
  `npm run ${{ matrix.task }} ${{ matrix.args }}`; only that leg scans and uploads `summary-checks`.
  `unit-tests` runs `npm run test:unit:ci` and summarizes results and coverage. Every Playwright job
  runs `report:summary` with its stage title (`"API @smoke"`, `"UI chromium @regression"`, …), and
  the manual job uses `"Manual run"`. Each job uploads `reports/summary.json` as `summary-<job>`
  after a clean `check:secrets`, for the results page (T39, T40).
- Quality gates: CI tests 24 passed; 2 mutations caught; lint 0 errors; typecheck exit 0;
  test-reviewer PASS.

### T39 — Implement the results page builder
- Covers RF-88 / TC-000-128, 129, 131, 134. The test file and the script were written in the same
  step, so no separate red run was recorded for this task (the test file imports the new module).
- `scripts/results-page.ts`: `stagesOf(branch)` (chain order of RF-83), `readSummaries()`,
  `branchEntry()`, `mergeResults()`, `fetchPrevious()` (injected fetcher), `escapeHtml()`,
  `renderPage()`, `buildResultsPage()`. Stage status comes from the publish job's
  `toJSON(needs)` (`NEEDS_JSON`), not from the summaries, so a spec:check failure marks the checks
  stage failed even though its summary exists. Results URL: `RESULTS_URL` or
  `https://<owner>.github.io/<repo>/results.json`.
- Quality gates: 4 tests passed; local run with real summaries passed and the output passed
  `check:secrets`; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T40 — Add the publish-results job
- Covers RF-81, RF-88 / TC-000-130. Tests first (TC-000-119 and TC-000-130 red), then the job.
- `publish-results` runs `if: ${{ always() && github.event_name == 'push' }}` after the 14 test jobs
  and gets their results through `NEEDS_JSON: ${{ toJSON(needs) }}`. Only this job has
  `pages: write` and `id-token: write`; the top-level permissions stay `contents: read`. `promote`
  now also needs it, so a failed publication stops the promotion (spec edge case: Pages not enabled).
- A mutation adding `pages: write` at the top level was not caught at first (TC-000-116 matches only
  the first permission line); TC-000-130 now requires the top-level block to be exactly
  `contents: read`.
- Requires the one-time maintainer setup of clarification 17 before the first push: repository
  public, Pages source GitHub Actions, `github-pages` environment allowing the four branches.
- Quality gates: CI tests 25 passed; 3 mutations caught; lint 0 errors; typecheck exit 0;
  test-reviewer PASS.

### T41 — Publish results and the manual-testing guide in the README
- Covers RF-89 / TC-000-132. Test first (red), then README.md ("Test results", "Running tests
  manually", CI/CD section, Pages setup), AGENTS.md (commands, CI table) and docs/test-plan.md (§6,
  §10). Badges link to each branch's runs; the results page link is
  https://eyter-higuera.github.io/ecommerce-playwright-claude-code-sdd/.
- Quality gates: unit 119 passed; CI 25 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); smoke 11 passed; check:secrets passed; test-reviewer PASS.
- Pending at validation: TC-000-136 (history scan, before the repository is made public), then the
  maintainer setup (public, Pages source GitHub Actions, `github-pages` environment branches), then
  TC-000-118, TC-000-133 and TC-000-110 on real runs.

## Change after validation: manual runs by layer, regression chain, VS Code tasks, bug log (clarifications 18 and 19)

### T42 — Add LAYER to the manual-run selector
- Covers RF-61, RF-62, RF-90 / TC-000-137 to 140 (TC-000-90 and 92 updated). Tests first (5 red),
  then `scripts/ci-run-suite.ts`: `selectRun()` returns `{ ok, unit, args? }`, `runSuite()` runs
  the unit tests first through the new `runUnit()` runner and stops on failure. LAYER unset = all,
  so `ci:run-suite` now also runs the unit tests by default.
- Quality gates: 7 tests passed; real API smoke through the selector passed; lint 0 errors;
  typecheck exit 0; test-reviewer PASS.

### T43 — Split the manual run into layer jobs and add the regression guard
- Covers RF-80, RF-83, RF-90, RF-92 / TC-000-141, 146 (TC-000-115, 119, 130, 101 updated). Tests
  first (9 red), then the workflow: `layer` and `chained` inputs; `manual-api` and `manual-ui`
  replace `run-suite`; the RF-92 guard is the first step of every `checks` leg, before checkout.
  `manual-ui` is the documented exception to the default job condition (`!cancelled() && !failure()`),
  so layer=ui runs although `manual-api` is skipped.
- Quality gates: CI tests 31 passed; 3 mutations caught; lint 0 errors; typecheck exit 0;
  test-reviewer PASS.

### T44 — Implement the regression chain
- Covers RF-81, RF-91 / TC-000-142, 143, 144. Tests first (red: module missing; TC-000-144 and
  TC-000-116 red), then `scripts/ci-chain.ts` (same structure as `ci-promote.ts`; reuses
  `nextBranch()` and the now exported `connectGitHub()`), `npm run ci:chain`, and the `chain-next`
  job. The dispatch uses the job's `GITHUB_TOKEN` (`permissions: actions: write`), read from
  `secrets.GITHUB_TOKEN` so RF-81 and TC-000-116 still hold. Whether that dispatch starts a run is
  verified live in TC-000-145 (spec TODO: VERIFY).
- Quality gates: CI tests 34 passed; 2 mutations caught; lint 0 errors; typecheck exit 0;
  test-reviewer PASS.

### T45 — Add the VS Code tasks
- Covers RF-93 / TC-000-148. Test first (red), then `.vscode/tasks.json` (plain JSON so the test
  can parse it) and `.vscode/extensions.json`. The local task passes the pickers as SUITE, BROWSER
  and LAYER environment variables, which works in PowerShell, cmd and bash alike.
- Quality gates: 1 test passed; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T46 — Add the bug log and its AGENTS.md rule
- Covers RF-95 / TC-000-151. Test first (red), then `docs/bug-log.md` with the legend and the 7
  failures already found and fixed (each with where it failed, where it passed, cause and commit),
  and step 4 of AGENTS.md "When finishing any task".
- Quality gates: 1 test passed; test-reviewer PASS.

### T47 — Document the manual runs in the README
- Covers RF-94 / TC-000-150. Test first (red), then README.md ("In VS Code", the manual GitHub run
  with `-f layer=` for the four branches, "Regression: it starts from eyter_dev", "Bug log"),
  AGENTS.md (commands, CI test list) and docs/test-plan.md §6.
- Quality gates: unit 131 passed; CI 34 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); check:secrets passed; test-reviewer PASS.
- Pending at validation: TC-000-145 (live regression chain), TC-000-147 (direct regression on
  release refused), TC-000-149 (each VS Code task run once).

## Change after validation: failure report and /fix-failure (clarifications 20 and 21)

### T48 — Implement the failure report and the local unit results
- Covers RF-90, RF-93, RF-96 / TC-000-152 to 157, 160, 161. Tests first (red: module missing),
  then `scripts/failure-report.ts` (`playwrightFailures`, `vitestFailures`, the GitHub run report
  through an injected `gh` runner, `failureReport`), `UNIT_RUN_ARGS` in `ci-run-suite.ts`, the
  `test:unit:report` and `report:failures` scripts, and the VS Code unit task.
- Playwright `file` is relative to `config.rootDir` (the tests folder) and attachment paths are
  absolute; both are shown relative to the repository. A real run showed that
  `gh run view --log-failed` prints colors as the caret text `^[[31m`; both that and the ESC form
  are removed (TC-000-155 covers it).
- TC-000-148 still expects the old unit-task command until T49 updates it.
- Quality gates: 8 tests passed; real local and GitHub reports checked; lint 0 errors; typecheck
  exit 0; test-reviewer PASS.

### T49 — Add the /fix-failure skill, its VS Code tasks and the README section
- Covers RF-93, RF-97 / TC-000-158 (TC-000-148 updated). Tests first (red), then the skill
  (`.claude/skills/fix-failure/SKILL.md`), the two VS Code tasks, README "When a test fails" and the
  skills row, and AGENTS.md commands. Claude Code lists the new skill as soon as the file exists.
- Quality gates: unit 140 passed; CI 34 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); check:secrets passed; test-reviewer PASS.
- Pending at validation: TC-000-159 (deliberate local failure handled end to end from VS Code).

## Change after validation: local-only VS Code tasks and test:branch (clarifications 22 and 23)

### T50 — Implement test:branch with worktrees outside the repository
- Covers RF-98 / TC-000-163 to 169, 172, 174. Tests first (red: module missing), then
  `scripts/run-branch.ts` (`worktreesDir()`, `runBranch()` with injected git, npm, selection,
  failure report and file operations) and `npm run test:branch`.
- The selection runs the main repository's compiled `ci-run-suite.js` with the worktree as working
  directory, so the branch's own tests, config and `node_modules` are used. npm runs through
  `npm_execpath` (no shell, no DEP0190 warning on Windows).
- Real run on release (api smoke): worktree created detached at `9c80fbc`, 5 passed, nothing
  started on GitHub.
- Quality gates: 9 tests passed; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T51 — Make the VS Code tasks local only and add report:failures --branch
- Covers RF-93, RF-96, RF-97 / TC-000-148, 158 (updated), 170 (new). Tests first (red), then
  `.vscode/tasks.json` (GitHub tasks removed, branch task added), `report:failures -- --branch`,
  `scripts/lib/worktrees.ts` (shared by run-branch.ts and failure-report.ts) and the skill note
  "fix in the main repository on eyter_dev".
- Quality gates: reporting and CI tests passed; lint 0 errors; typecheck exit 0; test-reviewer PASS.

### T52 — Document local manual tests and the GitHub manual run separately
- Covers RF-94 / TC-000-150. Test extended first (red), then README ("In VS Code" local only, the
  branch task, worktree location and `git worktree remove` cleanup; "In GitHub Actions" starts a
  pipeline from Actions or a terminal; `/fix-failure <branch>`), AGENTS.md and the bug-log rows.
- Quality gates: unit 151 passed; CI 44 passed; lint 0 errors; typecheck exit 0; spec:check passed;
  check:secrets passed; test-reviewer PASS.

## Change after validation: local workers and bug-log columns (clarification 24)

### T53 — Limit local Playwright runs to 2 workers
- Covers RF-99 / TC-000-175, TC-000-176. Tests first (red: `workers` undefined locally), then
  `LOCAL_WORKERS` and `resolveWorkers()` in `src/config/playwright-options.ts`; README "Good to know".
- Cause: a full local run (4 workers, all projects) failed 50 firefox and webkit tests from lack of
  memory; `--last-failed --workers=2` passed all 50 (bug log, 2026-10-10).
- Real check: `npx playwright test --project=api --grep @smoke` prints "Running 5 tests using 2 workers", 5 passed.
- Quality gates: unit 153 passed; lint 0 errors; typecheck exit 0; `spec:check -- --write` passed
  (5 specs); test-reviewer PASS.

### T54 — Add the Date column and the Cause and Solution columns to the bug log
- Covers RF-95 / TC-000-151 (updated). Test first (red on the old header), then `docs/bug-log.md`
  (header `| Date | Bug / failure | Passed ✅ | Failed ❌ | Cause | Solution |`, legend, the 11
  existing rows moved: where it failed → `Cause`, where it passed → `Solution`, dates from each
  run or commit), AGENTS.md, the `/fix-failure` skill step 6 and the README "Bug log" section.
- A red run of TC-000-151 from a test bug (date pattern without backslashes) was fixed and logged.
- Quality gates: docs tests 5 passed; unit 153 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); test-reviewer PASS.

## Change after validation: report and /fix-failure after VS Code runs (clarification 25)

### T55 — Implement test:local: report in the browser, then /fix-failure on failure
- Covers RF-100 / TC-000-177 to 183. Tests first (red: module missing), then `scripts/local-run.ts`
  (`localRun()` with injected run, branch, clock, files, browser opener and Claude starter) and
  `npm run test:local`. Reuses `worktreesDir()`, `HTML_REPORT_DIR`, `UNIT_RESULTS_FILE`, `BRANCHES`,
  `summarizeResults()` and `renderSummary()`.
- The browser opener is `explorer <file>` on Windows (no `start ""` quoting), `open` / `xdg-open`
  elsewhere, detached; Claude Code starts through the shell on Windows (`claude` is a .cmd shim).
- Real check inside Claude Code (`CLAUDECODE=1`): `LAYER=api SUITE=smoke npm run test:local -- ci:run-suite`
  ran 5 passed, opened nothing and started nothing; an unknown script is refused.
- Quality gates: 7 tests passed; CI tests 51 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); test-reviewer PASS.

### T56 — Point the VS Code run tasks to test:local and document it
- Covers RF-93, RF-98, RF-100 / TC-000-148, TC-000-150 (both updated). Tests first (red), then
  `.vscode/tasks.json` (the two run tasks call `npm run test:local -- ci:run-suite` and
  `-- test:branch`), README "After a run task finishes", AGENTS.md command.
- Two earlier bugs found and logged: TC-000-148's `gh` pattern had lost its backslashes and never
  matched anything; the README worktree paths had lost theirs too, one turned into a carriage
  return (commit `adafd4f`). TC-000-150 now requires the real path and no control character.
  Text with backslashes is written with the file-editing tools, not through shell scripts.
- Quality gates: unit 160 passed; CI 51 passed; lint 0 errors; typecheck exit 0;
  `spec:check -- --write` passed (5 specs); test-reviewer PASS.
