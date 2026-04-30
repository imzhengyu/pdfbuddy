import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3009';
const DOWNLOAD_DIR = 'test-output';

// Test PDFs
const testFiles = {
  merge: ['test-inputs/merge-1.pdf', 'test-inputs/merge-2.pdf', 'test-inputs/merge-3.pdf'],
  split: 'test-inputs/split-source.pdf',
  compress: 'test-inputs/test-5pages.pdf',
  rotate: 'test-inputs/rotate-test.pdf',
  organize: 'test-inputs/test-3pages.pdf'
};

async function setupBrowser() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    downloadsPath: DOWNLOAD_DIR
  });
  const page = await context.newPage();
  return { browser, context, page };
}

async function uploadFile(page, filePath) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(path.resolve(filePath));
  await page.waitForTimeout(500);
}

async function uploadFiles(page, filePaths) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(filePaths.map(p => path.resolve(p)));
  await page.waitForTimeout(500);
}

async function clickAndWaitForDownload(page, buttonName, downloadDir) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
    page.getByRole('button', { name: buttonName }).click()
  ]);

  if (download) {
    const filename = download.suggestedFilename();
    const filepath = path.join(downloadDir, filename);
    await download.saveAs(filepath);
    console.log(`  Downloaded: ${filename}`);
    return { success: true, filename, filepath };
  }
  return { success: false, filename: null, filepath: null };
}

