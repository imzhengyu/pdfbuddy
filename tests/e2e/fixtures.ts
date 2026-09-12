import path from 'path';
import { expect, type Page } from '@playwright/test';

/**
 * Shared E2E fixtures and helpers.
 *
 * These were previously copy-pasted into every spec file; keeping one copy means
 * the fixture paths and upload mechanics only need to change in one place.
 */

/** PDF fixtures in test-inputs/ (regenerate with scripts/generate-test-pdfs.mjs). */
export const testFiles = {
  merge: [
    'test-inputs/merge-1.pdf',
    'test-inputs/merge-2.pdf',
    'test-inputs/merge-3.pdf'
  ],
  split: 'test-inputs/split-source.pdf',
  rotate: 'test-inputs/rotate-test.pdf',
  organize: 'test-inputs/test-3pages.pdf'
} as const;

/** Image fixtures for the Convert view. */
export const imageFiles = {
  jpeg: 'test-inputs/test-image.jpg',
  png: 'test-inputs/test-image2.jpg'
} as const;

/** How long to keep retrying an upload before letting the test's own assertion fail. */
const UPLOAD_ACK_TIMEOUT_MS = 20000;
const UPLOAD_ACK_PROBE_MS = 1500;

export interface UploadOptions {
  /**
   * Set to false when the fixture is expected to be rejected (wrong type): the
   * helper then skips waiting for the file name to appear in the UI.
   */
  expectAccepted?: boolean;
}

async function attach(page: Page, filePaths: readonly string[]): Promise<void> {
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(filePaths.map((p) => path.resolve(p)));
}

/**
 * Attach fixtures to the view's file input and wait until the app shows them.
 *
 * `setInputFiles` can race with the lazy-loaded view: React may swap the file
 * input out just after Playwright binds to it, in which case the files never
 * reach the app and the test fails with a confusing "file name not visible".
 * Retrying until the app acknowledges the upload removes that flake.
 */
export async function uploadFiles(
  page: Page,
  filePaths: readonly string[],
  options: UploadOptions = {}
): Promise<void> {
  const { expectAccepted = true } = options;
  const firstName = path.basename(filePaths[0]);
  const deadline = Date.now() + UPLOAD_ACK_TIMEOUT_MS;

  for (;;) {
    await attach(page, filePaths);

    if (!expectAccepted) {
      return;
    }

    try {
      await expect(page.getByText(firstName).first()).toBeVisible({ timeout: UPLOAD_ACK_PROBE_MS });
      return;
    } catch {
      if (Date.now() > deadline) {
        // Give up quietly; the test's own assertion reports the real failure.
        return;
      }
      await page.waitForTimeout(250);
    }
  }
}

/** Attach a single fixture to the view's file input. */
export async function uploadFile(
  page: Page,
  filePath: string,
  options: UploadOptions = {}
): Promise<void> {
  await uploadFiles(page, [filePath], options);
}
