import { expect, test } from '@playwright/test';

// spec:check fixture: a Playwright test traced to TC-900-02.
test.describe('TEST_sample ui', () => {
  test('TC-900-02 TEST_page two is shown', { tag: ['@regression'] }, () => {
    expect(true).toBe(true);
  });
});
