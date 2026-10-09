import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'dotenv';
import { describe, expect, it } from 'vitest';
import { ENV_VARIABLE_NAMES, findEnvExampleDrift } from '../../../src/config/env';
import { REPO_ROOT, fixturePath, runCommand } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-18 / RF-19: a committed `.env.example` documents exactly the
// RF-13 variables with placeholder values, the real `.env` is never committed, and any drift
// between the two lists fails this unit suite by naming the variable.
const ENV_EXAMPLE_FILE = '.env.example';
const PUBLIC_SITE_URLS = ['https://rahulshettyacademy.com/client', 'https://rahulshettyacademy.com/api/ecom'];
const PLACEHOLDER_PATTERN = /^<[^<>]+>$/;
const GIT_IGNORED_EXIT_CODE = 0;
const GIT_NOT_IGNORED_EXIT_CODE = 1;

function readExample(path: string): string {
  return readFileSync(path, 'utf8');
}

/** A value is safe to commit when it is empty, a `<placeholder>` or the public site URL. */
function isPlaceholder(value: string): boolean {
  return value === '' || PLACEHOLDER_PATTERN.test(value) || PUBLIC_SITE_URLS.includes(value);
}

describe('.env.example — positive', () => {
  it('TC-000-31 .env.example in sync with RF-13 passes', () => {
    // Arrange: the committed file.
    const content = readExample(join(REPO_ROOT, ENV_EXAMPLE_FILE));

    // Act
    const drift = findEnvExampleDrift(content);

    // Assert: no variable missing and none unexpected.
    expect(drift).toEqual({ missing: [], unexpected: [] });
  });
});

describe('.env.example — negative', () => {
  it('TC-000-32 .env.example drift fails naming the variable', () => {
    // Arrange: one fixture missing a required variable and one with an extra variable.
    const missingContent = readExample(fixturePath('env', 'example-missing', ENV_EXAMPLE_FILE));
    const extraContent = readExample(fixturePath('env', 'example-extra', ENV_EXAMPLE_FILE));

    // Act
    const missingDrift = findEnvExampleDrift(missingContent);
    const extraDrift = findEnvExampleDrift(extraContent);

    // Assert: each drift names the offending variable, in the right category.
    expect(missingDrift).toEqual({ missing: ['TEST_USER_2_PASSWORD'], unexpected: [] });
    expect(extraDrift).toEqual({ missing: [], unexpected: ['TEST_EXTRA'] });
  });
});

describe('.env.example — security', () => {
  it('TC-000-29 .env.example lists the six variables with placeholders only', () => {
    // Arrange
    const values = parse(readExample(join(REPO_ROOT, ENV_EXAMPLE_FILE)));

    // Act
    const names = Object.keys(values);
    const realLookingValues = Object.entries(values).filter(([, value]) => !isPlaceholder(value));

    // Assert: exactly the RF-13 variables, and no value that could be a real credential.
    expect(names).toEqual([...ENV_VARIABLE_NAMES]);
    expect(realLookingValues).toEqual([]);
  });

  it('TC-000-30 .env is ignored by git while .env.example is tracked', () => {
    // Arrange: ask git itself, so the test follows the real ignore rules.
    const checkIgnored = (path: string) => runCommand('git', ['check-ignore', '--quiet', '--no-index', path], { cwd: REPO_ROOT });

    // Act
    const dotenv = checkIgnored('.env');
    const example = checkIgnored(ENV_EXAMPLE_FILE);

    // Assert: real credentials can never be committed; the template always can.
    expect(dotenv.exitCode).toBe(GIT_IGNORED_EXIT_CODE);
    expect(example.exitCode).toBe(GIT_NOT_IGNORED_EXIT_CODE);
  });
});
