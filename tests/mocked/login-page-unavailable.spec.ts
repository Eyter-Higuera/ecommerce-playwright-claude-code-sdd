import { expect, test } from '../../src/fixtures/test';
import { NAVIGATION_TIMEOUT_MS } from '../../src/config/timeouts';

// Spec 000 — Framework foundation. RF-53: when the login page is down or hangs, the UI sanity test
// must fail with "Login page unavailable: <URL> (<status or timeout>)" instead of a generic locator
// timeout. Both states are hard to reproduce on the real site, so the network is mocked with
// page.route(); no request leaves the browser.
const SERVICE_UNAVAILABLE = 503;
const SPEC_NAVIGATION_BUDGET_MS = 30_000;
// Short budget so the timeout case finishes quickly; the production value is checked separately.
const MOCKED_NAVIGATION_TIMEOUT_MS = 2_000;

test.describe('Login page sanity — negative', () => {
  test('TC-000-78 unavailable login page fails with a clear message', { tag: ['@regression', '@mocked'] }, async ({ page, loginPage }) => {
    // Arrange: every request answers 503, as a server in maintenance would.
    await page.route('**/*', (route) => route.fulfill({ status: SERVICE_UNAVAILABLE, body: 'TEST_maintenance' }));

    // Act
    const opening = loginPage.open();

    // Assert: the failure names the URL and the status, before any element check.
    await expect(opening).rejects.toThrow(`Login page unavailable: ${loginPage.url} (${String(SERVICE_UNAVAILABLE)})`);
  });
});

test.describe('Login page sanity — boundary', () => {
  test('TC-000-79 login page timeout fails with a timeout message', { tag: ['@regression', '@mocked'] }, async ({ page, loginPage }) => {
    // Arrange: the document request is held and never answered.
    await page.route('**/*', () => undefined);

    // Act
    const opening = loginPage.open({ timeoutMs: MOCKED_NAVIGATION_TIMEOUT_MS });

    // Assert: a timeout is reported as unavailable, and the real budget is the spec's 30 s.
    await expect(opening).rejects.toThrow(`Login page unavailable: ${loginPage.url} (timeout)`);
    expect(NAVIGATION_TIMEOUT_MS).toBe(SPEC_NAVIGATION_BUDGET_MS);
  });
});
