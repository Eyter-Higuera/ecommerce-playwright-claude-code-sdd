import { defineConfig, globalIgnores } from 'eslint/config';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

// ESLint flat config (Spec 000, RF-27 to RF-30).
// Type-aware rules need the TypeScript project; the lint fixtures live outside tsconfig.json
// (they are intentionally broken), so the project service lints them with a default project.

// The recommended config carries its own plugin object; reusing it avoids registering two
// different "playwright" plugin instances, which ESLint rejects.
const playwrightRecommended = playwright.configs['flat/recommended'];

export default defineConfig(
  // Generated output, dependencies and intentionally broken fixtures are never linted.
  globalIgnores([
    'node_modules/',
    'playwright-report/',
    'test-results/',
    'reports/',
    'coverage/',
    'dist/',
    'tests/fixtures/',
  ]),

  {
    files: ['**/*.ts', '**/*.mts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['tests/fixtures/lint/*.ts'],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // RF-28: a Promise that is neither awaited nor handled hides failures and races.
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // Plain JavaScript config files have no type information.
  {
    files: ['**/*.mjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Playwright rules on any TypeScript that can drive a browser or an API request context.
  {
    files: ['**/*.ts'],
    plugins: playwrightRecommended.plugins,
    rules: {
      // RF-27: hard waits make tests slow and flaky; wait for an element, URL or response.
      'playwright/no-wait-for-timeout': 'error',
      // RF-28: Playwright actions and web-first assertions must be awaited.
      'playwright/missing-playwright-await': 'error',
    },
  },

  // RF-29: one test framework per file. Playwright specs and framework code (src/) never import
  // Vitest; Vitest unit tests never import Playwright Test.
  {
    files: ['**/*.spec.ts', 'src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['vitest', 'vitest/*'], message: 'Playwright tests and framework code must not import Vitest.' }],
      }],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@playwright/test', '@playwright/test/*'], message: 'Vitest unit tests must not import Playwright Test.' }],
      }],
    },
  },

  // Full Playwright recommended set for Playwright test files only (not Vitest *.test.ts).
  {
    files: ['**/*.spec.ts'],
    extends: [playwrightRecommended],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/missing-playwright-await': 'error',
    },
  },
);
