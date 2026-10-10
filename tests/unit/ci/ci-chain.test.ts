import { describe, expect, it } from 'vitest';
import { chain } from '../../../scripts/ci-chain';
import type { GitHubHttp, GitHubResponse } from '../../../scripts/ci-promote';

// Spec 000 — Framework foundation. RF-91: after a green manual regression run, `npm run ci:chain`
// starts the same manual run on the next branch through the GitHub workflow dispatch API, so a
// regression started on eyter_dev runs on release, main and production in order. It never merges.
// Every test talks to a stub GitHub API (unit tests have no network) that records each call.
const SUCCESS_EXIT_CODE = 0;
const TOKEN = 'TEST_dispatch_token';
const API_URL = 'https://api.github.example.test';
const BASE_ENV = {
  GITHUB_TOKEN: TOKEN,
  GITHUB_API_URL: API_URL,
  GITHUB_REPOSITORY: 'TEST_owner/TEST_repo',
  GITHUB_REF_NAME: 'eyter_dev',
  SUITE: 'regression',
  BROWSER: 'all',
  LAYER: 'api',
};
const DISPATCH_PATH = '/repos/TEST_owner/TEST_repo/actions/workflows/ci.yml/dispatches';
const DISPATCHED = 204;
const FORBIDDEN = 403;

interface RecordedCall {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
}

/** Stub GitHub API: answers every dispatch with `response` and records the calls. */
class StubGitHub implements GitHubHttp {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly response: GitHubResponse = { status: DISPATCHED, json: undefined }) {}

  request(method: string, path: string, body?: Record<string, unknown>): Promise<GitHubResponse> {
    this.calls.push({ method, path, body });
    return Promise.resolve(this.response);
  }
}

async function runChain(env: Record<string, string | undefined>, api = new StubGitHub()) {
  const connections: { apiUrl: string; token: string }[] = [];
  const result = await chain(env, {
    connect: (apiUrl, token) => {
      connections.push({ apiUrl, token });
      return api;
    },
  });
  return { ...result, text: result.output.join('\n'), api, connections };
}

describe('Regression chain — positive', () => {
  it('TC-000-142 a passing regression run dispatches the same run on the next branch', async () => {
    // Arrange: a green regression run on each branch that has a next one.
    const hops = [['eyter_dev', 'release'], ['release', 'main'], ['main', 'production']] as const;

    // Act
    const runs = await Promise.all(hops.map(([branch]) => runChain({ ...BASE_ENV, GITHUB_REF_NAME: branch })));

    // Assert: exactly one dispatch per run, on the next branch, with the same choices and the
    // chained mark; the token is only handed to the API connection, never printed or sent as data.
    runs.forEach((run, index) => {
      const next = hops[index]?.[1] ?? '';
      expect(run.exitCode).toBe(SUCCESS_EXIT_CODE);
      expect(run.api.calls).toEqual([
        { method: 'POST', path: DISPATCH_PATH, body: { ref: next, inputs: { suite: 'regression', browser: 'all', layer: 'api', chained: 'true' } } },
      ]);
      expect(run.text).toBe(`Regression continues on ${next}`);
      expect(run.connections).toEqual([{ apiUrl: API_URL, token: TOKEN }]);
      expect(JSON.stringify(run.api.calls)).not.toContain(TOKEN);
    });
  });
});

describe('Regression chain — negative', () => {
  it('TC-000-143 the chain stops on production, on smoke and on a refused dispatch', async () => {
    // Arrange + Act: the last branch, a smoke run, a dispatch GitHub refuses, and a missing token.
    const production = await runChain({ ...BASE_ENV, GITHUB_REF_NAME: 'production' });
    const smoke = await runChain({ ...BASE_ENV, SUITE: 'smoke' });
    const refused = await runChain(BASE_ENV, new StubGitHub({ status: FORBIDDEN, json: { message: 'Resource not accessible by integration' } }));
    const noToken = await runChain({ ...BASE_ENV, GITHUB_TOKEN: '  ' });

    // Assert: production ends the chain and smoke never chains, both without a call; a refused
    // dispatch fails naming the next branch and GitHub's reason; a missing token fails before any call.
    expect(production.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(production.text).toBe('production is the last branch: the regression chain ends here');
    expect(production.connections).toEqual([]);
    expect(smoke.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(smoke.text).toBe('Only a regression run continues on the next branch; nothing dispatched');
    expect(smoke.connections).toEqual([]);
    expect(refused.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(refused.text).toBe('Regression chain eyter_dev → release failed: GitHub answered 403: Resource not accessible by integration');
    expect(noToken.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(noToken.text).toContain('GITHUB_TOKEN');
    expect(noToken.connections).toEqual([]);
  });
});
