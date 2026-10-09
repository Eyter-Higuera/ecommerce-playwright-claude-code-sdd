import { expect, test } from '../../../../src/fixtures/test';

// Fixture for TC-000-28: one test reads account A through the fixture, the other reads nothing.
test('TEST_fixture reads account A', ({ accountA }) => {
  expect(accountA.email.length).toBeGreaterThan(0);
});

test('TEST_fixture needs no credential', () => {
  expect(1 + 1).toBe(2);
});
