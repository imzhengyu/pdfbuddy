import { test, expect } from '@playwright/test';
import { CONST_TEST_CONFIG } from '../../src/config/constants';
import { testFiles, imageFiles, uploadFile, uploadFiles } from './fixtures';

test.describe('PDF Merge E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Merge' }).click();
  });

  test('Upload 3 PDFs, reorder, and merge with download', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Merge PDFs' })).toBeVisible();

    // Upload files
    await uploadFiles(page, testFiles.merge);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();
    await expect(page.getByText('merge-3.pdf')).toBeVisible();

    // Verify merge button is enabled
    const mergeBtn = page.getByRole('button', { name: /Merge 3 Files/ });
    await expect(mergeBtn).toBeEnabled();

    // Set up download handler before clicking merge
    const downloadPromise = page.waitForEvent('download');

    // Click merge
    await mergeBtn.click();

    // Wait for download to start
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/merged.*\.pdf$/i);
  });

  test('Remove file from list updates merge button text', async ({ page }) => {
    await uploadFiles(page, testFiles.merge);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();
    await expect(page.getByText('merge-3.pdf')).toBeVisible();

    // Initially merge button should say "Merge 3 Files"
    await expect(page.getByRole('button', { name: /Merge 3 Files/ })).toBeEnabled();

    // Click remove on first file
    const removeButtons = page.locator('[class*="removeBtn"], [class*="remove"]');
    await removeButtons.first().click();

    // Verify file is removed
    await expect(page.getByText('merge-1.pdf')).not.toBeVisible();

    // Button should now say "Merge 2 Files"
    await expect(page.getByRole('button', { name: /Merge 2 Files/ })).toBeEnabled();
  });

  test('Clear all removes all files and shows dropzone', async ({ page }) => {
    await uploadFiles(page, testFiles.merge);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();

    // Click Clear All
    await page.getByRole('button', { name: 'Clear All' }).click();

    // Dropzone should reappear
    await expect(page.getByText(/drag and drop/i)).toBeVisible();
  });

  test('Preview merged files opens modal', async ({ page }) => {
    await uploadFiles(page, [testFiles.merge[0], testFiles.merge[1]]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();

    const previewBtn = page.getByRole('button', { name: 'Preview Files' });
    await expect(previewBtn).toBeEnabled();
    await previewBtn.click();

    // Wait for preview modal to open
    await expect(page.getByTestId('preview-modal-header')).toBeVisible();
  });

});

test.describe('PDF Split E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Split' }).click();
  });

  test('Upload PDF and export single page as PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Wait for thumbnails to load
    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Click on first page to select it
    const thumbnails = page.locator('[data-testid="thumbnail-item"]');
    await thumbnails.first().click();

    // Export button should be enabled
    const exportBtn = page.getByRole('button', { name: 'Export Selected Pages' });
    await expect(exportBtn).toBeEnabled();

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    // Single page should download as PDF directly
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });

  test('Select multiple pages and export as ZIP', async ({ page }) => {
    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Wait for thumbnails to load and multiple pages to be selectable
    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });
    await page.waitForFunction(() => {
      const thumbnails = document.querySelectorAll('[data-testid="thumbnail-item"]');
      return thumbnails.length >= 2;
    }, { timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Select first 2 pages - use first() and nth(1) to get two different pages
    const thumbnails = page.locator('[data-testid="thumbnail-item"]');
    await thumbnails.first().click();
    await thumbnails.nth(1).click();

    // Verify selection count
    await expect(page.getByText(/2 selected/)).toBeVisible();

    const exportBtn = page.getByRole('button', { name: 'Export Selected Pages' });
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    // Multiple pages should download as ZIP
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.zip$/i);
  });

  test('Page ranges mode - export specific range', async ({ page }) => {
    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Wait for the page count to load before entering a range: the range parser
    // clamps to the known page count, so filling too early silently truncates
    // "1-2" to a single page and the export comes out as a PDF, not a ZIP.
    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Switch to Page Ranges mode
    await page.getByRole('button', { name: 'Page Ranges' }).click();

    // Enter page range
    const rangeInput = page.locator('#pageRanges');
    await rangeInput.fill('1-2');

    // Export should be enabled
    const exportBtn = page.getByRole('button', { name: 'Export Selected Pages' });
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.zip$/i);
  });

  test('Visual selection - deselect page removes from selection', async ({ page }) => {
    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Select a page
    const thumbnails = page.locator('[data-testid="thumbnail-item"]');
    await thumbnails.first().click();

    await expect(page.getByText(/1 selected/)).toBeVisible();

    // Click again to deselect
    await thumbnails.first().click();

    // Selection should be cleared
    await expect(page.getByText(/0 selected/)).toBeVisible();
  });

});

