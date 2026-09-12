import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards the repository against committing credentials.
 *
 * `.codex/config.toml` (which holds a real API key) is gitignored, but a key can
 * also leak through a config sample, a script, a doc snippet or a test fixture.
 * This scan reads the files that make up the app and fails if anything looks
 * like a committed secret.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SCAN_DIRECTORIES = ['src', 'tests', 'scripts', 'docs'];
const SCAN_ROOT_FILES = ['package.json', 'README.md', 'AGENTS.md', 'CR.md'];

const SKIP_PATH = /node_modules|[/\\]dist[/\\]|[/\\]coverage[/\\]|[/\\]test-results[/\\]|[/\\]playwright-report[/\\]|testpdf-output|[/\\]output[/\\]/;
const TEXT_FILE = /\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|css|html|py|toml|ps1|txt)$/;

/** Patterns that only ever appear in real credentials, not in prose. */
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'OpenAI-style key', pattern: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub token', pattern: /\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Hardcoded bearer token', pattern: /Bearer\s+[A-Za-z0-9._-]{30,}/ },
];

function textFilesIn(directory: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (SKIP_PATH.test(full)) continue;

    if (statSync(full).isDirectory()) {
      found.push(...textFilesIn(full));
    } else if (TEXT_FILE.test(entry) && !full.endsWith('noSecrets.test.ts')) {
      found.push(full);
    }
  }

  return found;
}

function filesToScan(): string[] {
  const files = SCAN_DIRECTORIES.flatMap((name) => {
    const directory = join(REPO_ROOT, name);
    return statSync(directory).isDirectory() ? textFilesIn(directory) : [];
  });

  for (const name of SCAN_ROOT_FILES) {
    const full = join(REPO_ROOT, name);
    try {
      if (statSync(full).isFile()) files.push(full);
    } catch {
      // Optional files (CR.md) may not exist in every checkout.
    }
  }

  return files;
}

describe('repository secrets scan', () => {
  it('commits no credential-shaped strings', () => {
    const violations: string[] = [];

    for (const file of filesToScan()) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);

      for (const { name, pattern } of SECRET_PATTERNS) {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            violations.push(
              `${file.replace(REPO_ROOT + '\\', '')}:${index + 1} looks like a ${name}`
            );
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });
});
