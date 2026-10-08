import { test as base, expect } from '@playwright/test';
import { AuthClient, type LoginCredentials } from '../api/auth-client';
import { requireEnv } from '../config/env';
import { LoginPage } from '../pages/login-page';

// Playwright fixtures (Spec 000). Tests receive ready Page Objects, clients and accounts;
// configuration is read inside each fixture, so a missing variable fails only the tests that use
// it (RF-17). Credentials are never logged or attached (RF-22, RF-26).

/** Annotation type that marks a test which passed only after a retry (RF-50). */
export const FLAKY_ANNOTATION = 'flaky';

interface Fixtures {
  loginPage: LoginPage;
  authClient: AuthClient;
  /** Test account A (TEST_USER_EMAIL / TEST_USER_PASSWORD). */
  accountA: LoginCredentials;
}

interface AutoFixtures {
  /**
   * RF-50: Playwright's JUnit reporter has no flaky marker (a test that passes on retry is a plain
   * pass). This automatic fixture annotates such a test; the JUnit reporter embeds annotations as
   * <property> entries, so GitLab's test report shows it. The HTML report marks flaky natively.
   */
  markFlaky: void;
}

export const test = base.extend<Fixtures & AutoFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page, requireEnv('BASE_URL')));
  },
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request, requireEnv('API_BASE_URL')));
  },
  accountA: async ({}, use) => {
    await use({ email: requireEnv('TEST_USER_EMAIL'), password: requireEnv('TEST_USER_PASSWORD') });
  },
  markFlaky: [
    async ({}, use, testInfo) => {
      await use();
      if (testInfo.retry > 0 && testInfo.status === testInfo.expectedStatus) {
        testInfo.annotations.push({ type: FLAKY_ANNOTATION, description: `passed on retry ${String(testInfo.retry)}` });
      }
    },
    { auto: true },
  ],
});

export { expect };
