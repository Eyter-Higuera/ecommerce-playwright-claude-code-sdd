import type { Locator, Page } from '@playwright/test';
import { buildLoginUrl } from '../config/urls';
import { NAVIGATION_TIMEOUT_MS } from '../config/timeouts';
import { loginPageUnavailableMessage } from '../errors/messages';
import { LOGIN_FORM } from './login-page.constants';

// Page Object of the login page (Spec 000, RF-52 / RF-53): locators and navigation only, no
// assertions. Locator priority: role (with the accessible name) first.

const FIRST_ERROR_STATUS = 400;

export interface OpenOptions {
  /** Navigation budget; defaults to the spec's 30 s. Mocked tests pass a shorter one. */
  timeoutMs?: number;
}

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly url: string;

  constructor(
    readonly page: Page,
    baseUrl: string,
  ) {
    this.url = buildLoginUrl(baseUrl);
    this.emailInput = page.getByRole('textbox', { name: LOGIN_FORM.EMAIL_INPUT_NAME, exact: true });
    this.passwordInput = page.getByRole('textbox', { name: LOGIN_FORM.PASSWORD_INPUT_NAME, exact: true });
    this.loginButton = page.getByRole('button', { name: LOGIN_FORM.LOGIN_BUTTON_NAME, exact: true });
  }

  /**
   * Opens the login page. Throws "Login page unavailable: <URL> (<status or timeout>)" (RF-53)
   * when the document answers with HTTP >= 400 or does not load within the budget.
   */
  async open(options: OpenOptions = {}): Promise<void> {
    const timeout = options.timeoutMs ?? NAVIGATION_TIMEOUT_MS;
    let status: number | undefined;
    try {
      const response = await this.page.goto(this.url, { timeout });
      status = response?.status();
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(loginPageUnavailableMessage(this.url, 'timeout'), { cause: error });
      }
      throw error;
    }
    if (status !== undefined && status >= FIRST_ERROR_STATUS) {
      throw new Error(loginPageUnavailableMessage(this.url, status));
    }
  }
}
