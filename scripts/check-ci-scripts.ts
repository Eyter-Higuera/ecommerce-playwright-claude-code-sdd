// CI script check (Spec 000, RF-65): CI scripts must not print the environment, because the job
// log would show every variable. Flags `printenv`, a bare `env` (alone or piped/redirected), shell
// tracing (`set -x` and combined flags such as `set -ex`) and the equivalents `export -p` and
// `declare -p`/`declare -x`. `env VAR=value command` (setting a variable) is not printing and is
// allowed; words such as `environment:` or `$CI_ENVIRONMENT_NAME` never match.

export interface EnvPrintingFinding {
  file: string;
  line: number;
  command: string;
}

const PATTERNS: { command: string; pattern: RegExp }[] = [
  { command: 'printenv', pattern: /(^|[\s;&|(`'"-])printenv\b/ },
  { command: 'env', pattern: /(^|[\s;&|(`'"-])env\s*($|[|;&>)`'"])/ },
  { command: 'set -x', pattern: /(^|[\s;&|(`'"-])set\s+-[a-wyz]*x/ },
  { command: 'export -p', pattern: /(^|[\s;&|(`'"-])export\s+-p\b/ },
  { command: 'declare -p', pattern: /(^|[\s;&|(`'"-])declare\s+-[a-z]*[px]\b/ },
];
const COMMENT_LINE = /^\s*#/;

export function findEnvPrinting(content: string, file: string): EnvPrintingFinding[] {
  return content.split(/\r?\n/).flatMap((text, index) =>
    COMMENT_LINE.test(text)
      ? []
      : PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ command }) => ({ file, line: index + 1, command })),
  );
}
