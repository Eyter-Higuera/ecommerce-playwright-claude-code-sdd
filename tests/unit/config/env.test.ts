import { describe, expect, it } from 'vitest';
import { ENV_VARIABLE_NAMES, loadEnv, requireEnv } from '../../../src/config/env';
import { fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-13 to RF-17 and RF-7: configuration comes from the process
// environment and an optional `.env` file, the process wins, and a missing value is reported by
// name, never replaced by a silent default. Every test passes an explicit environment and `.env`
// path, so the developer's real `.env` is never read.
const DOTENV_FIXTURE = fixturePath('env', 'dotenv', 'sample.env');
const NO_DOTENV = fixturePath('env', 'dotenv', 'TEST_missing.env');
const MISSING_EMAIL_MESSAGE = 'Missing required environment variable: TEST_USER_EMAIL';

const INJECTED_ENV = {
  BASE_URL: 'https://TEST_host/client',
  API_BASE_URL: 'https://TEST_host/api',
  TEST_USER_EMAIL: 'TEST_a@example.test',
  TEST_USER_PASSWORD: 'TEST_pass_a',
  TEST_USER_2_EMAIL: 'TEST_b@example.test',
  TEST_USER_2_PASSWORD: 'TEST_pass_b',
};

describe('Environment configuration — positive', () => {
  it('TC-000-22 configuration accessor returns all six variables', () => {
    // Arrange: the six RF-13 variables injected through the process environment, no `.env`.
    const env = loadEnv({ processEnv: INJECTED_ENV, dotenvPath: NO_DOTENV });

    // Act
    const values = Object.fromEntries(ENV_VARIABLE_NAMES.map((name) => [name, requireEnv(name, env)]));

    // Assert: every value comes back exactly as injected, and the accessor knows all six names.
    expect(values).toEqual(INJECTED_ENV);
  });

  it('TC-000-23 .env file values are loaded when present', () => {
    // Arrange: an empty process environment and a `.env` fixture with TEST_ placeholders.
    const env = loadEnv({ processEnv: {}, dotenvPath: DOTENV_FIXTURE });

    // Act
    const email = requireEnv('TEST_USER_EMAIL', env);
    const baseUrl = requireEnv('BASE_URL', env);

    // Assert: values come from the file.
    expect(email).toBe('TEST_file@example.test');
    expect(baseUrl).toBe('https://TEST_host/client');
  });

  it('TC-000-24 process environment takes precedence over .env', () => {
    // Arrange: the same variable set in the process and in the `.env` fixture.
    const env = loadEnv({ processEnv: { TEST_USER_EMAIL: 'TEST_env@example.test' }, dotenvPath: DOTENV_FIXTURE });

    // Act
    const email = requireEnv('TEST_USER_EMAIL', env);

    // Assert: the process value wins (CI variables override a stray local file).
    expect(email).toBe('TEST_env@example.test');
  });
});

describe('Environment configuration — negative', () => {
  it('TC-000-13 reading a credential in a unit context raises the missing-variable error', () => {
    // Arrange: nothing set anywhere, as in a unit test run.
    const env = loadEnv({ processEnv: {}, dotenvPath: NO_DOTENV });

    // Act
    const read = () => requireEnv('TEST_USER_EMAIL', env);

    // Assert: no silent default; the error names the variable.
    expect(read).toThrow(MISSING_EMAIL_MESSAGE);
  });
});

describe('Environment configuration — boundary', () => {
  it('TC-000-25 empty process value overrides a .env value and is reported missing', () => {
    // Arrange: an empty process value (set but empty) and a filled `.env` value.
    const env = loadEnv({ processEnv: { TEST_USER_EMAIL: '' }, dotenvPath: DOTENV_FIXTURE });

    // Act
    const read = () => requireEnv('TEST_USER_EMAIL', env);

    // Assert: the `.env` value is not used as a fallback; the variable is reported missing.
    expect(read).toThrow(MISSING_EMAIL_MESSAGE);
  });
});
