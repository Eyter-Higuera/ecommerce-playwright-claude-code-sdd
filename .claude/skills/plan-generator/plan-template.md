# Plan — Spec NNN <Feature name>

Status: draft
<!-- Allowed values: draft | approved -->
Spec: specs/NNN-<feature>/spec.md · Test cases: specs/NNN-<feature>/test-cases.md

## Context
<One paragraph: what this plan implements and the main technical approach.>

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ / ✘ | <new dependency? why?> |
| 2 | Spec first | ✔ / ✘ | |
| 3 | Separation of concerns | ✔ / ✘ | |
| 4 | Test quality | ✔ / ✘ | |
| 5 | Data and secrets | ✔ / ✘ | |
| 6 | Language | ✔ / ✘ | |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1 | TC-NNN-01, TC-NNN-02 | ui | tests/ui/<feature>.spec.ts |

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| LoginPage | src/pages/login-page.ts | <what it encapsulates> | getByRole('button', { name: LOGIN_BUTTON }) |

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|

## Fixtures and test data
<Fixtures to add or reuse; TEST_ data factories; accounts needed; cleanup strategy.>

## Mocking strategy
<What is mocked and how: vi.mock for unit tests, page.route() for UI error states. What hits the real environment.>

## Locator strategy
<Notes on available roles/labels/test ids; any justified CSS fallback; `// TODO: VERIFY` assumptions.>

## Test file layout, tags and browsers
<Files, describe groups by scenario type, tags per TC, browsers per TC.>

## Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|

## Risks
<Flakiness sources, environment limitations, data collisions, and mitigations.>

## Out of scope
<What this plan intentionally does not implement.>
