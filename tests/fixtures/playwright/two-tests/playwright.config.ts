import { defineConfig } from '@playwright/test';

// Fixture project for TC-000-28: no browser, no network, no retries; the repository fixtures
// (src/fixtures/test.ts) are used as they are by the real tests.
export default defineConfig({
  testDir: '.',
  reporter: 'list',
  retries: 0,
  workers: 1,
});
