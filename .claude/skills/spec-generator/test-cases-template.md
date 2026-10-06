# Test Cases — Spec NNN <Feature name>

Source spec: specs/NNN-<feature>/spec.md · Ticket: <KEY or N/A> · Status: draft
<!-- Allowed values: draft | approved -->

## Coverage matrix
| RF   | Positive  | Negative  | Boundary  | Security  | Total |
|------|-----------|-----------|-----------|-----------|-------|
| RF-1 | TC-NNN-01 | TC-NNN-02 | TC-NNN-03 | —         | 3     |

## Test cases

### TC-NNN-01 — <Short behavior-focused title>
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1 |
| Priority        | P1 / P2 / P3 |
| Type            | Positive / Negative / Boundary / Security / Accessibility |
| Technique       | EP / BVA / Decision table / State transition / Error guessing / Pairwise |
| Layer           | unit / api / integration / mocked / ui |
| Tags            | @smoke @regression @critical |
| Browsers        | all / chromium only (reason) |
| Preconditions   | <Required state, e.g. logged-in TEST_ user with an empty cart> |
| Test data       | <TEST_ values or fixture name> |
| Steps           | **Given** <context> **When** <action> **Then** <observable result> |
| Expected result | <Measurable outcome: URL, message, value, status code> |
| Automate        | Y / N — <reason if N> |

## Out of scope for testing
- <What is not tested and why>

## Open questions
- [NEEDS CLARIFICATION] <question>
