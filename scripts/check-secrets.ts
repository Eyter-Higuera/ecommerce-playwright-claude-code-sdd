import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadEnv } from '../src/config/env';
import { SENSITIVE_ENV_VARIABLES } from '../src/security/redact';
import { readZipEntries } from './lib/zip-reader';

// `npm run check:secrets` (Spec 000, RF-23 / RF-24): scans the report and artifact folders for the
// configured passwords (plain and URL-encoded) and for auth tokens, looking inside zip archives
// (Playwright traces) and inside the HTML report's embedded base64 zip. Findings name the file and
// the variable; the output never contains a sensitive value.

export interface Secret {
  name: string;
  value: string;
}

export interface SecretFinding {
  /** Path relative to the root; `archive!entry` for a file inside a zip. */
  file: string;
  variable: string;
}

export interface SecretsScanResult {
  exitCode: number;
  findings: SecretFinding[];
  output: string[];
}

export const SCANNED_FOLDERS = ['reports', 'playwright-report', 'test-results'];
export const TOKEN_LABEL = 'auth token';
// The shop's auth token is a JWT: header and payload are base64url JSON, so both start with "eyJ".
const JWT_SHAPE = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;
const EMBEDDED_ZIP = /data:application\/zip;base64,([A-Za-z0-9+/=]+)/g;
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const SUCCESS = 0;
const FAILURE = 1;

const toPosix = (path: string): string => path.replaceAll('\\', '/');

function listFiles(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .map((path) => join(folder, path))
    .filter((path) => statSync(path).isFile());
}

/** Variables whose value appears in the text (plain or URL-encoded), plus a token if one shows up. */
function leaksIn(text: string, secrets: Secret[]): string[] {
  const variables = secrets
    .filter(({ value }) => text.includes(value) || text.includes(encodeURIComponent(value)))
    .map(({ name }) => name);
  return JWT_SHAPE.test(text) ? [...variables, TOKEN_LABEL] : variables;
}

/** Scans one file's bytes, recursing into zip archives and embedded base64 zips. */
function scanContent(label: string, content: Buffer, secrets: Secret[]): SecretFinding[] {
  if (content.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    return readZipEntries(content).flatMap((entry) => scanContent(`${label}!${entry.name}`, entry.data, secrets));
  }
  const text = content.toString('utf8');
  const findings = leaksIn(text, secrets).map((variable) => ({ file: label, variable }));
  for (const match of text.matchAll(EMBEDDED_ZIP)) {
    findings.push(...scanContent(label, Buffer.from(match[1] ?? '', 'base64'), secrets));
  }
  return findings;
}

export function scanArtifacts(options: { rootDir: string; secrets: Secret[] }): SecretsScanResult {
  const files = SCANNED_FOLDERS.flatMap((folder) => listFiles(join(options.rootDir, folder)));
  const findings = files.flatMap((path) =>
    scanContent(toPosix(relative(options.rootDir, path)), readFileSync(path), options.secrets),
  );
  const output = findings.length === 0
    ? [`check:secrets passed: no sensitive value in ${String(files.length)} file(s)`]
    : [
        ...findings.map(({ file, variable }) => `Sensitive value found: ${file} contains ${variable}`),
        `check:secrets failed: ${String(findings.length)} finding(s)`,
      ];
  return { exitCode: findings.length === 0 ? SUCCESS : FAILURE, findings, output };
}

function main(): void {
  const env = loadEnv();
  const secrets: Secret[] = [];
  const notes: string[] = [];
  for (const name of SENSITIVE_ENV_VARIABLES) {
    const value = env[name];
    if (value === undefined || value.trim() === '') notes.push(`Note: ${name} is not set; not scanned for it`);
    else secrets.push({ name, value });
  }
  const result = scanArtifacts({ rootDir: '.', secrets });
  for (const line of [...notes, ...result.output]) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
