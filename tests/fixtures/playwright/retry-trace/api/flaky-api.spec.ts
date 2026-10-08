import { expect, test } from '@playwright/test';

// Fixture for TC-000-41: an api test that fails on the first attempt and passes on retry.
test('TEST_fixture api fails once', () => {
  expect(test.info().retry).toBeGreaterThan(0);
});
