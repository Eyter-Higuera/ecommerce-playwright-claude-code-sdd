import type { Locator, Page } from '@playwright/test';
import { buildLoginUrl } from '../config/urls';
import { NAVIGATION_TIMEOUT_MS, NAVIGATION_WAIT_UNTIL } from '../config/timeouts';
import { loginPageUnavailableMessage } from '../errors/messages';
import type { LoginCredentials } from '../api/auth-client';
import { DialogRecorder } from '../components/dialog-recorder';
import { LOGIN_FORM, LOGIN_MESSAGES } from './login-page.constants';

// Page Object of the login page (Spec 000, RF-52 / RF-53; Spec 001, RF-1 to RF-10): locators and
// actions only, no assertions. Locator priority: role (with the accessible name) first.

const FIRST_ERROR_STATUS = 400;
const TAB_KEY = 'Tab';
const ENTER_KEY = 'Enter';

/** The DOM members `enterSecret` uses; tsconfig has no DOM lib, the function runs in the browser. */
interface InputLike {
  value: string;
  dispatchEvent(event: Event): boolean;
}

/**
 * Spec 001 RF-27: puts a secret into an input without leaking it into reports. Playwright names
 * the steps of `fill`, `type`, `pressSequentially` and `keyboard.type` after the typed text
 * (`Fill "<value>"`), and the HTML and JSON reports keep those titles even with tracing off. An
 * `evaluate` step is titled just "Evaluate", so the value is set in the page and the `input` and
 * `change` events the form listens to are dispatched, as typing would.
 */
async function enterSecret(input: Locator, secret: string): Promise<void> {
  await input.evaluate((element, value) => {
    const field = element as unknown as InputLike;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }, secret);
}

export interface OpenOptions {
  /** Navigation budget; defaults to the spec's 30 s. Mocked tests pass a shorter one. */
  timeoutMs?: number;
}

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  /** RF-7: the toast shown for credentials of no registered account. */
  readonly incorrectCredentialsAlert: Locator;
  /** RF-4 to RF-6: client-side validation messages (plain text, no role). */
  readonly emailRequiredMessage: Locator;
  readonly passwordRequiredMessage: Locator;
  readonly validEmailMessage: Locator;
  readonly url: string;

  constructor(
    readonly page: Page,
    baseUrl: string,
  ) {
    this.url = buildLoginUrl(baseUrl);
    this.emailInput = page.getByRole('textbox', { name: LOGIN_FORM.EMAIL_INPUT_NAME, exact: true });
    this.passwordInput = page.getByRole('textbox', { name: LOGIN_FORM.PASSWORD_INPUT_NAME, exact: true });
    this.loginButton = page.getByRole('button', { name: LOGIN_FORM.LOGIN_BUTTON_NAME, exact: true });
    this.incorrectCredentialsAlert = page.getByRole('alert', { name: LOGIN_MESSAGES.INCORRECT_CREDENTIALS, exact: true });
    this.emailRequiredMessage = page.getByText(LOGIN_MESSAGES.EMAIL_REQUIRED, { exact: true });
    this.passwordRequiredMessage = page.getByText(LOGIN_MESSAGES.PASSWORD_REQUIRED, { exact: true });
    this.validEmailMessage = page.getByText(LOGIN_MESSAGES.VALID_EMAIL, { exact: true });
  }

  /** Types both fields. A real password may be passed only from a NO_TRACE test (Spec 001 RF-27). */
  async fillCredentials(credentials: LoginCredentials): Promise<void> {
    await this.emailInput.fill(credentials.email);
    await enterSecret(this.passwordInput, credentials.password);
  }

  /**
   * RF-8: starts recording browser dialogs (alert, confirm, prompt, beforeunload). Each dialog is
   * dismissed so the page never hangs, and its type is pushed to the returned array
   * (`DialogRecorder`, shared with the dashboard; Spec 002 plan D-8).
   */
  recordDialogs(): string[] {
    return new DialogRecorder(this.page).types;
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.fillCredentials(credentials);
    await this.submit();
  }

  /**
   * Keyboard-only login, part 1 (plan D-8): the email field is focused programmatically (not a
   * pointer action), the email is typed and Tab moves the focus on. Verified tab order on
   * 2026-10-08: email → password → Login.
   */
  async typeEmailAndTab(email: string): Promise<void> {
    await this.emailInput.focus();
    await this.page.keyboard.type(email);
    await this.page.keyboard.press(TAB_KEY);
  }

  /**
   * Keyboard-only login, part 2: the password goes into the focused password field through
   * `enterSecret` (never `keyboard.type`, see below) and Enter submits the form.
   */
  async enterPasswordAndPressEnter(password: string): Promise<void> {
    await enterSecret(this.passwordInput, password);
    await this.page.keyboard.press(ENTER_KEY);
  }

  /**
   * Opens the login page. Throws "Login page unavailable: <URL> (<status or timeout>)" (RF-53)
   * when the document answers with HTTP >= 400 or does not load within the budget.
   */
  async open(options: OpenOptions = {}): Promise<void> {
    const timeout = options.timeoutMs ?? NAVIGATION_TIMEOUT_MS;
    let status: number | undefined;
    try {
      const response = await this.page.goto(this.url, { timeout, waitUntil: NAVIGATION_WAIT_UNTIL });
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
