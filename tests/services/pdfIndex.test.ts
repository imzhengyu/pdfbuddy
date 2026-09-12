import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * AGENTS.md requires new PDF work to live in
 * `src/services/pdf/<operation>Operation.ts` and be re-exported from
 * `src/services/pdf/index.ts`. Nothing enforced the second half, so an
 * operation could quietly become unreachable from the barrel.
 */
const PDF_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'services', 'pdf');

function operationModules(): string[] {
  return readdirSync(PDF_DIR).filter((file) => file.endsWith('Operation.ts'));
}

describe('src/services/pdf/index.ts barrel', () => {
  const barrel = readFileSync(resolve(PDF_DIR, 'index.ts'), 'utf8');
  const modules = operationModules();

  it('finds the operation modules', () => {
    expect(modules.length).toBeGreaterThan(0);
  });

  it.each(operationModules())('re-exports %s', (file) => {
    const moduleName = file.replace(/\.ts$/, '');
    expect(barrel).toContain(`./${moduleName}`);
  });
});
