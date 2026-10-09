import { describe, expect, it } from 'vitest';
import { nextBranch, promote, type GitHubHttp, type GitHubResponse } from '../../../scripts/ci-promote';

// Spec 000 — Framework foundation. RF-72 to RF-77: after a green push run on GitHub Actions,
// `npm run ci:promote` merges the tested commit into the next branch through the GitHub merges API.
// Every test talks to a stub GitHub API (unit tests have no network) that records each call, so the
// requests themselves (pinned SHA, target branch) are asserted, not only the exit code.
const SUCCESS_EXIT_CODE = 0;
const TOKEN = 'TEST_promotion_token';
const SHA = 'TEST_sha_0001';
const REPOSITORY = 'TEST_owner/TEST_repo';
const BASE_ENV = {
  PROMOTION_TOKEN: TOKEN,
  GITHUB_API_URL: 'https://api.github.example.test',
  GITHUB_REPOSITORY: REPOSITORY,
  GITHUB_REF_NAME: 'eyter_dev',
  GITHUB_SHA: SHA,
};

interface StubOptions {
  /** Current tip of the source branch (the tested commit unless the branch moved). */
  sourceTip?: string;
  /** Status of the tested commit relative to the target branch (GitHub compare API). */
  compareStatus?: 'ahead' | 'behind' | 'identical' | 'diverged';
  mergeResponse?: GitHubResponse;
}

interface RecordedCall {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
}

/** Stub GitHub API: answers the promotion calls from its options and records every call. */
class StubGitHub implements GitHubHttp {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly options: StubOptions = {}) {}

  request(method: string, path: string, body?: Record<string, unknown>): Promise<GitHubResponse> {
    this.calls.push({ method, path, body });
    return Promise.resolve(this.answer(method, path));
  }

  private answer(method: string, path: string): GitHubResponse {
    const { sourceTip = SHA, compareStatus = 'ahead', mergeResponse = { status: 201, json: { sha: 'TEST_merge_commit' } } } = this.options;
    if (method === 'GET' && path.includes('/branches/')) return { status: 200, json: { commit: { sha: sourceTip } } };
    if (method === 'GET' && path.includes('/compare/')) return { status: 200, json: { status: compareStatus } };
    if (method === 'POST' && path.endsWith('/merges')) return mergeResponse;
    return { status: 404, json: { message: 'Not Found' } };
  }

  callsTo(method: string, pathPart: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method && call.path.includes(pathPart));
  }
}

/** Runs a promotion against the stub and counts the API connections. */
async function runPromotion(env: Record<string, string | undefined>, api: StubGitHub) {
  let connections = 0;
  const result = await promote(env, {
    connect: () => {
      connections += 1;
      return api;
    },
  });
  return { ...result, text: result.output.join('\n'), connections };
}

describe('CI promotion — positive', () => {
  it('TC-000-103 promotion merges the tested commit into the next branch', async () => {
    // Arrange: the tested commit is still eyter_dev's tip and release lacks it.
    const api = new StubGitHub({ compareStatus: 'ahead' });

    // Act
    const result = await runPromotion(BASE_ENV, api);

    // Assert: one merge into release of exactly the tested commit, so a newer untested commit can
    // never slip in (RF-72, RF-74); branches are only read, never deleted (RF-76).
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    const merges = api.callsTo('POST', `/repos/${REPOSITORY}/merges`);
    expect(merges).toHaveLength(1);
    expect(merges[0]?.body).toMatchObject({ base: 'release', head: SHA });
    expect(api.calls.every((call) => call.method === 'GET' || call.method === 'POST')).toBe(true);
    // The output names source, target and commit, and never the token (RF-77).
    expect(result.text).toContain('eyter_dev');
    expect(result.text).toContain('release');
    expect(result.text).toContain(SHA);
    expect(result.text).not.toContain(TOKEN);
  });

  it('TC-000-104 promotion from release and main targets the next branch', async () => {
    // Arrange: one run on release and one on main, each with a new commit for its target.
    const fromRelease = new StubGitHub();
    const fromMain = new StubGitHub();

    // Act
    await runPromotion({ ...BASE_ENV, GITHUB_REF_NAME: 'release' }, fromRelease);
    await runPromotion({ ...BASE_ENV, GITHUB_REF_NAME: 'main' }, fromMain);

    // Assert: release merges into main and main into production, each pinned to the tested commit.
    expect(fromRelease.callsTo('POST', '/merges')[0]?.body).toMatchObject({ base: 'main', head: SHA });
    expect(fromMain.callsTo('POST', '/merges')[0]?.body).toMatchObject({ base: 'production', head: SHA });
  });
});

