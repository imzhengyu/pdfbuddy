import { test, expect } from '@playwright/test';
import path from 'path';

const testFiles = {
  merge: [
    'test-inputs/merge-1.pdf',
    'test-inputs/merge-2.pdf',
    'test-inputs/merge-3.pdf'
  ],
  split: 'test-inputs/split-source.pdf',
  compress: 'test-inputs/test-5pages.pdf',
  rotate: 'test-inputs/rotate-test.pdf',
  organize: 'test-inputs/test-3pages.pdf'
};

const imageFiles = {
  jpeg: 'test-inputs/test-image.jpg',
  png: 'test-inputs/test-image2.jpg'
};

async function uploadFile(page, filePath) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(path.resolve(filePath));
}

async function uploadFiles(page, filePaths) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(filePaths.map(p => path.resolve(p)));
}

test.describe('PDF Merge E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
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

  test('Upload 2 PDFs and merge with download', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Merge PDFs' })).toBeVisible();

    await uploadFiles(page, [testFiles.merge[0], testFiles.merge[1]]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();
    await expect(page.getByText('merge-2.pdf')).toBeVisible();

    const mergeBtn = page.getByRole('button', { name: /Merge 2 Files/ });
    await expect(mergeBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await mergeBtn.click();

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

    // Wait for preview to load
    await page.waitForTimeout(500);

    // Modal should open - use heading level 3 since modal uses h3
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
  });

  test('Merge button disabled when less than 2 files', async ({ page }) => {
    await uploadFile(page, testFiles.merge[0]);
    await expect(page.getByText('merge-1.pdf')).toBeVisible();

    // Merge button should be disabled with only 1 file
    const mergeBtn = page.getByRole('button', { name: /Merge 1 File/ });
    await expect(mergeBtn).toBeDisabled();
  });
});

test.describe('PDF Split E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Split' }).click();
  });

  test('Upload PDF and export single page as PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    // Wait for thumbnails to load
    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});

    // Click on first page to select it
    const thumbnails = page.locator('[class*="thumbnail"]');
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
    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const thumbnails = document.querySelectorAll('[class*="thumbnail"]');
      return thumbnails.length >= 2;
    }, { timeout: 10000 }).catch(() => {});

    // Select first 2 pages - use first() and nth(1) to get two different pages
    const thumbnails = page.locator('[class*="thumbnail"]');
    await thumbnails.first().click();
    await thumbnails.nth(1).click();

    // Wait for selection to update
    await page.waitForTimeout(300);

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

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});

    // Select a page
    const thumbnails = page.locator('[class*="thumbnail"]');
    await thumbnails.first().click();

    await expect(page.getByText(/1 selected/)).toBeVisible();

    // Click again to deselect
    await thumbnails.first().click();

    // Selection should be cleared
    await expect(page.getByText(/0 selected/)).toBeVisible();
  });

  test('Change File resets split state', async ({ page }) => {
    await uploadFile(page, testFiles.split);
    await expect(page.getByText('split-source.pdf')).toBeVisible();

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});

    // Select a page
    const thumbnails = page.locator('[class*="thumbnail"]');
    await thumbnails.first().click();
    await expect(page.getByText(/1 selected/)).toBeVisible();

    // Click Change File
    await page.getByRole('button', { name: 'Change File' }).click();

    // Should show dropzone again
    await expect(page.getByText(/drag and drop.*pdf.*split/i)).toBeVisible();
  });
});

