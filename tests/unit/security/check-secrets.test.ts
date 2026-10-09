import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanArtifacts } from '../../../scripts/check-secrets';
import { makeEmptyDir } from '../helpers/run-cli';
import { makeZip } from '../helpers/make-zip';

// Spec 000 — Framework foundation. RF-23 / RF-24: `npm run check:secrets` scans reports/,
// playwright-report/ and test-results/ — inside trace archives and the HTML report's embedded zip
// too — for the passwords (plain and URL-encoded) and for auth tokens, and names the file and the
// variable, never the value. Fixtures are built in a temp folder; zips are made at test time.
const PASSWORD = 'TEST_P@ss';
const SECRETS = [{ name: 'TEST_USER_PASSWORD', value: PASSWORD }];
// JWT-shaped TEST_ token: three base64url segments, the first two starting with "eyJ".
const JWT_LIKE_TOKEN = 'eyJhbGciOiJURVNUIn0.eyJzdWIiOiJURVNUX3VzZXIifQ.TEST_signature_segment';
const SUCCESS_EXIT_CODE = 0;

function writeArtifacts(files: Record<string, string | Buffer>): string {
  const root = makeEmptyDir('TEST_secrets_');
  for (const [relativePath, content] of Object.entries(files)) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

/** An HTML report page embedding a zip payload, as Playwright's HTML reporter does. */
function htmlReport(payload: Record<string, string>): string {
  const base64 = makeZip(payload).toString('base64');
  return `<html><template id="playwrightReportBase64">data:application/zip;base64,${base64}</template></html>`;
}

describe('Secrets scan — positive', () => {
  it('TC-000-38 secrets scan passes on clean artifacts', () => {
    // Arrange: a report page, a JUnit file and a trace archive with no sensitive value.
    const root = writeArtifacts({
      'playwright-report/index.html': htmlReport({ 'report.json': '{"outcome":"expected"}' }),
      'reports/junit.xml': '<testsuites tests="1" failures="0"></testsuites>',
      'test-results/TEST_ui-chromium-retry1/trace.zip': makeZip({ 'trace.network': 'POST /auth/login 200' }),
    });

    // Act
    const result = scanArtifacts({ rootDir: root, secrets: SECRETS });

    // Assert: every file was read and nothing was found.
    expect(result.findings).toEqual([]);
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
  });
});

describe('Secrets scan — security', () => {
  it('TC-000-39 secrets scan finds values inside trace archives and URL-encoded', () => {
    // Arrange: the password inside a trace archive, URL-encoded in an HTML page, hidden in the HTML
    // report's embedded zip, and a JWT-shaped token in JUnit output.
    const root = writeArtifacts({
      'test-results/TEST_api-retry1/trace.zip': makeZip({ 'trace.network': `{"userPassword":"${PASSWORD}"}` }),
      'playwright-report/data/TEST_page.html': `<a href="/login?password=${encodeURIComponent(PASSWORD)}">x</a>`,
      'playwright-report/index.html': htmlReport({ 'TEST_file.json': `{"body":"${PASSWORD}"}` }),
      'reports/junit.xml': `<system-out>token=${JWT_LIKE_TOKEN}</system-out>`,
    });

    // Act
    const result = scanArtifacts({ rootDir: root, secrets: SECRETS });
    const output = result.output.join('\n');

    // Assert: each leak is named by file and variable; the output never repeats a value.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        { file: 'test-results/TEST_api-retry1/trace.zip!trace.network', variable: 'TEST_USER_PASSWORD' },
        { file: 'playwright-report/data/TEST_page.html', variable: 'TEST_USER_PASSWORD' },
        { file: 'playwright-report/index.html!TEST_file.json', variable: 'TEST_USER_PASSWORD' },
        { file: 'reports/junit.xml', variable: 'auth token' },
      ]),
    );
    expect(output).toContain('TEST_USER_PASSWORD');
    expect(output).not.toContain(PASSWORD);
    expect(output).not.toContain(encodeURIComponent(PASSWORD));
    expect(output).not.toContain(JWT_LIKE_TOKEN);
  });
});
