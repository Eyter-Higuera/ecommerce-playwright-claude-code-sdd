# Implementation Template

This template has two parts:
1. **Implementation log** — the file `specs/NNN-<feature>/implementation.md` (header + one entry per task).
2. **Code skeletons** — reference shapes for the code the generator writes. They are not copied
   into the spec folder.

---

## Part 1 — Implementation log

### File header (written once)
```markdown
# Implementation Log — Spec NNN <Feature name>

Spec: specs/NNN-<feature>/spec.md · Tasks: specs/NNN-<feature>/tasks.md
```

### Task log entry (appended per task)
```markdown
## T<n> — <Task title>

Date: <YYYY-MM-DD> · Covers: RF-x / TC-NNN-XX, TC-NNN-YY

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/<feature>.spec.ts | NEW | TC-NNN-XX, TC-NNN-YY |
| src/pages/<name>-page.ts | NEW / UPDATED / REUSED | <what it encapsulates> |

### Test run
Command: `<exact command>`
Result: <passed> passed · <failed> failed · <skipped> skipped (<browser>)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `<command from tasks.md>` | PASS / FAIL |
| Test review checklist | PASS / FAIL (<failed items>) |
| Lint | PASS / FAIL / N/A |
| spec:check | PASS / FAIL / N/A |

### Assumptions and findings
- `// TODO: VERIFY` <assumption and where it lives>
- <possible defect: app behavior differs from RF-x — reported, test not weakened>
```

---

## Part 2 — Code skeletons

### UI test (`tests/ui/<feature>.spec.ts`)
```ts
import { test, expect } from '../../src/fixtures';
import { MESSAGES } from '../../src/config/constants';

// Spec NNN — <Feature name>. Each test title starts with its test case ID for traceability.
test.describe('<Feature> — positive', () => {
  test('TC-NNN-01 <expected behavior>', { tag: ['@smoke', '@critical'] }, async ({ loginPage, testUser }) => {
    // Arrange: start from the login page with a valid TEST_ user from fixtures.
    await loginPage.goto();

    // Act: submit valid credentials.
    await loginPage.login(testUser.email, testUser.password);

    // Assert: the user lands on the account page, proving the session was created.
    await expect(loginPage.page).toHaveURL(/\/account/);
  });
});

test.describe('<Feature> — negative', () => {
  test('TC-NNN-02 <expected behavior>', { tag: ['@regression'] }, async ({ loginPage, testUser }) => {
    // Arrange
    await loginPage.goto();

    // Act: wrong password must not authenticate.
    await loginPage.login(testUser.email, 'TEST_wrong_password');

    // Assert: an error is shown and the user stays on the login page.
    await expect(loginPage.errorMessage).toHaveText(MESSAGES.INVALID_CREDENTIALS);
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});
```

### Page Object (`src/pages/<name>-page.ts`)
```ts
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import { LABELS } from '../config/constants';

// Encapsulates the login page: locators and actions only, no assertions.
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, '/login');
    // Locator priority: role > label > text > placeholder > test id > css.
    this.emailInput = page.getByLabel(LABELS.EMAIL);
    this.passwordInput = page.getByLabel(LABELS.PASSWORD);
    this.submitButton = page.getByRole('button', { name: LABELS.LOGIN });
    this.errorMessage = page.getByRole('alert'); // TODO: VERIFY the error uses role="alert"
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### API test (`tests/api/<resource>.spec.ts`)
```ts
import { test, expect } from '../../src/fixtures';
import { ProductSchema } from '../../src/schemas/product-schema';
import { HTTP_STATUS } from '../../src/config/constants';

test.describe('<Resource> API — positive', () => {
  test('TC-NNN-05 returns a product matching the contract', { tag: ['@api', '@regression'] }, async ({ productClient }) => {
    // Arrange
    const productId = await productClient.getAnyProductId();

    // Act
    const response = await productClient.getById(productId);

    // Assert: status first, then the contract, then business values.
    expect(response.status()).toBe(HTTP_STATUS.OK);
    const body = ProductSchema.parse(await response.json());
    expect(body.id).toBe(productId);
  });
});
```

### Unit test (`tests/unit/<module>.test.ts`)
```ts
import { describe, it, expect, vi } from 'vitest';
import { calculateSubtotal } from '../../src/utils/price';

// Unit tests never make real HTTP calls; every external dependency is mocked with vi.fn / vi.mock.
describe('calculateSubtotal — boundary', () => {
  it('TC-NNN-07 returns 0 for an empty cart', () => {
    // Arrange
    const items: never[] = [];

    // Act
    const subtotal = calculateSubtotal(items);

    // Assert
    expect(subtotal).toBe(0);
  });
});
```

### Test data factory (`src/data/<entity>-factory.ts`)
```ts
// Every created value carries the TEST_ prefix so it is identifiable and safe to clean up.
export function buildTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 1_000)}`;
  return {
    email: `TEST_${unique}@example.test`,
    password: `TEST_Pwd_${unique}`,
    ...overrides,
  };
}
```
