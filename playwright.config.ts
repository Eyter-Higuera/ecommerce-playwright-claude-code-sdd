import { defineConfig } from '@playwright/test';
import { loadEnv, validateBaseUrls } from './src/config/env';
import { buildPlaywrightConfig } from './src/config/playwright-options';

// Playwright configuration (Spec 000). All settings live in the pure, unit-tested builder;
// this file only feeds it the environment (process + optional `.env`) and the CLI arguments.
const env = loadEnv();

// RF-16: an invalid BASE_URL or API_BASE_URL stops the whole run here, before any test is collected.
validateBaseUrls(env);

export default defineConfig(buildPlaywrightConfig(env, process.argv));
