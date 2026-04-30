import { test, expect } from '@playwright/test';

test.describe('PDF Operations', () => {
  test('shows merge view by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Merge PDFs')).toBeVisible();
  });

  test('navigation switches between views', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByRole('heading', { name: 'Compress PDF' })).toBeVisible();

    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByRole('heading', { name: 'Rotate PDF' })).toBeVisible();

    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();

    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByRole('heading', { name: 'Organize PDF' })).toBeVisible();
  });

  test('shows dropzone when no file selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/drag and drop/i)).toBeVisible();
  });

  test('header shows app title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'PDF Tool' })).toBeVisible();
  });
});