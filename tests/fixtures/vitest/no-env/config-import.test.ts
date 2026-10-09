import { expect, it } from 'vitest';
import { loadEnv } from '../../../../src/config/env';
import { missingEnvVariableMessage } from '../../../../src/errors/messages';

// Fixture for TC-000-12: runs with no RF-13 variable and no `.env` in its folder.
// Importing the framework modules and loading configuration must not throw (RF-7);
// only an explicit requireEnv() of a missing variable may fail.
// Note: Vite always sets process.env.BASE_URL to "/" inside Vitest (its own base path), so unit
// tests that need BASE_URL must inject it explicitly, as tests/unit/config/env.test.ts does.
const CREDENTIAL_NAMES = ['API_BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD', 'TEST_USER_2_EMAIL', 'TEST_USER_2_PASSWORD'];

it('TEST_fixture loads configuration without variables', () => {
  const env = loadEnv();

  expect(CREDENTIAL_NAMES.map((name) => env[name])).toEqual(CREDENTIAL_NAMES.map(() => undefined));
  expect(typeof missingEnvVariableMessage).toBe('function');
});
