import type { EnvValues } from '../src/config/env';
import { API_TIMEOUT_MS } from '../src/config/timeouts';
import { missingEnvVariableMessage } from '../src/errors/messages';

// Branch promotion (Spec 000, RF-72 to RF-77): `npm run ci:promote` runs as the last job of a green
// push run of the GitHub Actions workflow on eyter_dev, release or main, and merges the run's commit
// into the next branch through the GitHub merges API. The merge is pinned to the tested SHA, and the
// promotion refuses to run when the source branch has moved past it, so an untested commit is never
// promoted. Branches are only read and merged into: nothing is force-pushed or deleted. The token is
// only sent as a request header and never printed.

export const PROMOTION_ORDER = ['eyter_dev', 'release', 'main', 'production'] as const;

const REQUIRED_VARIABLES = ['PROMOTION_TOKEN', 'GITHUB_API_URL', 'GITHUB_REPOSITORY', 'GITHUB_REF_NAME', 'GITHUB_SHA'] as const;
/** GitHub compare statuses meaning "the target already contains the commit". */
const UP_TO_DATE_STATUSES = new Set(['identical', 'behind']);
const MERGED = 201;
const NOTHING_TO_MERGE = 204;
const SUCCESS = 0;
const FAILURE = 1;
const API_VERSION = '2022-11-28';

export interface GitHubResponse {
  status: number;
  json: unknown;
}

/** The GitHub REST API as the promotion uses it; paths are relative to GITHUB_API_URL. */
export interface GitHubHttp {
  request(method: string, path: string, body?: Record<string, unknown>): Promise<GitHubResponse>;
}

export interface PromoteDeps {
  /** Opens the API with the token; called only once every required variable is present. */
  connect(apiUrl: string, token: string): GitHubHttp;
}

export interface PromoteResult {
  exitCode: number;
  output: string[];
}

/** RF-72: the branch a green run on `branch` promotes to; undefined for the last or any other branch. */
export function nextBranch(branch: string): string | undefined {
  const index = (PROMOTION_ORDER as readonly string[]).indexOf(branch);
  return index === -1 ? undefined : PROMOTION_ORDER[index + 1];
}

const ok = (output: string): PromoteResult => ({ exitCode: SUCCESS, output: [output] });
const failed = (output: string): PromoteResult => ({ exitCode: FAILURE, output: [output] });
const messageOf = (json: unknown): string => {
  const message = (json as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : JSON.stringify(message ?? json);
};

/** RF-72 to RF-77: promotes the run's commit to the next branch. */
export async function promote(env: EnvValues, deps: PromoteDeps): Promise<PromoteResult> {
  // RF-77: every variable must be present before GitHub is contacted (whitespace counts as missing).
  const missing = REQUIRED_VARIABLES.find((name) => (env[name] ?? '').trim() === '');
  if (missing !== undefined) return failed(missingEnvVariableMessage(missing));
  const value = (name: (typeof REQUIRED_VARIABLES)[number]): string => (env[name] ?? '').trim();
  const source = value('GITHUB_REF_NAME');
  const sha = value('GITHUB_SHA');

  // RF-73: production is the last branch, and other branches are never promoted.
  const target = nextBranch(source);
  if (target === undefined) return failed(`Branch ${source} has no promotion target; nothing merged`);

  const api = deps.connect(value('GITHUB_API_URL'), value('PROMOTION_TOKEN'));
  const repo = `/repos/${value('GITHUB_REPOSITORY')}`;
  const stop = (reason: string): PromoteResult => failed(`Promotion ${source} → ${target} failed: ${reason}; nothing merged`);
  const call = async (method: string, path: string, body?: Record<string, unknown>): Promise<GitHubResponse> => {
    const response = await api.request(method, `${repo}${path}`, body);
    if (response.status < 200 || response.status >= 300) throw new Error(`GitHub answered ${String(response.status)} to ${method} ${path}: ${messageOf(response.json)}`);
    return response;
  };

  try {
    // RF-74: the tested commit must still be the source branch's tip.
    const branch = (await call('GET', `/branches/${encodeURIComponent(source)}`)).json as { commit?: { sha?: string } };
    if (branch.commit?.sha !== sha) return stop(`${source} moved past the tested commit ${sha}`);

    // RF-75: nothing to promote when the target already contains the commit.
    const compare = (await call('GET', `/compare/${encodeURIComponent(target)}...${encodeURIComponent(sha)}`)).json as { status?: string };
    if (UP_TO_DATE_STATUSES.has(compare.status ?? '')) return ok(`${target} is already up to date with ${source} (${sha})`);

    // RF-72 / RF-74 / RF-76: merge exactly the tested commit into the target; the source is kept.
    const merge = await call('POST', '/merges', { base: target, head: sha, commit_message: `Promote ${source} to ${target} (${sha})` });
    if (merge.status === NOTHING_TO_MERGE) return ok(`${target} is already up to date with ${source} (${sha})`);
    if (merge.status !== MERGED) return stop(`unexpected answer ${String(merge.status)}`);
    return ok(`Promoted ${source} → ${target}: merged ${sha}`);
  } catch (error) {
    return stop(error instanceof Error ? error.message : String(error));
  }
}

/** Real GitHub API over fetch; the token travels only in the Authorization header. */
function connectGitHub(apiUrl: string, token: string): GitHubHttp {
  const base = apiUrl.replace(/\/+$/, '');
  return {
    async request(method, path, body) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': API_VERSION,
          'User-Agent': 'ci-promote',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      const text = await response.text();
      let json: unknown = text;
      try {
        json = text === '' ? undefined : JSON.parse(text);
      } catch {
        // Not JSON: keep the raw text as the reason.
      }
      return { status: response.status, json };
    },
  };
}

async function main(): Promise<void> {
  const result = await promote(process.env, { connect: connectGitHub });
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) void main();
