import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

const REMOVED_FEATURE = 'compress';

/**
 * Living docs and the manual verification script. Historical records
 * (docs/CHANGELOG.md, CR.md, docs/superpowers/**) are intentionally excluded:
 * they are append-only snapshots and may legitimately mention removed features.
 */
const LIVING_DOCS = [
  'README.md',
  'AGENTS.md',
  'docs/SPEC.md',
  'docs/implementation.md',
  'docs/testplan.md',
  'scripts/verify-functions.mjs'
];

describe('feature documentation parity', () => {
  it.each(LIVING_DOCS)('%s does not mention the removed Compress feature', (file) => {
    expect(read(file).toLowerCase()).not.toContain(REMOVED_FEATURE);
  });

  it('README documents every view registered in the app', () => {
    const unionMatch = read('src/context/AppContext.tsx').match(/export type View = ([^;]+);/);
    expect(unionMatch).not.toBeNull();

    const viewKeys = (unionMatch?.[1] ?? '')
      .split('|')
      .map((part) => part.trim().replace(/[']/g, ''))
      .filter(Boolean);

    expect(viewKeys).toEqual(['merge', 'split', 'rotate', 'convert', 'organize']);

    const readme = read('README.md');
    for (const key of viewKeys) {
      const heading = '### ' + key.charAt(0).toUpperCase() + key.slice(1);
      expect(readme).toContain(heading);
    }
  });
});
