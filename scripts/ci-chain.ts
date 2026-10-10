import type { EnvValues } from '../src/config/env';
import { missingEnvVariableMessage } from '../src/errors/messages';
import { connectGitHub, nextBranch, type GitHubHttp } from './ci-promote';

// Regression chain (Spec 000, RF-91): `npm run ci:chain` runs as the last job of a green manual
// regression run on eyter_dev, release or main, and starts the same manual run (same browser and
// layer, marked as chained) on the next branch through the GitHub workflow dispatch API. Each branch
// is tested on its own code: nothing is merged, pushed or promoted. The job's GITHUB_TOKEN is only
// sent as a request header and never printed.

const WORKFLOW_FILE = 'ci.yml';
const REGRESSION = 'regression';
const LAST_BRANCH = 'production';
const REQUIRED_VARIABLES = ['GITHUB_TOKEN', 'GITHUB_API_URL', 'GITHUB_REPOSITORY', 'GITHUB_REF_NAME', 'SUITE', 'BROWSER', 'LAYER'] as const;
const DISPATCHED = 204;
const SUCCESS = 0;
const FAILURE = 1;

export interface ChainDeps {
  /** Opens the API with the token; called only when a dispatch is due. */
  connect(apiUrl: string, token: string): GitHubHttp;
}

export interface ChainResult {
  exitCode: number;
  output: string[];
}

const done = (exitCode: number, output: string): ChainResult => ({ exitCode, output: [output] });
const messageOf = (json: unknown): string => {
  const message = (json as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : JSON.stringify(json ?? '');
};

/** RF-91: dispatches the same manual regression run on the next branch. */
export async function chain(env: EnvValues, deps: ChainDeps): Promise<ChainResult> {
  const missing = REQUIRED_VARIABLES.find((name) => (env[name] ?? '').trim() === '');
  if (missing !== undefined) return done(FAILURE, missingEnvVariableMessage(missing));
  const value = (name: (typeof REQUIRED_VARIABLES)[number]): string => (env[name] ?? '').trim();
  const branch = value('GITHUB_REF_NAME');

  if (value('SUITE') !== REGRESSION) return done(SUCCESS, 'Only a regression run continues on the next branch; nothing dispatched');
  if (branch === LAST_BRANCH) return done(SUCCESS, `${LAST_BRANCH} is the last branch: the regression chain ends here`);
  const next = nextBranch(branch);
  if (next === undefined) return done(FAILURE, `Branch ${branch} is not a promotion branch; nothing dispatched`);

  const api = deps.connect(value('GITHUB_API_URL'), value('GITHUB_TOKEN'));
  const path = `/repos/${value('GITHUB_REPOSITORY')}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const inputs = { suite: REGRESSION, browser: value('BROWSER'), layer: value('LAYER'), chained: 'true' };
  try {
    const response = await api.request('POST', path, { ref: next, inputs });
    if (response.status !== DISPATCHED) {
      return done(FAILURE, `Regression chain ${branch} → ${next} failed: GitHub answered ${String(response.status)}: ${messageOf(response.json)}`);
    }
  } catch (error) {
    return done(FAILURE, `Regression chain ${branch} → ${next} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return done(SUCCESS, `Regression continues on ${next}`);
}

async function main(): Promise<void> {
  const result = await chain(process.env, { connect: (apiUrl, token) => connectGitHub(apiUrl, token, 'ci-chain') });
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) void main();