async function runTests() {
  // Create output directory
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Clear previous downloads
  const files = fs.readdirSync(DOWNLOAD_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
  }

  console.log('Starting PDF Tool E2E Verification Tests\n');
  console.log('=' .repeat(50));

  const { browser, context, page } = await setupBrowser();

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Merge
    console.log('\n[Test 1] MERGE - Combining 3 PDFs');
    console.log('-'.repeat(50));
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Merge' }).click();
    await page.waitForTimeout(300);

    await uploadFiles(page, testFiles.merge);
    await page.waitForTimeout(500);

    // Check files are listed
    const mergeBtn = page.getByRole('button', { name: /Merge \d+ Files/ });
    const isEnabled = await mergeBtn.isEnabled();
    console.log(`  Files uploaded: merge-1, merge-2, merge-3`);
    console.log(`  Merge button enabled: ${isEnabled}`);

    // Click merge and wait for download
    const mergeResult = await clickAndWaitForDownload(page, /Merge \d+ Files/, DOWNLOAD_DIR);
    if (mergeResult.success) {
      console.log(`  Result: PASS - Downloaded ${mergeResult.filename}`);
      passed++;
    } else {
      console.log(`  Result: FAIL - No download triggered`);
      failed++;
    }

    // Test 2: Split
    console.log('\n[Test 2] SPLIT - Splitting PDF by page ranges');
    console.log('-'.repeat(50));
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Split' }).click();
    await page.waitForTimeout(300);

    await uploadFile(page, testFiles.split);
    await page.waitForTimeout(500);

    // Find and fill page range input
    const pageCount = await page.getByText('5 pages').isVisible();
    console.log(`  File loaded: 5 pages detected = ${pageCount}`);

    // Enter page ranges
    const rangeInput = page.locator('input').filter({ hasText: '' }).first();
    if (await rangeInput.isVisible()) {
      await rangeInput.fill('1-2, 3-4, 5');
      console.log('  Page ranges entered: 1-2, 3-4, 5');
    }

    await page.waitForTimeout(300);
    const splitBtn = page.getByRole('button', { name: 'Split PDF' });
    const splitEnabled = await splitBtn.isEnabled();
    console.log(`  Split button enabled: ${splitEnabled}`);

    if (splitEnabled) {
      const splitResult = await clickAndWaitForDownload(page, 'Split PDF', DOWNLOAD_DIR);
      if (splitResult.success) {
        console.log(`  Result: PASS - Downloaded ${splitResult.filename}`);
        passed++;
      } else {
        console.log(`  Result: FAIL - No download triggered`);
        failed++;
      }
    } else {
      console.log(`  Result: FAIL - Split button disabled`);
      failed++;
    }

    // Test 3: Compress
    console.log('\n[Test 3] COMPRESS - Compressing PDF');
    console.log('-'.repeat(50));
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Compress' }).click();
    await page.waitForTimeout(300);

    await uploadFile(page, testFiles.compress);
    await page.waitForTimeout(500);

    const compressBtn = page.getByRole('button', { name: 'Compress PDF' });
    const compressEnabled = await compressBtn.isEnabled();
    console.log(`  Compress button enabled: ${compressEnabled}`);

    if (compressEnabled) {
      const compressResult = await clickAndWaitForDownload(page, 'Compress PDF', DOWNLOAD_DIR);
      if (compressResult.success) {
        console.log(`  Result: PASS - Downloaded ${compressResult.filename}`);
        passed++;
      } else {
        console.log(`  Result: FAIL - No download triggered`);
        failed++;
      }
    } else {
      console.log(`  Result: FAIL - Compress button disabled`);
      failed++;
    }

    // Test 4: Rotate - Need to select pages first
    console.log('\n[Test 4] ROTATE - Rotating PDF');
    console.log('-'.repeat(50));
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Rotate' }).click();
    await page.waitForTimeout(300);

    await uploadFile(page, testFiles.rotate);
    await page.waitForTimeout(2000);

    // Wait for thumbnails to load and click on the first page
    try {
      // Click on first page thumbnail to select it
      const firstPage = page.locator('[class*="thumbnail"]').first();
      if (await firstPage.isVisible({ timeout: 5000 })) {
        await firstPage.click();
        console.log('  Selected first page');
        await page.waitForTimeout(300);
      } else {
        console.log('  No thumbnails found, trying direct click on page area');
      }
    } catch (e) {
      console.log('  Could not select page:', e.message);
    }

    const rotateBtn = page.getByRole('button', { name: 'Rotate 90°' });
    const rotateEnabled = await rotateBtn.isEnabled();
    console.log(`  Rotate button enabled: ${rotateEnabled}`);

    if (rotateEnabled) {
      // Click Rotate 90° and wait for download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
        page.getByRole('button', { name: 'Rotate 90°' }).click()
      ]);

      if (download) {
        const filename = download.suggestedFilename();
        console.log(`  Result: PASS - Downloaded ${filename}`);
        passed++;
      } else {
        console.log(`  Result: FAIL - No download triggered`);
        failed++;
      }
    } else {
      console.log(`  Result: FAIL - Rotate button disabled (need to select pages first)`);
      failed++;
    }

    // Test 5: Organize
    console.log('\n[Test 5] ORGANIZE - Reordering PDF pages');
    console.log('-'.repeat(50));
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Organize' }).click();
    await page.waitForTimeout(300);

    await uploadFile(page, testFiles.organize);
    await page.waitForTimeout(500);

    const organizeBtn = page.getByRole('button', { name: 'Download Organized PDF' });
    const organizeEnabled = await organizeBtn.isEnabled();
    console.log(`  Organize button enabled: ${organizeEnabled}`);

    if (organizeEnabled) {
      const organizeResult = await clickAndWaitForDownload(page, 'Download Organized PDF', DOWNLOAD_DIR);
      if (organizeResult.success) {
        console.log(`  Result: PASS - Downloaded ${organizeResult.filename}`);
        passed++;
      } else {
        console.log(`  Result: FAIL - No download triggered`);
        failed++;
      }
    } else {
      console.log(`  Result: FAIL - Organize button disabled`);
      failed++;
    }

    // Test 6: Convert - Note: Convert is for IMAGES to PDF, not PDF to PDF
    // Skipping this test as it requires image files, not PDFs
    console.log('\n[Test 6] CONVERT - Skipped (Convert feature requires images, not PDFs)');
    console.log('-'.repeat(50));
    console.log('  Convert View accepts PNG/JPEG images only');
    console.log('  Result: SKIPPED');

  } catch (error) {
    console.error('\nTest error:', error.message);
    failed++;
  } finally {
    await browser.close();
  }

  // Verify downloaded files
  console.log('\n' + '='.repeat(50));
  console.log('DOWNLOADED FILES VERIFICATION');
  console.log('='.repeat(50));

  const downloadedFiles = fs.readdirSync(DOWNLOAD_DIR);
  if (downloadedFiles.length > 0) {
    for (const file of downloadedFiles) {
      const filepath = path.join(DOWNLOAD_DIR, file);
      const stats = fs.statSync(filepath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${file} - ${sizeKB} KB`);
    }
  } else {
    console.log('  No files downloaded');
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log('\n  ALL TESTS PASSED!');
  } else {
    console.log('\n  SOME TESTS FAILED');
  }

  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});