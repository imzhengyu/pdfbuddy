import { test, expect } from '@playwright/test';

const VIEWS = [
  { button: 'Merge', heading: 'Merge PDFs' },
  { button: 'Split', heading: 'Split PDF' },
  { button: 'Rotate', heading: 'Rotate PDF' },
  { button: 'Convert', heading: 'Convert to PDF' },
  { button: 'Organize', heading: 'Organize PDF' }
] as const;

/**
 * App-shell smoke tests.
 *
 * These used to be thirteen near-identical tests, each paying for its own page
 * load to assert one string. They are now three tests that cover the same ground
 * with three page loads total.
 */
test.describe('App shell', () => {
  test('loads cleanly: title, root element and default view render with no page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/PDF/i);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await expect(root).not.toBeEmpty();

    await expect(page.locator('h1')).toHaveText('PDF Tool');
    await expect(page.getByRole('heading', { name: 'Merge PDFs' })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('every nav button opens its view and marks itself active', async ({ page }) => {
    await page.goto('/');

    for (const view of VIEWS) {
      const button = page.getByRole('button', { name: view.button, exact: true });
      await button.click();
      await expect(page.getByRole('heading', { name: view.heading })).toBeVisible();
      await expect(button).toHaveClass(/active/);
    }
  });

  test('switching back to an earlier view keeps the shell intact', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Split PDF' })).toBeVisible();

    await page.getByRole('button', { name: 'Merge', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Merge PDFs' })).toBeVisible();

    await expect(page.locator('h1')).toHaveText('PDF Tool');
    await expect(page.getByText(/PDF Buddy/)).toBeVisible();
  });
});