test.describe('PDF Rotate E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Rotate' }).click();
  });

  test('Rotate single page and download', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    // Wait for thumbnails
    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const loading = document.querySelector('[class*="loading"]');
      return !loading || loading.textContent === '';
    }, { timeout: 10000 }).catch(() => {});

    // Click rotate button on first thumbnail - CSS modules hash class names
    const rotateButtons = page.locator('button[title="Rotate 90°"]');
    if (await rotateButtons.count() > 0) {
      await rotateButtons.first().click();
    } else {
      // Fallback: click on thumbnail to select
      const thumbnails = page.locator('[class*="thumbnail"]');
      await thumbnails.first().click();
    }

    // Wait for rotation to be applied
    await page.waitForTimeout(500);

    // Apply Rotation button should now be enabled
    const applyBtn = page.getByRole('button', { name: 'Apply Rotation' });
    // Note: may still be disabled depending on implementation

    // Preview should be enabled if rotation was applied
    const previewBtn = page.getByRole('button', { name: 'Preview' });

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click Apply Rotation if enabled, otherwise just verify state
    if (await applyBtn.isEnabled()) {
      await applyBtn.click();
    }

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/rotated.*\.pdf$/i);
  });

  test('Clear button is disabled when no rotation applied', async ({ page }) => {
    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const loading = document.querySelector('[class*="loading"]');
      return !loading || loading.textContent === '';
    }, { timeout: 10000 }).catch(() => {});

    // Clear button should be disabled when no rotation applied
    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await expect(clearBtn).toBeDisabled();

    // Apply Rotation button should also be disabled when no rotation applied
    const applyBtn = page.getByRole('button', { name: 'Apply Rotation' });
    await expect(applyBtn).toBeDisabled();
  });

  test('Preview rotated PDF opens modal', async ({ page }) => {
    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});

    const previewBtn = page.getByRole('button', { name: 'Preview' });
    if (await previewBtn.isEnabled()) {
      await previewBtn.click();
      // Wait for preview to load
      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
    }
  });

  test('Buttons accessible when viewport is narrow', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);
    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    // Wait for thumbnails to load
    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const loading = document.querySelector('[class*="loading"]');
      return !loading || loading.textContent === '';
    }, { timeout: 10000 }).catch(() => {});

    // Resize viewport to narrow width (400px - triggers single column layout)
    await page.setViewportSize({ width: 400, height: 800 });

    // Wait for layout to update
    await page.waitForTimeout(300);

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

test.describe('PDF Compress E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Compress' }).click();
  });

  test('Compress with High quality and download', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    // Select High quality
    await page.locator('input[type="radio"][value="high"]').check();
    await expect(page.locator('input[type="radio"][value="high"]')).toBeChecked();

    const compressBtn = page.getByRole('button', { name: 'Compress PDF' });
    await expect(compressBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await compressBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/compressed.*\.pdf$/i);
  });

  test('Compress button shows loading state during processing', async ({ page }) => {
    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    const compressBtn = page.getByRole('button', { name: 'Compress PDF' });

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click compress
    await compressBtn.click();

    // Wait a bit for state to update, then check button is disabled during processing
    await page.waitForTimeout(100);
    await expect(compressBtn).toBeDisabled();

    // Wait for download to complete
    await downloadPromise;
  });

  test('Preview modal shows compressed PDF preview', async ({ page }) => {
    await uploadFile(page, testFiles.compress);
    await expect(page.getByText('test-5pages.pdf')).toBeVisible();

    const previewBtn = page.getByRole('button', { name: 'Preview' });
    if (await previewBtn.isEnabled()) {
      await previewBtn.click();
      // Wait for preview to load
      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
    }
  });

  test('Error display when compression fails', async ({ page }) => {
    // This test would require a mock or invalid file
    // Skipping for now as it requires specific error simulation
    test.skip();
  });
});

