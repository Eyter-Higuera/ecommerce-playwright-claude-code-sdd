import type { EnvValues } from '../src/config/env';
import { API_TIMEOUT_MS } from '../src/config/timeouts';
import { missingEnvVariableMessage } from '../src/errors/messages';

// Branch promotion (Spec 000, RF-72 to RF-77): `npm run ci:promote` runs as the last job of a green
// push pipeline on eyter_dev, release or main, and merges the pipeline's commit into the next branch
// through a merge request. The merge is pinned to the tested SHA, so a commit pushed while the
// pipeline ran is never promoted untested. The source branch is always kept. The token is only
// sent as a request header and never printed.

export const PROMOTION_ORDER = ['eyter_dev', 'release', 'main', 'production'] as const;

/** RF-74: how long a merge request may stay "checking" before the promotion gives up. */
export const MERGEABLE_WAIT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const MERGEABLE = 'mergeable';
/** detailed_merge_status values that only mean "GitLab has not finished checking yet". */
const TRANSIENT_STATUSES = new Set(['checking', 'unchecked', 'preparing', 'approvals_syncing']);
const REQUIRED_VARIABLES = ['PROMOTION_TOKEN', 'CI_API_V4_URL', 'CI_PROJECT_ID', 'CI_COMMIT_BRANCH', 'CI_COMMIT_SHA'] as const;
const SUCCESS = 0;
const FAILURE = 1;

export interface GitLabResponse {
  status: number;
  json: unknown;
}

/** The GitLab REST API as the promotion uses it; paths are relative to CI_API_V4_URL. */
export interface GitLabHttp {
  request(method: string, path: string, body?: Record<string, unknown>): Promise<GitLabResponse>;
}

export interface PromoteDeps {
  /** Opens the API with the token; called only once every required variable is present. */
  connect(apiUrl: string, token: string): GitLabHttp;
  sleep(ms: number): Promise<void>;
}

export interface PromoteResult {
  exitCode: number;
  output: string[];
}

/** RF-72: the branch a green pipeline on `branch` promotes to; undefined for the last or any other branch. */
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

/** RF-72 to RF-77: promotes the pipeline's commit to the next branch. */
export async function promote(env: EnvValues, deps: PromoteDeps): Promise<PromoteResult> {
  // RF-77: every variable must be present before GitLab is contacted (whitespace counts as missing).
  const missing = REQUIRED_VARIABLES.find((name) => (env[name] ?? '').trim() === '');
  if (missing !== undefined) return failed(missingEnvVariableMessage(missing));
  const value = (name: (typeof REQUIRED_VARIABLES)[number]): string => (env[name] ?? '').trim();
  const source = value('CI_COMMIT_BRANCH');
  const sha = value('CI_COMMIT_SHA');

  // RF-73: production is the last branch, and other branches are never promoted.
  const target = nextBranch(source);
  if (target === undefined) return failed(`Branch ${source} has no promotion target; nothing merged`);

  const api = deps.connect(value('CI_API_V4_URL'), value('PROMOTION_TOKEN'));
  const project = `/projects/${encodeURIComponent(value('CI_PROJECT_ID'))}`;
  const stop = (reason: string): PromoteResult => failed(`Promotion ${source} → ${target} failed: ${reason}; nothing merged`);
  const call = async (method: string, path: string, body?: Record<string, unknown>): Promise<unknown> => {
    const response = await api.request(method, `${project}${path}`, body);
    if (response.status < 200 || response.status >= 300) throw new Error(`GitLab answered ${String(response.status)} to ${method} ${path}: ${messageOf(response.json)}`);
    return response.json;
  };

  try {
    // RF-75: nothing to promote when the target already has the commit.
    const compare = (await call('GET', `/repository/compare?from=${encodeURIComponent(target)}&to=${encodeURIComponent(sha)}`)) as { commits?: unknown[] };
    if ((compare.commits ?? []).length === 0) return ok(`${target} is already up to date with ${source} (${sha})`);

    // RF-72: reuse the open promotion merge request, or open one that keeps the source branch (RF-76).
    const query = `state=opened&source_branch=${encodeURIComponent(source)}&target_branch=${encodeURIComponent(target)}`;
    const open = (await call('GET', `/merge_requests?${query}`)) as { iid: number }[];
    const iid = open[0]?.iid ?? ((await call('POST', '/merge_requests', {
      source_branch: source,
      target_branch: target,
      title: `Promote ${source} to ${target}`,
      remove_source_branch: false,
    })) as { iid: number }).iid;

    // RF-74: wait (bounded) until GitLab says the merge request can be merged.
    let status = '';
    for (let waited = 0; ; waited += POLL_INTERVAL_MS) {
      status = ((await call('GET', `/merge_requests/${String(iid)}`)) as { detailed_merge_status?: string }).detailed_merge_status ?? '';
      if (!TRANSIENT_STATUSES.has(status)) break;
      if (waited >= MERGEABLE_WAIT_MS) return stop(`merge request !${String(iid)} not mergeable within ${String(MERGEABLE_WAIT_MS / 1000)} s (status: ${status})`);
      await deps.sleep(POLL_INTERVAL_MS);
    }
    if (status !== MERGEABLE) return stop(`merge request !${String(iid)} cannot be merged (status: ${status})`);

    // RF-74 / RF-76: merge exactly the tested commit and keep the source branch.
    await call('PUT', `/merge_requests/${String(iid)}/merge`, { sha, should_remove_source_branch: false });
    return ok(`Promoted ${source} → ${target}: merge request !${String(iid)} merged at ${sha}`);
  } catch (error) {
    return stop(error instanceof Error ? error.message : String(error));
  }
}

/** Real GitLab API over fetch; the token travels only in the PRIVATE-TOKEN header. */
function connectGitLab(apiUrl: string, token: string): GitLabHttp {
  const base = apiUrl.replace(/\/+$/, '');
  return {
    async request(method, path, body) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { 'PRIVATE-TOKEN': token, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      const text = await response.text();
      let json: unknown = text;
      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON: keep the raw text as the reason.
      }
      return { status: response.status, json };
    },
  };
}

async function main(): Promise<void> {
  const result = await promote(process.env, {
    connect: connectGitLab,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) void main();
