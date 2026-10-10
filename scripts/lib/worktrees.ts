import { homedir } from 'node:os';
import { join } from 'node:path';
import type { EnvValues } from '../../src/config/env';

// Where `npm run test:branch` keeps its worktrees (Spec 000, RF-98): outside the repository and
// outside OneDrive, so lint, typecheck and cloud sync never see them. Shared by run-branch.ts and
// failure-report.ts (`--branch`).

const APP_FOLDER = 'ecommerce-playwright-sdd';
const WORKTREES_FOLDER = 'worktrees';

/** TEST_BRANCH_WORKTREES when set, else the per-user cache folder (%LOCALAPPDATA% or ~/.cache). */
export function worktreesDir(env: EnvValues): string {
  const override = env.TEST_BRANCH_WORKTREES;
  if (override !== undefined && override.trim() !== '') return override;
  const base = env.LOCALAPPDATA ?? join(env.HOME ?? env.USERPROFILE ?? homedir(), '.cache');
  return join(base, APP_FOLDER, WORKTREES_FOLDER);
}