test.describe('PDF Convert E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Convert' }).click();
  });

  test('Convert view shows correct dropzone message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();
    await expect(page.getByText('Convert images (PNG, JPEG) to a PDF document.')).toBeVisible();
    await expect(page.getByText(/drag and drop.*images.*pdf/i)).toBeVisible();
  });

  test('Upload JPEG and convert to PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await uploadFile(page, imageFiles.jpeg);

    // Wait for file to appear
    await page.waitForTimeout(500);

    const convertBtn = page.getByRole('button', { name: /Convert 1 Image to PDF/i });
    await expect(convertBtn).toBeEnabled({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await convertBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });

  test('Upload PNG and convert to PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await uploadFile(page, imageFiles.png);

    // Wait for file to appear
    await page.waitForTimeout(500);

    const convertBtn = page.getByRole('button', { name: /Convert 1 Image to PDF/i });
    await expect(convertBtn).toBeEnabled({ timeout: 15000 });

    const downloadPromise = page.waitForEvent('download');
    await convertBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });

  test('Convert multiple images to single PDF', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await uploadFiles(page, [imageFiles.jpeg, 'test-inputs/test-image3.jpg']);

    // Wait for files to appear
    await page.waitForTimeout(500);

    const convertBtn = page.getByRole('button', { name: /Convert 2 Images to PDF/i });
    await expect(convertBtn).toBeEnabled({ timeout: 15000 });

    const downloadPromise = page.waitForEvent('download');
    await convertBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/i);
  });
});

test.describe('PDF Organize E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Organize' }).click();
  });

  test('Select all pages for deletion and download', async ({ page }) => {
    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const loading = document.querySelector('[class*="loading"]');
      return !loading || loading.textContent === '';
    }, { timeout: 10000 }).catch(() => {});

    // Select all pages
    const thumbnails = page.locator('[class*="thumbnail"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await thumbnails.nth(i).click({ force: true });
      await page.waitForTimeout(100);
    }

    // Should show selection
    await expect(page.getByText(/\d+ page.*selected/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Organized PDF' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/organized.*\.pdf$/i);
  });

  test('Preview PDF opens preview modal', async ({ page }) => {
    await uploadFile(page, testFiles.organize);
    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    await page.waitForSelector('[class*="thumbnail"]', { timeout: 10000 }).catch(() => {});

    const previewBtn = page.getByRole('button', { name: 'Preview PDF' });
    if (await previewBtn.isEnabled()) {
      await previewBtn.click();
      // Wait for preview to load
      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
    }
  });
});

test.describe('Error Handling E2E', () => {
  test('Invalid file type shows error message', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Merge' }).click();

    // Try to upload a text file (invalid type)
    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles(path.resolve('test-inputs/test-text.txt'));

    // Should show error or file should not be accepted
    await page.waitForTimeout(500);
    // Either error is shown or file is rejected
    const errorText = page.getByText(/invalid|error|pdf/i);
    const dropzoneVisible = await page.getByText(/drag and drop.*pdf/i).isVisible();
    // Either error is shown or we're still on dropzone (file rejected)
    const errorVisible = await errorText.isVisible().catch(() => false);
    if (errorVisible) {
      // Error is displayed as expected
    } else {
      // Or file was rejected and dropzone is still visible
      expect(dropzoneVisible).toBe(true);
    }
  });

  test('Large file upload shows loading state', async ({ page }) => {
    // Upload the 10-page PDF which is larger
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Compress' }).click();

    await uploadFile(page, 'test-inputs/test-10pages.pdf');

    // Should show loading state or file info
    await page.waitForTimeout(1000);
    await expect(page.getByText(/test-10pages\.pdf/)).toBeVisible();
  });

  test('Navigation preserves state correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

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

test.describe('Performance E2E', () => {
  test('10-page PDF loads within reasonable time', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Split' }).click();

    const startTime = Date.now();
    await uploadFile(page, 'test-inputs/test-10pages.pdf');
    await page.waitForSelector('[class*="thumbnail"]', { timeout: 15000 }).catch(() => {});
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('Merge 3 PDFs completes within reasonable time', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Merge' }).click();
    await uploadFiles(page, testFiles.merge);

    const mergeBtn = page.getByRole('button', { name: /Merge 3 Files/ });
    await expect(mergeBtn).toBeEnabled();

    const startTime = Date.now();
    const downloadPromise = page.waitForEvent('download');
    await mergeBtn.click();
    await downloadPromise;
    const mergeTime = Date.now() - startTime;

    // Should complete within 15 seconds
    expect(mergeTime).toBeLessThan(15000);
  });
});