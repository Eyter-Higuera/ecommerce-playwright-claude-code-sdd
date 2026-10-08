import { defineConfig } from 'vitest/config';

// Unit tests of framework code only (Spec 000, RF-5). Playwright specs (*.spec.ts) and the
// intentionally invalid inputs under tests/fixtures/ are never collected by Vitest.
// block-network.ts makes any real HTTP(S) request fail (RF-6).
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules/**', 'tests/fixtures/**'],
    environment: 'node',
    setupFiles: ['tests/unit/setup/block-network.ts'],
  },
});
