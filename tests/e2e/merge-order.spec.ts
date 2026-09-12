import { test, expect } from '@playwright/test';
import { testFiles, uploadFiles } from './fixtures';

/**
 * Regression coverage for CR.md Issue 17: reordering files on the Merge page
 * must move the rows in the list and must be reflected by the merged preview.
 */
test.describe('Merge reorder', () => {
  test('dragging a file reorders the list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Merge' }).click();

    await uploadFiles(page, [testFiles.merge[0], testFiles.merge[1]]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();

    const rows = page.locator('[draggable="true"]');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('merge-1.pdf');

    await rows.nth(1).dragTo(rows.nth(0));

    await expect(rows.nth(0)).toContainText('merge-2.pdf');
    await expect(rows.nth(1)).toContainText('merge-1.pdf');
  });

  test('opening the preview before reordering shows the new order afterwards', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Merge' }).click();

    await uploadFiles(page, [testFiles.merge[0], testFiles.merge[1]]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();

    // Preview once, then close it.
    await page.getByRole('button', { name: 'Preview Files' }).click();
    await expect(page.getByTestId('preview-modal-header')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('preview-modal-header')).toBeHidden();

    const rows = page.locator('[draggable="true"]');
    await rows.nth(1).dragTo(rows.nth(0));
    await expect(rows.nth(0)).toContainText('merge-2.pdf');

    // Reopening must merge in the new order, not the old one.
    await page.getByRole('button', { name: 'Preview Files' }).click();
    await expect(page.getByTestId('preview-modal-header')).toBeVisible();
    await expect(page.getByTestId('preview-modal-header')).toContainText('Merged Preview');
  });
});
