import { describe, expect, it } from 'vitest';
import { MERGEABLE_WAIT_MS, nextBranch, promote, type GitLabHttp, type GitLabResponse } from '../../../scripts/ci-promote';

// Spec 000 — Framework foundation. RF-72 to RF-77: after a green push pipeline, `npm run ci:promote`
// merges the tested commit into the next branch through a merge request. Every test talks to a stub
// GitLab API (unit tests have no network) that records each call, so the requests themselves
// (merge request options, pinned SHA) are asserted, not only the exit code.
const SUCCESS_EXIT_CODE = 0;
const TOKEN = 'TEST_promotion_token';
const SHA = 'TEST_sha_0001';
const MR_IID = 7;
const BASE_ENV = {
  PROMOTION_TOKEN: TOKEN,
  CI_API_V4_URL: 'https://gitlab.example.test/api/v4',
  CI_PROJECT_ID: '123',
  CI_COMMIT_BRANCH: 'eyter_dev',
  CI_COMMIT_SHA: SHA,
};

interface StubOptions {
  /** Commits of the pipeline's SHA that the target branch does not have. */
  newCommits?: number;
  /** IID of an already open promotion merge request. */
  openMergeRequest?: number;
  /** detailed_merge_status answers, in order; the last one repeats. */
  statuses?: string[];
  mergeResponse?: GitLabResponse;
}

interface RecordedCall {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
}

/** Stub GitLab API: answers the promotion calls from its options and records every call. */
class StubGitLab implements GitLabHttp {
  readonly calls: RecordedCall[] = [];
  private statusIndex = 0;

  constructor(private readonly options: StubOptions = {}) {}

  request(method: string, path: string, body?: Record<string, unknown>): Promise<GitLabResponse> {
    this.calls.push({ method, path, body });
    return Promise.resolve(this.answer(method, path));
  }

  private answer(method: string, path: string): GitLabResponse {
    const { newCommits = 1, openMergeRequest, statuses = ['mergeable'], mergeResponse = { status: 200, json: { state: 'merged' } } } = this.options;
    if (path.includes('/repository/compare')) return { status: 200, json: { commits: Array.from({ length: newCommits }, (_, index) => ({ id: `TEST_${String(index)}` })) } };
    if (method === 'GET' && path.includes('/merge_requests?')) return { status: 200, json: openMergeRequest === undefined ? [] : [{ iid: openMergeRequest }] };
    if (method === 'POST' && path.endsWith('/merge_requests')) return { status: 201, json: { iid: MR_IID } };
    if (method === 'PUT' && path.endsWith('/merge')) return mergeResponse;
    if (method === 'GET' && /\/merge_requests\/\d+$/.test(path)) {
      const status = statuses[Math.min(this.statusIndex, statuses.length - 1)];
      this.statusIndex += 1;
      return { status: 200, json: { detailed_merge_status: status } };
    }
    return { status: 404, json: { message: '404 Not Found' } };
  }

  callsTo(method: string, pathPart: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method && call.path.includes(pathPart));
  }
}

/** Runs a promotion against the stub, with an instant sleep that only counts the waited time. */
async function runPromotion(env: Record<string, string | undefined>, api: StubGitLab) {
  let connections = 0;
  let waitedMs = 0;
  const result = await promote(env, {
    connect: () => {
      connections += 1;
      return api;
    },
    sleep: (ms) => {
      waitedMs += ms;
      return Promise.resolve();
    },
  });
  return { ...result, text: result.output.join('\n'), connections, waitedMs };
}

describe('CI promotion — positive', () => {
  it('TC-000-103 promotion creates a merge request and merges the tested commit', async () => {
    // Arrange: eyter_dev has one commit that release lacks, and no promotion MR is open.
    const api = new StubGitLab({ newCommits: 1 });

    // Act
    const result = await runPromotion(BASE_ENV, api);

    // Assert: one MR eyter_dev → release that keeps its source branch (RF-72, RF-76) ...
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    const created = api.callsTo('POST', '/merge_requests');
    expect(created).toHaveLength(1);
    expect(created[0]?.body).toMatchObject({ source_branch: 'eyter_dev', target_branch: 'release', remove_source_branch: false });
    // ... merged pinned to the tested commit, so a newer untested commit can never slip in (RF-74).
    const merges = api.callsTo('PUT', `/merge_requests/${String(MR_IID)}/merge`);
    expect(merges).toHaveLength(1);
    expect(merges[0]?.body).toEqual({ sha: SHA, should_remove_source_branch: false });
    // The output names source, target and MR, and never the token (RF-77).
    expect(result.text).toContain('eyter_dev');
    expect(result.text).toContain('release');
    expect(result.text).toContain(`!${String(MR_IID)}`);
    expect(result.text).not.toContain(TOKEN);
  });

  it('TC-000-104 promotion reuses an open merge request', async () => {
    // Arrange: a promotion MR release → main is already open.
    const openIid = 42;
    const api = new StubGitLab({ openMergeRequest: openIid });

    // Act
    const result = await runPromotion({ ...BASE_ENV, CI_COMMIT_BRANCH: 'release' }, api);

    // Assert: no second MR; the open one is merged with the tested commit.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(api.callsTo('POST', '/merge_requests')).toEqual([]);
    expect(api.callsTo('PUT', `/merge_requests/${String(openIid)}/merge`)[0]?.body).toEqual({ sha: SHA, should_remove_source_branch: false });
  });
});

