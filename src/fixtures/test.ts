import { test as base, expect, type PlaywrightWorkerOptions } from '@playwright/test';
import { AuthClient, type AuthSession, type LoginCredentials } from '../api/auth-client';
import { UserClient } from '../api/user-client';
import { ProductClient } from '../api/product-client';
import { HTTP_STATUS } from '../api/api-result';
import { productListSchema, type Product } from '../api/schemas/product.schema';
import { EMPTY_CRITERIA } from '../data/catalog-oracle';
import { requireEnv } from '../config/env';
import { catalogUnavailableMessage, traceMustBeOffMessage } from '../errors/messages';
import { NavBar } from '../components/nav-bar';
import { DashboardPage, SESSION_STORAGE_KEY } from '../pages/dashboard-page';
import { LoginPage } from '../pages/login-page';
import { ProductDetailPage } from '../pages/product-detail-page';

// Playwright fixtures (Spec 000). Tests receive ready Page Objects, clients and accounts;
// configuration is read inside each fixture, so a missing variable fails only the tests that use
// it (RF-17). Credentials are never logged or attached (RF-22, RF-26).

/** Annotation type that marks a test which passed only after a retry (RF-50). */
export const FLAKY_ANNOTATION = 'flaky';

/**
 * Spec 001 RF-27: `test.use(NO_TRACE)` at the top of a test file marks its tests as typing a real
 * password or holding an auth token in the browser, so they record no trace, retries included (an
 * explicit exception to Spec 000 RF-49). `trace` is a worker option, so Playwright accepts it only
 * at file level, not inside a describe.
 */
export const NO_TRACE = { trace: 'off' } as const;
const TRACE_OFF = 'off';

type TraceOption = PlaywrightWorkerOptions['trace'];

/** Throws unless tracing is off, naming the fixture that needs it (RF-27 guard, plan D-2). */
function requireTraceOff(trace: TraceOption, fixture: string): void {
  const mode = typeof trace === 'string' ? trace : trace.mode;
  if (mode !== TRACE_OFF) throw new Error(traceMustBeOffMessage(fixture, mode));
}

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  /** The product detail page (Spec 003). */
  productDetailPage: ProductDetailPage;
  /** Header controls of the current page (Sign Out), whichever page is open. */
  navBar: NavBar;
  authClient: AuthClient;
  /** Test account A (TEST_USER_EMAIL / TEST_USER_PASSWORD). */
  accountA: LoginCredentials;
  /** Test account B (TEST_USER_2_EMAIL / TEST_USER_2_PASSWORD); successful logins only (Spec 001). */
  accountB: LoginCredentials;
  userClient: UserClient;
  /** Token and userId of account A from a fresh API login, one per test (Spec 001, plan D-6). */
  apiSession: AuthSession;
  productClient: ProductClient;
  /**
   * The current catalog: every product of the product API with no criteria, read with the
   * account A token right before the test acts (Spec 002, plan D-1, D-9). Fails when the answer
   * is not a valid, non-empty product list (RF-1, RF-17).
   */
  catalog: readonly Product[];
  /** Account A credentials to TYPE into the browser; only with tracing off (Spec 001 RF-27). */
  formAccountA: LoginCredentials;
  /** Account B credentials to TYPE into the browser; only with tracing off (Spec 001 RF-27). */
  formAccountB: LoginCredentials;
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
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page, requireEnv('BASE_URL')));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page, requireEnv('BASE_URL')));
  },
  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request, requireEnv('API_BASE_URL')));
  },
  accountA: async ({}, use) => {
    await use({ email: requireEnv('TEST_USER_EMAIL'), password: requireEnv('TEST_USER_PASSWORD') });
  },
  accountB: async ({}, use) => {
    await use({ email: requireEnv('TEST_USER_2_EMAIL'), password: requireEnv('TEST_USER_2_PASSWORD') });
  },
  userClient: async ({ request }, use) => {
    await use(new UserClient(request, requireEnv('API_BASE_URL')));
  },
  apiSession: async ({ authClient, accountA }, use) => {
    await use(await authClient.loginSession(accountA));
  },
  productClient: async ({ request }, use) => {
    await use(new ProductClient(request, requireEnv('API_BASE_URL')));
  },
  catalog: async ({ productClient, apiSession }, use) => {
    const result = await productClient.getAllProducts(EMPTY_CRITERIA, apiSession.token);
    const parsed = productListSchema.safeParse(result.json);
    if (result.status !== HTTP_STATUS.OK || !parsed.success) throw new Error(catalogUnavailableMessage(result.status));
    await use(parsed.data.data);
  },
  formAccountA: async ({ trace, accountA }, use) => {
    requireTraceOff(trace, 'formAccountA');
    await use(accountA);
  },
  formAccountB: async ({ trace, accountB }, use) => {
    requireTraceOff(trace, 'formAccountB');
    await use(accountB);
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

/**
 * Spec 001 plan D-1: tests whose session is not under test get it from the API, never by typing a
 * password. The token of a fresh account A login is put into local storage for the BASE_URL origin
 * through `storageState`, which is applied once, when the browser context is created. Signing out,
 * removing the token and going back therefore behave as in a real browser. The browser then holds
 * the token, so the test file must declare `test.use(NO_TRACE)` (RF-27, plan D-3).
 */
export const loggedInTest = test.extend({
  storageState: async ({ trace, apiSession }, use) => {
    requireTraceOff(trace, 'loggedInTest');
    const origin = new URL(requireEnv('BASE_URL')).origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: SESSION_STORAGE_KEY, value: apiSession.token }] }] });
  },
});

export { expect };
