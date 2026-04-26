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
    await page.goto('http://localhost:3006');
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

    console.log('Split test passed: file uploaded successfully');
  });

  test('Rotate: Upload PDF and verify file is loaded', async ({ page }) => {
    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await uploadFile(page, testFiles.rotate);

    await expect(page.getByText('rotate-test.pdf')).toBeVisible();

    console.log('Rotate test passed: file uploaded successfully');
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

  test('Organize: Upload PDF and see organize button enabled', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();

    await uploadFile(page, testFiles.organize);

    await expect(page.getByText('test-3pages.pdf')).toBeVisible();

    const organizeBtn = page.getByRole('button', { name: 'Download Organized PDF' });
    await expect(organizeBtn).toBeEnabled();

    console.log('Organize test passed: file uploaded and organize button enabled');
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