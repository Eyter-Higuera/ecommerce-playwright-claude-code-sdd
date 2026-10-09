import { expect, test } from '../../../../../src/fixtures/test';

// Fixture for TC-000-73: fails on the first attempt and passes on retry (a flaky test).
test('TEST_fixture fails once then passes', () => {
  expect(test.info().retry).toBeGreaterThan(0);
});
