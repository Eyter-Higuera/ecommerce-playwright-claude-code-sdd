import type { Page } from '@playwright/test';
import { NavBar } from '../components/nav-bar';
import { buildDashboardUrl } from '../config/urls';
import { NAVIGATION_TIMEOUT_MS } from '../config/timeouts';

// Page Object of the dashboard (Spec 001, RF-3, RF-12, RF-20 to RF-23): navigation and the header
// controls only, no assertions. The shop redirects `#/dashboard` to `#/dashboard/dash` (observed).

/** Local-storage key under which the shop keeps the session token (verified 2026-10-08). */
export const SESSION_STORAGE_KEY = 'token';

/** The browser global used by `clearStoredSession`; tsconfig has no DOM lib, the code runs in the page. */
interface BrowserGlobal {
  localStorage: { removeItem(key: string): void };
}

export class DashboardPage {
  readonly navBar: NavBar;
  readonly url: string;

  constructor(
    readonly page: Page,
    baseUrl: string,
  ) {
    this.url = buildDashboardUrl(baseUrl);
    this.navBar = new NavBar(page);
  }

  /** Opens the dashboard route; without a session the shop redirects to the login route (RF-23). */
  async open(): Promise<void> {
    await this.page.goto(this.url, { timeout: NAVIGATION_TIMEOUT_MS });
  }

  /** Removes the stored session token from the page, as clearing site data would (TC-001-32). */
  async clearStoredSession(): Promise<void> {
    await this.page.evaluate((key) => {
      (globalThis as unknown as BrowserGlobal).localStorage.removeItem(key);
    }, SESSION_STORAGE_KEY);
  }
}
