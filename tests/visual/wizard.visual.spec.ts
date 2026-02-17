import { expect, test, type Page } from '@playwright/test';

async function goToListPage(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('Enter character name').fill('Snapshot Hero');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Ability Scores (Manual, 3-18)' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Race' })).toBeVisible();
}

async function goToDetailPage(page: Page) {
  await goToListPage(page);
  await page.getByLabel('Human').click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Class' })).toBeVisible();
  await page.getByLabel('Fighter (Level 1)').click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Feat' })).toBeVisible();
  await page.getByLabel('Weapon Focus (Longsword)').click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Equipment', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
}

test.describe('wizard visual regression', () => {
  test('home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('list page', async ({ page }) => {
    await goToListPage(page);
    await expect(page).toHaveScreenshot('list.png', { fullPage: true });
  });

  test('detail page', async ({ page }) => {
    await goToDetailPage(page);
    await expect(page).toHaveScreenshot('detail.png', { fullPage: true });
  });
});
