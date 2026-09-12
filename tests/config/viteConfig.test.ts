import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readViteConfig(): string {
  return readFileSync(resolve(REPO_ROOT, 'vite.config.ts'), 'utf8');
}

/**
 * Regression guard for CR.md Issue 3.
 *
 * Adding a `new Worker(...)` reference inside a service made Vite bundle
 * `pdfProcessor.worker.ts` with the default `iife` format, which does not
 * support code-splitting, so the production build failed with
 * "Invalid value 'iife' for option 'output.format'".
 *
 * A build only catches that at build time; this test fails the moment the
 * setting is dropped.
 */
describe('vite worker bundle configuration', () => {
  it('builds the worker as an ES module so code-splitting stays legal', () => {
    const workerBlock = readViteConfig().match(/worker\s*:\s*\{([\s\S]*?)\}/);
    expect(workerBlock, 'vite.config.ts no longer declares a worker block').not.toBeNull();

    const format = workerBlock?.[1].match(/format\s*:\s*['"]([^'"]+)['"]/);
    expect(format?.[1], "vite.config.ts must set worker.format to 'es'").toBe('es');
  });
});
