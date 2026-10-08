import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, runPlaywright, type CliResult } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-8 to RF-12: which Playwright projects run, and which tests
// each one gets. The real CLI lists tests (`--list`, nothing executes), with valid TEST_ URLs and
// no `.env`, and the output lines `[project] › file › title` are parsed.
const VALID_URLS = { BASE_URL: 'https://TEST_host/client', API_BASE_URL: 'https://TEST_host/api' };
const BROWSER_PROJECTS = ['chromium', 'firefox', 'webkit'];
const DEFAULT_PROJECTS = ['api', ...BROWSER_PROJECTS];
const UI_SANITY_TEST = 'TC-000-76';
const API_SANITY_TEST = 'TC-000-80';
const MOCKED_TESTS = ['TC-000-78', 'TC-000-79'];
const SUCCESS_EXIT_CODE = 0;
// Tag names as the JSON reporter reports them (without the leading `@`).
const SMOKE_TAG = 'smoke';
const LISTED_LINE = /^\s*\[([^\]]+)\] › (.+)$/;
// Several CLI runs in one test.
const MANY_RUNS_TIMEOUT_MS = CLI_TEST_TIMEOUT_MS * 2;

interface ListedTest {
  project: string;
  line: string;
}

function list(extraArgs: string[]): { result: CliResult; tests: ListedTest[] } {
  const result = runPlaywright(['test', '--list', ...extraArgs], { env: VALID_URLS });
  const tests = result.stdout.split(/\r?\n/).flatMap((line) => {
    const match = LISTED_LINE.exec(line);
    return match?.[1] && match[2] ? [{ project: match[1], line: match[2] }] : [];
  });
  return { result, tests };
}

interface ListedSpec {
  title: string;
  tags: string[];
}

interface JsonSuite {
  specs?: ListedSpec[];
  suites?: JsonSuite[];
}

/** `--list --reporter=json`: the plain list output has no tags, the JSON report has them per test. */
function listSpecsWithTags(extraArgs: string[]): ListedSpec[] {
  const result = runPlaywright(['test', '--list', '--reporter=json', ...extraArgs], { env: VALID_URLS });
  const report = JSON.parse(result.stdout) as { suites: JsonSuite[] };
  const collect = (suite: JsonSuite): ListedSpec[] => [
    ...(suite.specs ?? []).map(({ title, tags }) => ({ title, tags })),
    ...(suite.suites ?? []).flatMap(collect),
  ];
  return report.suites.flatMap(collect);
}

const projectsOf =(tests: ListedTest[]) => [...new Set(tests.map((test) => test.project))].sort();
const withId = (tests: ListedTest[], id: string) => tests.filter((test) => test.line.includes(` ${id} `));

describe('Playwright projects — positive', () => {
  it('TC-000-14 each browser project lists the UI tests and no API test', { timeout: MANY_RUNS_TIMEOUT_MS }, () => {
    // Arrange
    const projects = BROWSER_PROJECTS;

    // Act
    const listings = projects.map((project) => ({ project, ...list([`--project=${project}`]) }));

    // Assert: each browser runs the UI sanity test on itself and never the API test.
    for (const { project, tests } of listings) {
      expect(withId(tests, UI_SANITY_TEST).map((test) => test.project), project).toEqual([project]);
      expect(withId(tests, API_SANITY_TEST), project).toEqual([]);
    }
  });

  it('TC-000-16 msedge project runs only when explicitly requested', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange
    const args = ['--project=msedge'];

    // Act
    const { result, tests } = list(args);

    // Assert: requested explicitly, msedge exists and gets the UI tests.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(withId(tests, UI_SANITY_TEST).map((test) => test.project)).toEqual(['msedge']);
  });

  it('TC-000-20 --grep @smoke selects only smoke tests', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: smoke and non-smoke (`@mocked`) tests exist.
    const args = ['--grep', '@smoke'];

    // Act
    const specs = listSpecsWithTags(args);
    const notSmoke = specs.filter((spec) => !spec.tags.includes(SMOKE_TAG));
    const titles = specs.map((spec) => spec.title);

    // Assert: every selected test carries @smoke (later specs add their own smoke tests, so the
    // set is not fixed); the two sanity tests are among them; the mocked tests are excluded.
    expect(specs.length).toBeGreaterThan(0);
    expect(notSmoke).toEqual([]);
    expect(titles.some((title) => title.startsWith(`${UI_SANITY_TEST} `))).toBe(true);
    expect(titles.some((title) => title.startsWith(`${API_SANITY_TEST} `))).toBe(true);
    expect(titles.filter((title) => MOCKED_TESTS.some((id) => title.startsWith(`${id} `)))).toEqual([]);
  });

  it('TC-000-19 API tests run once, in the api project only', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a default run (no --project).
    const args: string[] = [];

    // Act
    const { tests } = list(args);

    // Assert: one API sanity test in the whole run, under `api`; no browser repeats it.
    expect(withId(tests, API_SANITY_TEST).map((test) => test.project)).toEqual(['api']);
  });
});

describe('Playwright projects — negative', () => {
  it('TC-000-15 an unknown browser project is rejected', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange
    const args = ['--project=TEST_opera'];

    // Act
    const { result, tests } = list(args);

    // Assert: the run fails and names the unknown project; nothing is listed.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toContain('TEST_opera');
    expect(tests).toEqual([]);
  });

  it('TC-000-17 a run without --project includes api and three browsers but not msedge', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange
    const args: string[] = [];

    // Act
    const { tests } = list(args);

    // Assert: exactly the default projects (msedge needs Edge installed, so it is opt-in), and no
    // fixture project from tests/fixtures/ is collected by the real run.
    expect(projectsOf(tests)).toEqual([...DEFAULT_PROJECTS].sort());
    expect(tests.filter((test) => test.line.includes('fixtures'))).toEqual([]);
  });

  it('TC-000-21 --grep with an unused tag finds no tests', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a tag no test uses.
    const args = ['--grep', '@TEST_none'];

    // Act
    const { result, tests } = list(args);

    // Assert: an empty selection is an error, not a silent green run.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toContain('No tests found');
    expect(tests).toEqual([]);
  });

  it('TC-000-18 selecting one project does not run the other default projects', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange
    const args = ['--project=webkit'];

    // Act
    const { tests } = list(args);

    // Assert: only webkit, including the mocked UI tests; nothing under api, chromium or firefox.
    expect(projectsOf(tests)).toEqual(['webkit']);
    expect(MOCKED_TESTS.every((id) => withId(tests, id).length === 1)).toBe(true);
  });
});
