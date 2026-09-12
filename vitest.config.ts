import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],

    // Only the component/hook/context suites need a DOM. Spinning up jsdom for
    // service, util, config and worker tests is pure overhead, so those run in
    // the much cheaper node environment. First match wins, so the two DOM-bound
    // exceptions are listed first.
    environmentMatchGlobs: [
      ['tests/services/convertOperation.test.ts', 'jsdom'],
      ['tests/utils/downloadUtils.test.ts', 'jsdom'],
      ['tests/services/**', 'node'],
      ['tests/utils/**', 'node'],
      ['tests/config/**', 'node'],
      ['tests/workers/**', 'node'],
      ['tests/scripts/**', 'node']
    ],

    // Capped, on purpose. Each test file spins up its own environment and this is
    // a 4-core machine, so the Vitest default (one worker per core) saturates it
    // and the box becomes unresponsive. See AGENTS.md -> Testing.
    maxWorkers: 3,
    minWorkers: 1
  }
});