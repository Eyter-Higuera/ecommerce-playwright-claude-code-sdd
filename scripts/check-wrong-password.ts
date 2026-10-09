import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

// Wrong-password limit (Spec 001, RF-28; plan D-5). Logins with a wrong password for a real account
// could lock the shared demo accounts, so at most one such login for test account A may run per
// Playwright invocation, retries included, and none for account B. Every such login is built with
// `withWrongPassword(<account fixture>)`; this check finds each call with the TypeScript compiler
// API, the test that contains it, the folder (only `tests/api/` runs once, in the `api` project)
// and whether an enclosing describe sets `retries: 0`.

const HELPER_NAME = 'withWrongPassword';
const ACCOUNT_A = 'accountA';
const ACCOUNT_B = 'accountB';
const API_FOLDER = 'tests/api/';
const SPEC_FILE = /\.spec\.ts$/;
// Fixture projects of the unit tests are inputs, not tests of the repository.
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'fixtures', 'dist', 'test-results', 'playwright-report', 'reports']);
const TEST_ROOTS = new Set(['test', 'it']);
const DESCRIBE_NAME = 'describe';
const CONFIGURE_NAME = 'configure';
const RETRIES_PROPERTY = 'retries';

export interface SourceFile {
  /** Path relative to the scanned root, with `/`. */
  file: string;
  source: string;
}

export interface WrongPasswordUse {
  file: string;
  line: number;
  /** Title of the enclosing test; undefined outside a test or when the title is not a literal. */
  title: string | undefined;
  /** The argument of `withWrongPassword(...)` as written, e.g. `accountA`. */
  account: string;
  inApiFolder: boolean;
  retriesZero: boolean;
}

export interface WrongPasswordViolation {
  file: string;
  line: number;
  title: string | undefined;
  account: string;
  reasons: string[];
}

const toPosix = (path: string): string => path.replaceAll('\\', '/');

/** Every `*.spec.ts` under `root`, skipping fixture and output folders, sorted by path. */
export function collectSpecFiles(root: string): SourceFile[] {
  const files: SourceFile[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(path);
      } else if (SPEC_FILE.test(entry.name)) {
        files.push({ file: toPosix(relative(root, path)), source: readFileSync(path, 'utf8') });
      }
    }
  };
  walk(root);
  return files.sort((a, b) => a.file.localeCompare(b.file));
}

/** `test.describe.configure` → ['test', 'describe', 'configure']; undefined for other callees. */
function calleeChain(expression: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression)) {
    const head = calleeChain(expression.expression);
    return head && [...head, expression.name.text];
  }
  return undefined;
}

const isFunctionLike = (node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression => ts.isArrowFunction(node) || ts.isFunctionExpression(node);

function isTestDeclaration(node: ts.CallExpression): boolean {
  const chain = calleeChain(node.expression);
  return chain !== undefined && TEST_ROOTS.has(chain[0] ?? '') && !chain.includes(DESCRIBE_NAME) && node.arguments.some(isFunctionLike);
}

function isDescribe(node: ts.CallExpression): boolean {
  return calleeChain(node.expression)?.includes(DESCRIBE_NAME) === true && node.arguments.some(isFunctionLike);
}

/** True for `test.describe.configure({ retries: 0 })` (any `describe.configure` chain). */
function isRetriesZeroConfigure(node: ts.Node): boolean {
  if (!ts.isExpressionStatement(node) || !ts.isCallExpression(node.expression)) return false;
  const chain = calleeChain(node.expression.expression);
  if (chain?.at(-1) !== CONFIGURE_NAME || !chain.includes(DESCRIBE_NAME)) return false;
  const [options] = node.expression.arguments;
  return (
    options !== undefined &&
    ts.isObjectLiteralExpression(options) &&
    options.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        property.name.getText() === RETRIES_PROPERTY &&
        ts.isNumericLiteral(property.initializer) &&
        Number(property.initializer.text) === 0,
    )
  );
}

/** True when the body of a describe callback configures `retries: 0`. */
function describeSetsRetriesZero(describe: ts.CallExpression): boolean {
  const body = describe.arguments.find(isFunctionLike)?.body;
  return body !== undefined && ts.isBlock(body) && body.statements.some(isRetriesZeroConfigure);
}

function literalText(node: ts.Node | undefined): string | undefined {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

/** Every `withWrongPassword(...)` call of one file, with its enclosing test and describe settings. */
export function findWrongPasswordUses(file: string, source: string): WrongPasswordUse[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const uses: WrongPasswordUse[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === HELPER_NAME) {
      let title: string | undefined;
      let retriesZero = false;
      for (let parent = node.parent; !ts.isSourceFile(parent); parent = parent.parent) {
        if (!ts.isCallExpression(parent)) continue;
        if (title === undefined && isTestDeclaration(parent)) title = literalText(parent.arguments[0]);
        if (isDescribe(parent) && describeSetsRetriesZero(parent)) retriesZero = true;
      }
      uses.push({
        file,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        title,
        account: node.arguments[0]?.getText(sourceFile) ?? '',
        inApiFolder: toPosix(file).startsWith(API_FOLDER),
        retriesZero,
      });
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return uses;
}

/** Uses that break RF-28, each with every reason; an empty list means the limit holds. */
export function findWrongPasswordViolations(files: readonly SourceFile[]): WrongPasswordViolation[] {
  const uses = files.flatMap(({ file, source }) => findWrongPasswordUses(file, source));
  const accountAUses = uses.filter((use) => use.account === ACCOUNT_A).length;
  return uses
    .map((use) => {
      const reasons: string[] = [];
      if (use.account === ACCOUNT_B) reasons.push('account B must never get a wrong password');
      else if (use.account !== ACCOUNT_A) reasons.push(`unknown account argument "${use.account}" (use the ${ACCOUNT_A} fixture)`);
      if (use.account === ACCOUNT_A && accountAUses > 1) reasons.push(`more than one wrong-password test for ${ACCOUNT_A}`);
      if (!use.inApiFolder) reasons.push('not in tests/api/');
      if (!use.retriesZero) reasons.push('not in a describe with retries 0');
      if (use.title === undefined) reasons.push('not inside a test with a literal title');
      return { file: use.file, line: use.line, title: use.title, account: use.account, reasons };
    })
    .filter((violation) => violation.reasons.length > 0);
}
