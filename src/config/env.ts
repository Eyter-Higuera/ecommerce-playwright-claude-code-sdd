import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { invalidBaseUrlMessage, missingEnvVariableMessage } from '../errors/messages';

// Configuration accessor (Spec 000, RF-13 to RF-17, RF-7).
// Nothing is read at import time: unit tests can import any module without configuration, and a
// missing variable fails only the code (or test) that actually reads it.

/** The variables of RF-13, in the order of `.env.example`. */
export const ENV_VARIABLE_NAMES = [
  'BASE_URL',
  'API_BASE_URL',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_USER_2_EMAIL',
  'TEST_USER_2_PASSWORD',
] as const;

export type EnvVariableName = (typeof ENV_VARIABLE_NAMES)[number];

/** A flat view of environment values; `undefined` means "not set". */
export type EnvValues = Readonly<Record<string, string | undefined>>;

export interface LoadEnvOptions {
  /** Defaults to `process.env`. */
  processEnv?: EnvValues;
  /** Defaults to `.env` in the current working directory; a missing file is not an error. */
  dotenvPath?: string;
}

export const DEFAULT_DOTENV_FILE = '.env';

function readDotenvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path));
}

/**
 * Merges the `.env` file (RF-14) under the process environment (RF-15). A variable present in the
 * process wins even when it is empty, so an empty CI value is reported as missing instead of
 * silently falling back to a local file.
 */
export function loadEnv(options: LoadEnvOptions = {}): EnvValues {
  const processEnv = options.processEnv ?? process.env;
  const dotenvPath = options.dotenvPath ?? resolve(process.cwd(), DEFAULT_DOTENV_FILE);
  const merged: Record<string, string | undefined> = { ...readDotenvFile(dotenvPath) };
  for (const [name, value] of Object.entries(processEnv)) {
    if (value !== undefined) merged[name] = value;
  }
  return merged;
}

/** RF-16: variables that must be valid before a Playwright run starts. */
export const BASE_URL_VARIABLES = ['BASE_URL', 'API_BASE_URL'] as const;
const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    return ALLOWED_URL_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Throws, naming the variable, when BASE_URL or API_BASE_URL is missing, empty, blank or not an
 * absolute http/https URL. Called when the Playwright config loads, so the run stops before any
 * test is collected (RF-16).
 */
export function validateBaseUrls(env: EnvValues): void {
  for (const name of BASE_URL_VARIABLES) {
    const value = requireEnv(name, env);
    if (!isAbsoluteHttpUrl(value.trim())) throw new Error(invalidBaseUrlMessage(name));
  }
}

export interface EnvExampleDrift {
  /** RF-13 variables absent from the example file. */
  missing: string[];
  /** Variables in the example file that are not RF-13 variables. */
  unexpected: string[];
}

/** Compares the variables declared in a `.env.example` text with RF-13 (RF-19). */
export function findEnvExampleDrift(exampleContent: string): EnvExampleDrift {
  const declared = Object.keys(parse(exampleContent));
  const expected: readonly string[] = ENV_VARIABLE_NAMES;
  return {
    missing: expected.filter((name) => !declared.includes(name)),
    unexpected: declared.filter((name) => !expected.includes(name)),
  };
}

/** Returns the value of a required variable, or throws naming it when missing, empty or blank (RF-17). */
export function requireEnv(name: EnvVariableName, env: EnvValues = loadEnv()): string {
  const value = env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(missingEnvVariableMessage(name));
  }
  return value;
}
