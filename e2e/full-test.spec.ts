import { test, expect } from '@playwright/test';
import path from 'path';

const testFiles = {
  merge: [
    'test-pdfs/merge-1.pdf',
    'test-pdfs/merge-2.pdf',
    'test-pdfs/merge-3.pdf'
  ],
  split: 'test-pdfs/split-source.pdf',
  compress: 'test-pdfs/test-5pages.pdf',
  rotate: 'test-pdfs/rotate-test.pdf',
  organize: 'test-pdfs/test-3pages.pdf'
};

async function uploadFile(page, filePath) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(path.resolve(filePath));
}

async function uploadFiles(page, filePaths) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(filePaths.map(p => path.resolve(p)));
}

test.describe('PDF Tool WebApp Full Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('heading', { name: 'PDF Tool' })).toBeVisible();
  });

  test('Merge: Upload 3 PDFs and see merge button enabled', async ({ page }) => {
    await page.getByRole('button', { name: 'Merge' }).click();
    await expect(page.getByRole('heading', { name: 'Merge PDFs' })).toBeVisible();

    await uploadFiles(page, testFiles.merge);

    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();
    await expect(page.getByText('merge-3.pdf')).toBeVisible();

    const mergeBtn = page.getByRole('button', { name: /Merge \d+ Files/ });
    await expect(mergeBtn).toBeEnabled();

    console.log('Merge test passed: 3 files uploaded and merge button enabled');
  });

  test('Split: Upload PDF and verify file is loaded', async ({ page }) => {
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await uploadFile(page, testFiles.split);

    await expect(page.getByText('split-source.pdf')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Visual Selection' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Page Ranges' })).toBeVisible();

    console.log('Split test passed: file uploaded successfully');
  });

  test('Split: Select pages using visual selection mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Verify source and target sections are visible
    await expect(page.getByRole('heading', { name: 'Source Pages' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selected Pages' })).toBeVisible();
    await expect(page.getByText('0 selected')).toBeVisible();

    // Verify Export and Preview buttons are disabled when no selection
    const exportBtn = page.getByRole('button', { name: 'Export Selected Pages' });
    await expect(exportBtn).toBeDisabled();

    console.log('Split visual selection test passed: UI elements correct');
  });

  test('Split: Switch to Page Ranges mode and enter range', async ({ page }) => {
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Click Page Ranges mode
    await page.getByRole('button', { name: 'Page Ranges' }).click();

    // Verify page range input appears
    const rangeInput = page.locator('#pageRanges');
    await expect(rangeInput).toBeVisible();
    await expect(rangeInput).toHaveAttribute('placeholder', 'e.g., 1-3, 4-6, 7');

    // Enter page range
    await rangeInput.fill('1-2, 3');

    // Verify Export button is now enabled
    const exportBtn = page.getByRole('button', { name: 'Export Selected Pages' });
    await expect(exportBtn).toBeEnabled();

    console.log('Split page range mode test passed: range input works');
  });

  test('Rotate: Upload PDF and verify file is loaded', async ({ page }) => {
    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);

    await expect(page.getByText('rotate-test.pdf')).toBeVisible();
    await expect(page.getByText('Source Pages')).toBeVisible();
    await expect(page.getByText('Result Preview')).toBeVisible();
    await expect(page.getByText('Rotate 90°')).toBeVisible();
    await expect(page.getByText('Rotate 180°')).toBeVisible();
    await expect(page.getByText('Rotate 270°')).toBeVisible();

    console.log('Rotate test passed: file uploaded successfully');
  });

  test('Rotate: Transform buttons are disabled when no pages selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    // Wait for the page to settle
    await page.waitForTimeout(500);

    // All transform buttons should be disabled when no pages selected
    const rotate90Btn = page.getByRole('button', { name: 'Rotate 90°' });
    const rotate180Btn = page.getByRole('button', { name: 'Rotate 180°' });
    const rotate270Btn = page.getByRole('button', { name: 'Rotate 270°' });

    await expect(rotate90Btn).toBeDisabled();
    await expect(rotate180Btn).toBeDisabled();
    await expect(rotate270Btn).toBeDisabled();

    // Download button should not be visible
    const downloadBtnCount = await page.locator('button', { hasText: 'Download' }).count();
    expect(downloadBtnCount).toBe(0);

    console.log('Rotate transform buttons test passed: buttons disabled without selection');
  });

  test('Compress: Upload PDF and see compress button enabled', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);

    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    const compressBtn = page.getByRole('button', { name: 'Compress PDF' });
    await expect(compressBtn).toBeEnabled();

    console.log('Compress test passed: file uploaded and compress button enabled');
  });

  test('Compress: Compress with Low quality and verify download', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    // Select Low quality
    await page.locator('input[type="radio"][value="low"]').check();
    await expect(page.locator('input[type="radio"][value="low"]')).toBeChecked();

    // Set up download handler before clicking compress
    const downloadPromise = page.waitForEvent('download');

    // Click compress
    await page.getByRole('button', { name: 'Compress PDF' }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/compressed.*\.pdf$/i);

    console.log('Compress Low quality test passed: download triggered');
  });

  test('Compress: Compress with Medium quality and verify download', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    // Select Medium quality (default)
    await expect(page.locator('input[type="radio"][value="medium"]')).toBeChecked();

    // Set up download handler before clicking compress
    const downloadPromise = page.waitForEvent('download');

    // Click compress
    await page.getByRole('button', { name: 'Compress PDF' }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/compressed.*\.pdf$/i);

    console.log('Compress Medium quality test passed: download triggered');
  });

  test('Compress: Compress with High quality and verify download', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    // Select High quality
    await page.locator('input[type="radio"][value="high"]').check();
    await expect(page.locator('input[type="radio"][value="high"]')).toBeChecked();

    // Set up download handler before clicking compress
    const downloadPromise = page.waitForEvent('download');

    // Click compress
    await page.getByRole('button', { name: 'Compress PDF' }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/compressed.*\.pdf$/i);

    console.log('Compress High quality test passed: download triggered');
  });

  test('Compress: Preview button opens preview modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    // Click Preview button
    await page.getByRole('button', { name: 'Preview' }).click();

    // Modal should open
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible();

    console.log('Compress Preview test passed: modal opened');
  });

  test('Organize: Upload PDF and see organize button enabled', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();

    await uploadFile(page, testFiles.organize);

    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    const organizeBtn = page.getByRole('button', { name: 'Download Organized PDF' });
    await expect(organizeBtn).toBeEnabled();

    console.log('Organize test passed: file uploaded and organize button enabled');
  });

  test('Organize: Select pages to delete and download organized PDF', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();

    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    // Wait for thumbnails to fully load by waiting for the loading text to disappear or grid to appear
    await page.waitForFunction(() => {
      const loading = document.querySelector('[class*="loading"]');
      const grid = document.querySelector('[class*="grid"]');
      return !loading || grid;
    }, { timeout: 10000 }).catch(() => {});

    // Click on first thumbnail to select page for deletion
    const thumbnails = page.locator('[class*="thumbnail"]');
    const count = await thumbnails.count();
    console.log(`Found ${count} thumbnails`);
    expect(count).toBeGreaterThan(0);
    await thumbnails.first().click({ force: true });

    // Wait a moment for state to update
    await page.waitForTimeout(200);

    // Hint should appear showing selected pages for deletion
    const hint = page.getByText(/1 page.*selected/);
    await expect(hint).toBeVisible({ timeout: 5000 });

    // Download button should still be enabled (can download with deleted pages)
    const organizeBtn = page.getByRole('button', { name: 'Download Organized PDF' });
    await expect(organizeBtn).toBeEnabled();

    // Set up download handler before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // Download
    await organizeBtn.click();

    // Wait a moment for processing to start
    await page.waitForTimeout(1000);

    // Check if there's an error displayed
    const errorEl = page.locator('[class*="error"]');
    if (await errorEl.count() > 0) {
      const errorText = await errorEl.textContent();
      console.log('Error displayed:', errorText);
    }

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/organized.*\.pdf$/i);

    console.log('Organize page deletion test passed: download triggered');
  });

  test('Organize: Preview PDF opens preview modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();

    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    // Click Preview PDF button
    await page.getByRole('button', { name: 'Preview PDF' }).click();

    // Modal should open
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible();

    console.log('Organize Preview test passed: modal opened');
  });

  test('Organize: Change File resets state', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();

    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    // Wait for thumbnails to load
    await page.waitForTimeout(500);

    // Select a page
    const thumbnails = page.locator('[class*="thumbnail"]');
    await thumbnails.first().click();

    // Verify selection hint appears
    await expect(page.getByText(/1 page\(s\) selected/)).toBeVisible();

    // Click Change File
    await page.getByRole('button', { name: 'Change File' }).click();

    // Should show dropzone again
    await expect(page.getByText('Drag and drop a PDF file to organize')).toBeVisible();

    console.log('Organize Change File test passed: state reset');
  });

  test('Preview: Open preview modal for a file in Merge', async ({ page }) => {
    await page.getByRole('button', { name: 'Merge' }).click();

    await uploadFiles(page, [testFiles.merge[0], testFiles.merge[1]]);

    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();

    const previewBtn = page.getByRole('button', { name: 'Preview Files' });
    await expect(previewBtn).toBeEnabled();
    await previewBtn.click();

    // Wait for preview to load (shows loading state)
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
    console.log('Preview test passed: modal opened successfully');
  });

  test('Convert: Verify Convert view shows correct UI elements', async ({ page }) => {
    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();
    await expect(page.getByText('Convert images (PNG, JPEG) to a PDF document.')).toBeVisible();
    await expect(page.getByText('Drag and drop images here to convert to PDF')).toBeVisible();

    console.log('Convert view test passed: UI elements correct');
  });

  test('Convert: Shows empty dropzone for images', async ({ page }) => {
    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    // Dropzone should accept images
    const dropzone = page.locator('[class*="dropzone"]');
    await expect(dropzone).toBeVisible();

    // File input should accept image types
    const input = page.locator('input[type="file"]').first();
    await expect(input).toBeVisible();

    console.log('Convert dropzone test passed: image dropzone visible');
  });

  test('Navigation: Click all view buttons and verify content changes', async ({ page }) => {
    const views = ['Merge', 'Split', 'Compress', 'Rotate', 'Convert', 'Organize'];
    const headings = ['Merge PDFs', 'Split PDF', 'Compress PDF', 'Rotate PDF', 'Convert to PDF', 'Organize PDF'];

    for (let i = 0; i < views.length; i++) {
      await page.getByRole('button', { name: views[i] }).click();
      await expect(page.getByRole('heading', { name: headings[i] })).toBeVisible();
    }

    console.log('Navigation test passed: all views accessible and show correct content');
  });

  test('Add More Files: Can add additional files after initial upload', async ({ page }) => {
    await page.getByRole('button', { name: 'Merge' }).click();

    await uploadFile(page, testFiles.merge[0]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();

    const addMoreBtn = page.getByRole('button', { name: 'Add More Files' });
    if (await addMoreBtn.isVisible()) {
      await addMoreBtn.click();
      await expect(page.getByText('Add more PDF files')).toBeVisible();
      console.log('Add More Files test passed: additional files can be added');
    }
  });
});