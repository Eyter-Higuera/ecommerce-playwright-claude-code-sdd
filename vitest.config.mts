import { defineConfig } from 'vitest/config';

// Unit tests of framework code only (Spec 000, RF-5). Playwright specs (*.spec.ts) and the
// intentionally invalid inputs under tests/fixtures/ are never collected by Vitest.
// block-network.ts makes any real HTTP(S) request fail (RF-6).
// Coverage (RF-85) is measured only when `--coverage` is passed (`npm run test:unit:ci` in CI):
// it is reported, also when tests fail, and never gates the run (no thresholds).
// Test files run one at a time (RF-102): several of them start Playwright, Vitest, tsc or ESLint
// in a child process, and in parallel they ran out of memory and hit the 60 s spawn limit.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules/**', 'tests/fixtures/**'],
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['tests/unit/setup/block-network.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'scripts/**'],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'reports/coverage',
      reportOnFailure: true,
    },
  },
});