describe('CI promotion — boundary', () => {
  it('TC-000-105 promotion passes when the target is already up to date', async () => {
    // Arrange: production already contains every commit of the main pipeline.
    const api = new StubGitLab({ newCommits: 0 });

    // Act
    const result = await runPromotion({ ...BASE_ENV, CI_COMMIT_BRANCH: 'main' }, api);

    // Assert: success with the RF-75 message, and nothing created or merged.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.text).toContain('production is already up to date');
    expect(api.callsTo('POST', '/merge_requests')).toEqual([]);
    expect(api.callsTo('PUT', '/merge')).toEqual([]);
  });

  it('TC-000-107 promotion fails when the merge request is not mergeable in time', async () => {
    // Arrange: one MR never leaves `checking`; another one has a conflict.
    const neverReady = new StubGitLab({ statuses: ['checking'] });
    const conflict = new StubGitLab({ statuses: ['checking', 'conflict'] });

    // Act
    const timedOut = await runPromotion(BASE_ENV, neverReady);
    const conflicted = await runPromotion(BASE_ENV, conflict);

    // Assert: both stop without merging, naming source, target and the reason (RF-74).
    expect(timedOut.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(timedOut.text).toMatch(/eyter_dev.*release/);
    expect(timedOut.text).toContain(`not mergeable within ${String(MERGEABLE_WAIT_MS / 1000)} s`);
    expect(timedOut.waitedMs).toBe(MERGEABLE_WAIT_MS);
    expect(neverReady.callsTo('PUT', '/merge')).toEqual([]);
    expect(conflicted.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(conflicted.text).toMatch(/eyter_dev.*release/);
    expect(conflicted.text).toContain('conflict');
    expect(conflict.callsTo('PUT', '/merge')).toEqual([]);
  });
});

describe('CI promotion — negative', () => {
  it('TC-000-102 the next branch is release, main, production and none after that', async () => {
    // Arrange
    const branches = ['eyter_dev', 'release', 'main', 'production', 'TEST_feature'];
    const api = new StubGitLab();

    // Act
    const targets = branches.map((branch) => nextBranch(branch));
    const fromProduction = await runPromotion({ ...BASE_ENV, CI_COMMIT_BRANCH: 'production' }, api);

    // Assert: the promotion order; production (the last branch) and other branches have none,
    // and promoting from them fails naming the branch without calling GitLab (RF-72, RF-73).
    expect(targets).toEqual(['release', 'main', 'production', undefined, undefined]);
    expect(fromProduction.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(fromProduction.text).toContain('production');
    expect(api.calls).toEqual([]);
  });

  it('TC-000-106 promotion fails when the source branch moved past the tested commit', async () => {
    // Arrange: GitLab refuses the merge because eyter_dev's HEAD is no longer the tested commit.
    const api = new StubGitLab({ mergeResponse: { status: 409, json: { message: 'SHA does not match HEAD of source branch' } } });

    // Act
    const result = await runPromotion(BASE_ENV, api);

    // Assert: failure naming source, target and GitLab's reason (RF-74).
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.text).toMatch(/eyter_dev.*release/);
    expect(result.text).toContain('SHA does not match HEAD of source branch');
  });
});

describe('CI promotion — security', () => {
  it('TC-000-108 promotion without PROMOTION_TOKEN fails naming the variable', async () => {
    // Arrange: the variable is absent in one run and whitespace-only in the other.
    const withoutToken = { ...BASE_ENV, PROMOTION_TOKEN: undefined };
    const api = new StubGitLab();

    // Act
    const missing = await runPromotion(withoutToken, api);
    const blank = await runPromotion({ ...BASE_ENV, PROMOTION_TOKEN: '   ' }, api);

    // Assert: the RF-17 style message names the variable, and GitLab is never contacted (RF-77).
    for (const result of [missing, blank]) {
      expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
      expect(result.text).toContain('Missing required environment variable: PROMOTION_TOKEN');
      expect(result.connections).toBe(0);
    }
    expect(api.calls).toEqual([]);
  });
});
