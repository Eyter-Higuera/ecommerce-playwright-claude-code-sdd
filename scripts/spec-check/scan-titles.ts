import ts from 'typescript';

// Finds every test declaration in Playwright (*.spec.ts) and Vitest (*.test.ts) files with the
// TypeScript compiler API (Spec 000, plan decision): it sees `test`/`it` with their modifiers
// (`skip`, `fixme`, `only`, ...), knows which `describe` blocks they sit in, and ignores titles of
// `describe` blocks, which never count as test titles (RF-31).

export interface TestDeclaration {
  /** Path relative to the repository root, with `/`. */
  file: string;
  line: number;
  /** Undefined when the title is not a plain string literal. */
  title: string | undefined;
  /** Declared with skip/fixme/todo, or inside a skipped describe (RF-37). */
  skipped: boolean;
}

const TEST_ROOTS = new Set(['test', 'it']);
const DESCRIBE_NAME = 'describe';
const SKIP_MODIFIERS = new Set(['skip', 'fixme', 'todo']);
const DECLARATION_MODIFIERS = new Set(['only', 'skip', 'fixme', 'todo', 'fail', 'slow', 'concurrent']);

/** `test.describe.skip` → ['test', 'describe', 'skip']; undefined for non-chains. */
function calleeChain(expression: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression)) {
    const head = calleeChain(expression.expression);
    return head && [...head, expression.name.text];
  }
  return undefined;
}

const isFunctionLike = (node: ts.Node): boolean => ts.isArrowFunction(node) || ts.isFunctionExpression(node);

function literalText(node: ts.Node | undefined): string | undefined {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

export function scanTestDeclarations(file: string, source: string): TestDeclaration[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations: TestDeclaration[] = [];

  const visit = (node: ts.Node, insideSkippedDescribe: boolean): void => {
    let skippedScope = insideSkippedDescribe;
    if (ts.isCallExpression(node)) {
      const chain = calleeChain(node.expression);
      const [root, ...modifiers] = chain ?? [];
      const hasBody = node.arguments.some(isFunctionLike);
      if (root !== undefined && chain?.includes(DESCRIBE_NAME) && (root === DESCRIBE_NAME || TEST_ROOTS.has(root))) {
        // A describe block: its title is never a test title; a skipped one skips its children.
        if (modifiers.some((modifier) => SKIP_MODIFIERS.has(modifier))) skippedScope = true;
      } else if (root !== undefined && TEST_ROOTS.has(root) && modifiers.every((modifier) => DECLARATION_MODIFIERS.has(modifier)) && hasBody) {
        const first = node.arguments[0];
        // `test.skip(condition, ...)` inside a body is a conditional skip, not a declaration.
        const isDeclaration = first !== undefined && !isFunctionLike(first) && first.kind !== ts.SyntaxKind.TrueKeyword && first.kind !== ts.SyntaxKind.FalseKeyword;
        if (isDeclaration) {
          declarations.push({
            file,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
            title: literalText(first),
            skipped: skippedScope || modifiers.some((modifier) => SKIP_MODIFIERS.has(modifier)),
          });
        }
      }
    }
    ts.forEachChild(node, (child) => {
      visit(child, skippedScope);
    });
  };

  visit(sourceFile, false);
  return declarations;
}
