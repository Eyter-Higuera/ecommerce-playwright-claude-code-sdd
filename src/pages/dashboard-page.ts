import type { Page } from '@playwright/test';
import { NavBar } from '../components/nav-bar';
import { DialogRecorder } from '../components/dialog-recorder';
import { FilterPanel } from '../components/filter-panel';
import { ProductList } from '../components/product-list';
import { buildDashboardUrl } from '../config/urls';
import { NAVIGATION_TIMEOUT_MS, NAVIGATION_WAIT_UNTIL } from '../config/timeouts';

// Page Object of the dashboard (Spec 001, RF-3, RF-12, RF-20 to RF-23; Spec 002, plan D-7):
// navigation, the header controls, and the product list and filter panel of the catalog; no
// assertions. The shop redirects `#/dashboard` to `#/dashboard/dash` (observed).

/** Local-storage key under which the shop keeps the session token (verified 2026-10-08). */
export const SESSION_STORAGE_KEY = 'token';

/** The browser global used by `clearStoredSession` and `startSession`; tsconfig has no DOM lib, the code runs in the page. */
interface BrowserGlobal {
  localStorage: { removeItem(key: string): void; setItem(key: string, value: string): void };
}

export class DashboardPage {
  readonly navBar: NavBar;
  /** The catalog shown on the dashboard (Spec 002, RF-1 to RF-4). */
  readonly products: ProductList;
  /** The visible filter panel: search, price range and option groups (Spec 002, RF-5 to RF-16). */
  readonly filters: FilterPanel;
  readonly url: string;

  constructor(
    readonly page: Page,
    baseUrl: string,
  ) {
    this.url = buildDashboardUrl(baseUrl);
    this.navBar = new NavBar(page);
    this.products = new ProductList(page);
    this.filters = new FilterPanel(page);
  }

  /** Opens the dashboard route; without a session the shop redirects to the login route (RF-23). */
  async open(): Promise<void> {
    await this.page.goto(this.url, { timeout: NAVIGATION_TIMEOUT_MS, waitUntil: NAVIGATION_WAIT_UNTIL });
  }

  /**
   * Opens the dashboard and waits for the answer to its unfiltered product request, so a later
   * filter action cannot race with the initial list (Spec 002, plan D-4).
   */
  async openCatalog(): Promise<void> {
    await this.filters.load(async () => this.open());
  }

  /** Spec 002 RF-8: starts recording browser dialogs; each is dismissed and its type returned. */
  recordDialogs(): string[] {
    return new DialogRecorder(this.page).types;
  }

  /** Removes the stored session token from the page, as clearing site data would (TC-001-32). */
  async clearStoredSession(): Promise<void> {
    await this.page.evaluate((key) => {
      (globalThis as unknown as BrowserGlobal).localStorage.removeItem(key);
    }, SESSION_STORAGE_KEY);
  }

  /**
   * Spec 004 plan D-4: stores a session token from an API login in the page, as a login would, then
   * reloads the app on the dashboard, so it starts with the new token as after a real login. The
   * token goes through an `evaluate` step, which reports never print, and the caller's file records
   * no trace (Spec 001 RF-27).
   */
  async startSession(token: string): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => {
        (globalThis as unknown as BrowserGlobal).localStorage.setItem(key, value);
      },
      { key: SESSION_STORAGE_KEY, value: token },
    );
    await this.open();
    await this.page.reload({ timeout: NAVIGATION_TIMEOUT_MS, waitUntil: NAVIGATION_WAIT_UNTIL });
  }
}
