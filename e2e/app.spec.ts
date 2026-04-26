import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders header with PDF Tool title', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('PDF Tool');
  });

  test('renders navigation with all view buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Merge' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Split' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compress' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rotate' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Organize' })).toBeVisible();
  });

  test('shows MergeView by default', async ({ page }) => {
    await expect(page.getByText('Merge PDF')).toBeVisible();
  });

  test('navigates to Split view', async ({ page }) => {
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByText('Split PDF')).toBeVisible();
  });

  test('navigates to Compress view', async ({ page }) => {
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByText('Compress PDF')).toBeVisible();
  });

  test('navigates to Rotate view', async ({ page }) => {
    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByText('Rotate PDF')).toBeVisible();
  });

  test('navigates to Convert view', async ({ page }) => {
    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByRole('heading', { name: 'Convert to PDF' })).toBeVisible();
  });

  test('navigates to Organize view', async ({ page }) => {
    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByText('Organize PDF')).toBeVisible();
  });

  test('active view button is highlighted', async ({ page }) => {
    const splitButton = page.getByRole('button', { name: 'Split' });
    await splitButton.click();
    await expect(splitButton).toHaveClass(/active/);
  });

  test('navigation between multiple views', async ({ page }) => {
    // Start with Merge (default)
    await expect(page.getByText('Merge PDF')).toBeVisible();

    // Go to Split
    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByText('Split PDF')).toBeVisible();

    // Go to Compress
    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByText('Compress PDF')).toBeVisible();

    // Go back to Merge
    await page.getByRole('button', { name: 'Merge' }).click();
    await expect(page.getByText('Merge PDF')).toBeVisible();
  });
});

test.describe('main.tsx', () => {
  test('app starts without errors', async ({ page }) => {
    await page.goto('/');
    // No console errors should appear
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('page has proper title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PDF/i);
  });

  test('renders React app root element', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await expect(root).not.toBeEmpty();
  });
});