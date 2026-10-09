import { defineConfig } from '@playwright/test';
import { buildPlaywrightConfig } from '../../../../src/config/playwright-options';

// Fixture project for TC-001-37 / TC-001-38, built with the REAL repository builder (projects,
// retries, tracing). Only the tests folder and the output root change: tests come from this folder,
// and every report and artifact goes to FIXTURE_OUTPUT_DIR (a temp folder chosen by the unit test).
export default defineConfig(
  buildPlaywrightConfig(process.env, process.argv, {
    testsDir: __dirname,
    outputDir: process.env.FIXTURE_OUTPUT_DIR ?? 'TEST_fixture_output',
  }),
);
