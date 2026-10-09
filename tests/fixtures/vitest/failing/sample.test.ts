import { expect, it } from 'vitest';

// Fixture for TC-000-09: a project whose only unit test fails on purpose.
it('TEST_fixture fails', () => {
  expect(1 + 1).toBe(3);
});