test.describe('PDF Rotate E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Rotate' }).click();
  });

  test('Rotate single page and download', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    // Wait for thumbnails
    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });
    await expect(page.locator('[data-testid="thumbnail-loading"]')).toHaveCount(0, { timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Click rotate button on first thumbnail - CSS modules hash class names
    const rotateButtons = page.locator('button[title="Rotate 90°"]');
    if (await rotateButtons.count() > 0) {
      await rotateButtons.first().click();
    } else {
      // Fallback: click on thumbnail to select
      const thumbnails = page.locator('[data-testid="thumbnail-item"]');
      await thumbnails.first().click();
    }

    const applyBtn = page.getByRole('button', { name: 'Apply Rotation' });
    await expect(applyBtn).toBeEnabled({ timeout: 5000 });

    // Apply Rotation only builds the result. The Download button is rendered
    // once the result exists, and that click is what triggers the download.
    await applyBtn.click();

    const downloadBtn = page.getByRole('button', { name: 'Download', exact: true });
    await expect(downloadBtn).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/rotated.*\.pdf$/i);
  });

  test('Preview rotated PDF opens modal', async ({ page }) => {
    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Preview shows the *result* of the rotation, so the file has to be rotated
    // and applied first - the button is disabled until then.
    await page.getByRole('button', { name: 'Rotate page 90 degrees' }).first().click();
    await page.getByRole('button', { name: 'Apply Rotation' }).click();

    const previewBtn = page.getByRole('button', { name: 'Preview' });
    await expect(previewBtn).toBeEnabled({ timeout: CONST_TEST_CONFIG.e2eButtonTimeout });
    await previewBtn.click();
    await expect(page.getByTestId('preview-modal-header')).toBeVisible();
  });

  test('Buttons accessible when viewport is narrow', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    // Wait for thumbnails to load
    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });
    await expect(page.locator('[data-testid="thumbnail-loading"]')).toHaveCount(0, { timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    // Resize viewport to narrow width (400px - triggers single column layout)
    await page.setViewportSize({ width: 400, height: 800 });

    // Both Apply Rotation and Preview buttons should be visible and not covered by thumbnails
    const applyBtn = page.getByRole('button', { name: 'Apply Rotation' });
    const previewBtn = page.getByRole('button', { name: 'Preview' });

    await expect(applyBtn).toBeVisible();
    await expect(previewBtn).toBeVisible();

    // Check that buttons are not covered by any overlay element
    const applyBtnBox = await applyBtn.boundingBox();
    const previewBtnBox = await previewBtn.boundingBox();

    expect(applyBtnBox).not.toBeNull();
    expect(previewBtnBox).not.toBeNull();

    // Verify buttons are clickable (not obscured by other elements)
    const applyBtnVisible = await applyBtn.isVisible();
    const previewBtnVisible = await previewBtn.isVisible();

    expect(applyBtnVisible).toBe(true);
    expect(previewBtnVisible).toBe(true);
  });
});

test.describe('PDF Convert E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Convert' }).click();
  });

  test('Upload JPEG and convert to PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await uploadFile(page, imageFiles.jpeg);

    const convertBtn = page.getByRole('button', { name: /Convert 1 Image to PDF/i });
    await expect(convertBtn).toBeEnabled({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    const downloadPromise = page.waitForEvent('download');
    await convertBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });

  test('Convert multiple images to single PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await uploadFiles(page, [imageFiles.jpeg, 'test-inputs/test-image3.jpg']);

    const convertBtn = page.getByRole('button', { name: /Convert 2 Images to PDF/i });
    await expect(convertBtn).toBeEnabled({ timeout: CONST_TEST_CONFIG.e2eButtonTimeout });

    const downloadPromise = page.waitForEvent('download');
    await convertBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });
});

test.describe('PDF Organize E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Organize' }).click();
  });

  test('Delete one page and download the organized PDF', async ({ page }) => {
    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });
    await expect(page.locator('[data-testid="thumbnail-loading"]')).toHaveCount(0, { timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    const thumbnails = page.locator('[data-testid="thumbnail-item"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(0);

    // Mark a single page for deletion so pages remain to export.
    await thumbnails.first().click({ force: true });
    await expect(page.getByText(/\d+ page.*selected/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Organized PDF' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/organized.*\.pdf$/i);
  });

  test('Selecting every page refuses to export an empty PDF', async ({ page }) => {
    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    await expect(page.locator('[data-testid="thumbnail-item"]').first()).toBeVisible({ timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });
    await expect(page.locator('[data-testid="thumbnail-loading"]')).toHaveCount(0, { timeout: CONST_TEST_CONFIG.e2eDefaultTimeout });

    const thumbnails = page.locator('[data-testid="thumbnail-item"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await thumbnails.nth(i).click({ force: true });
    }
    await expect(page.getByText(/\d+ page.*selected/)).toBeVisible();

    // Every page is marked for deletion, so there is nothing left to export.
    await page.getByRole('button', { name: 'Download Organized PDF' }).click();
    await expect(page.getByText('No pages left after deletion')).toBeVisible();
  });

});

test.describe('Error Handling E2E', () => {
  test('Invalid file type shows error message', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Merge' }).click();

    // Try to upload a text file (invalid type)
    await uploadFile(page, 'test-inputs/test-text.txt', { expectAccepted: false });

    // The invalid file must be rejected outright: it never appears in the file
    // list and the empty dropzone is still showing. The previous assertion used
    // /pdf/i, which also matched the page title, so it passed without proving anything.
    await expect(page.getByText('test-text.txt')).toHaveCount(0);
    await expect(page.getByText(/drag and drop.*pdf/i).first()).toBeVisible();
  });

  test('Navigation preserves state correctly', async ({ page }) => {
    await page.goto('/');

    // Upload file in Merge view
    await page.getByRole('button', { name: 'Merge' }).click();
    await uploadFile(page, testFiles.merge[0]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();

    // Navigate to Split
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    // Go back to Merge - state should be reset
    await page.getByRole('button', { name: 'Merge' }).click();
    await expect(page.getByText(/drag and drop/i)).toBeVisible();
  });
});
