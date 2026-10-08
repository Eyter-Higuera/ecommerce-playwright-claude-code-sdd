import { defineConfig } from 'vitest/config';

// Self-contained fixture project: stops Vitest from using the repository config,
// which excludes tests/fixtures/**.
export default defineConfig({
  test: { include: ['**/*.test.ts'] },
});