describe('CI promotion — boundary', () => {
  it('TC-000-105 promotion passes when the target is already up to date', async () => {
    // Arrange: production already contains the tested commit (identical, or the commit is behind it).
    const identical = new StubGitHub({ compareStatus: 'identical' });
    const behind = new StubGitHub({ compareStatus: 'behind' });

    // Act
    const results = [await runPromotion({ ...BASE_ENV, GITHUB_REF_NAME: 'main' }, identical), await runPromotion({ ...BASE_ENV, GITHUB_REF_NAME: 'main' }, behind)];

    // Assert: success with the RF-75 message, and nothing merged.
    for (const result of results) {
      expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
      expect(result.text).toContain('production is already up to date');
    }
    expect([...identical.callsTo('POST', '/merges'), ...behind.callsTo('POST', '/merges')]).toEqual([]);
  });

  it('TC-000-107 promotion fails on a merge conflict', async () => {
    // Arrange: GitHub refuses the merge with a conflict.
    const api = new StubGitHub({ mergeResponse: { status: 409, json: { message: 'Merge conflict' } } });

    // Act
    const result = await runPromotion(BASE_ENV, api);

    // Assert: failure naming source, target and GitHub's reason; nothing merged (RF-74).
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.text).toMatch(/eyter_dev.*release/);
    expect(result.text).toContain('Merge conflict');
    expect(result.text).toContain('nothing merged');
  });
});

describe('CI promotion — negative', () => {
  it('TC-000-102 the next branch is release, main, production and none after that', async () => {
    // Arrange
    const branches = ['eyter_dev', 'release', 'main', 'production', 'TEST_feature'];
    const api = new StubGitHub();

    // Act
    const targets = branches.map((branch) => nextBranch(branch));
    const fromProduction = await runPromotion({ ...BASE_ENV, GITHUB_REF_NAME: 'production' }, api);

    // Assert: the promotion order; production (the last branch) and other branches have none, and
    // promoting from them fails naming the branch without calling GitHub (RF-72, RF-73).
    expect(targets).toEqual(['release', 'main', 'production', undefined, undefined]);
    expect(fromProduction.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(fromProduction.text).toContain('production');
    expect(api.calls).toEqual([]);
  });

  it('TC-000-106 promotion fails when the source branch moved past the tested commit', async () => {
    // Arrange: eyter_dev's tip is no longer the tested commit.
    const api = new StubGitHub({ sourceTip: 'TEST_sha_newer' });

    // Act
    const result = await runPromotion(BASE_ENV, api);

    // Assert: failure naming source and target, and no merge attempted (RF-74).
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.text).toMatch(/eyter_dev.*release/);
    expect(result.text).toContain('moved past');
    expect(api.callsTo('POST', '/merges')).toEqual([]);
  });
});

describe('CI promotion — security', () => {
  it('TC-000-108 promotion without PROMOTION_TOKEN fails naming the variable', async () => {
    // Arrange: the variable is absent in one run and whitespace-only in the other.
    const withoutToken = { ...BASE_ENV, PROMOTION_TOKEN: undefined };
    const api = new StubGitHub();

    // Act
    const missing = await runPromotion(withoutToken, api);
    const blank = await runPromotion({ ...BASE_ENV, PROMOTION_TOKEN: '   ' }, api);

    // Assert: the RF-17 style message names the variable, and GitHub is never contacted (RF-77).
    for (const result of [missing, blank]) {
      expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
      expect(result.text).toContain('Missing required environment variable: PROMOTION_TOKEN');
      expect(result.connections).toBe(0);
    }
    expect(api.calls).toEqual([]);
  });
});
