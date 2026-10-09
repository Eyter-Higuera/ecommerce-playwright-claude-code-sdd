import { expect, test } from '@playwright/test';

// Fixture for TC-000-70: one test that always fails (no browser, no network).
test('TEST_fixture always fails', () => {
  expect(1 + 1).toBe(3);
});
